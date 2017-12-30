/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// third party libs
const lz = require('lz-string');

// local libs
import { EventBuffer } from './app/EventBuffer.js';

/**
 *
 * @type {EventBuffer}
 */
const buffer = new EventBuffer();

/**
 * Compressed event data queued for storage
 * @type {Array}
 */
let compressed = [];

/**
 * The total duration for all the events not yet flushed
 * @type {number}
 */
let duration = 0;

/**
 * Know if the buffer found an error
 * @type {Boolean}
 */
let error = false;

/**
 * Our session, received from the server
 * @type {String|Number}
 */
let session;

/**
 * EventManager Options
 * @type {Object}
 */
let options = {};

/**
 * The origin URL is the website we are profiling
 * @type {String}
 */
let origin;

/**
 * Number of compressed items to buffer before flushing to server
 * @type {Number}
 */
const FLUSH_COMPRESSED_THRESHOLD = 3;

/**
 * Maximum time to wait before flushing to server
 * @type {Number}
 */
const FLUSH_COMPRESSED_TIMER = 10000;   // 10sec

/**
 * Hold on to the last known style-sheets to reduce payload sizes
 * @type {String}
 */
let styleSheets = null;

/**
 * Hold on to the last known full snapshot to reduce payload sizes
 * @type {String}
 */
let snapshot = null;

/**
 * Add data to the buffer
 * @param {Object} data
 * @returns {Promise}
 */
const addBufferData = data => {
    // save the event to buffer
    buffer.add(data);

    // track the on-going duration until we flush-compressed
    duration += buffer.getLastDuration();

    // track the error state on the buffer
    error = error || buffer.error;

    // send to server and clear the buffer if we "should flush"
    if (buffer.shouldFlush()) {
        return flush(buffer.clear());
    }

    return Promise.resolve();
};

/**
 * Send an error message back to the client
 * @param {Error} error The error that we caught or are raising
 * @param {String} action The last action we responded to
 * @returns {Error} The error that was passed in
 */
const sendError = (error, action) => {
    self.postMessage({
        action,
        error: error.stack || JSON.parse(JSON.stringify(error)),
        message: error.message
    });
    return error;
};

/**
 * Make an XHR request with credentials
 * @param {String} method The HTTP method (GET, POST)
 * @param {String} url The URL to request
 * @param {Boolean} async Asynchronous or synchronous (never synchronous!)
 * @param {*} data Data to send with xhr
 * @param {Function} callback The error-first callback function
 * @returns {XMLHttpRequest}
 */
const request = (method, url, async, data, callback) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            try {
                callback(null, JSON.parse(xhr.responseText));
            } catch (err) {
                callback(err, null);
            }
        }
    });
    xhr.open(method, url, async);
    if (method === 'POST') {
        if (data instanceof FormData) {
            xhr.setRequestHeader('Content-Type', 'multipart/form-data');
        } else {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
    } else {
        xhr.setRequestHeader('Content-Type', 'application/json');
    }
    if (origin) {
        xhr.setRequestHeader('X-Worker-Origin', origin);
    }
    if (session && session !== -1) {
        xhr.setRequestHeader('X-Worker-Session', session.sessionId);
    }
    xhr.send(data);
    return xhr;
};

/**
 * Get the session (creates a new session on the server)
 * @returns {Promise}
 */
const getSession = () => {
    if (session) {
        return Promise.resolve(session);
    }
    return new Promise((resolve, reject) => {
        if (session === -1) {
            return;
        }
        session = -1;
        request('GET', '/_conga/client/profiler/api/events/session', true, null, (err, json) => {
            if (err) {
                reject(sendError(err, 'getSession'));
                return;
            }
            session = json;
            resolve(json);
            flushCompressed().catch(err => sendError(err, 'getSession'));
        });
    });
};

/**
 * Flush the data into the compressed queue
 * @param {Object} data
 * @returns {Promise}
 */
const flush = data => {
    return new Promise((resolve, reject) => {
        if (data.buffer.length === 0) {
            resolve();
            return;
        }

        let json;
        try {
            json = JSON.stringify(data);
        } catch (e) {
            reject(sendError(e, 'flush'));
            return;
        }

        compressed.push(lz.compress(json));

        /* if we are recording, we send everything to the server when we get it.

           if we're not recording, we only send up the compressed buffer
           when it meets a threshold */

        self.postMessage({message: 'flushed', action: 'flush'});

        if (buffer.recording || compressed.length >= FLUSH_COMPRESSED_THRESHOLD) {
            flushCompressed().then(resolve).catch(reject);
            return;
        }

        resolve();
    });
};

/**
 * Flush the compressed queue to the server
 * @returns {Promise}
 */
const flushCompressed = () => {
    if (flushCompressed.timer) {
        flushCompressed.timer = clearTimeout(flushCompressed.timer);
    }

    return new Promise((resolve, reject) => {

        if (compressed.length === 0) {
            resolve();
            return;
        }

        if (!(session instanceof Object)) {
            if (session !== -1) {
                return reject(sendError(new Error('No Session'), 'flushCompressed'));
            }
            flushCompressed.timer = setTimeout(flushCompressed, FLUSH_COMPRESSED_TIMER);
            resolve();
            return;
        }

        let payload;
        try {
            payload = lz.compressToEncodedURIComponent(JSON.stringify({
                error,
                duration,
                eventBuffer: compressed.map(c => JSON.parse(lz.decompress(c)))
            }));
            compressed = [];
            duration = 0;
            error = false;
        } catch (e) {
            reject(sendError(e, 'flushCompressed'));
            return;
        }

        // const data = new FormData();
        // data.set('payload', payload);
        // data.set('error', buffer.error ? '1': '0');

        let dataStr = 'payload=' + payload.replace(/%20/g, '+');
        dataStr += '&error=' + buffer.error ? '1' : '0';

        let path = '/_conga/client/profiler/api/events/' + encodeURIComponent(session.profilerId);

        request('POST', path, true, dataStr, (err, json) => {

            flushCompressed.timer = setTimeout(flushCompressed, FLUSH_COMPRESSED_TIMER);

            if (err) {
                reject(sendError(err, 'flushCompressed'));
                return;
            }

            if (json.error || !json.success) {
                reject(sendError(new Error(json.message), 'flushCompressed'));
                return;
            }

            self.postMessage({message: 'flushed', action: 'flushCompressed'});
            resolve(json);
        });
    });
};

/**
 * Respond to incoming messages
 */
self.addEventListener('message', message => {

    // flush the buffer on unload
    if (message.data === 'unload') {
        // TODO : compression takes too long so the browser unloads before the post is sent (maybe we should flush on mousedown? - websocket will fix for sure, every event sends right away and socket keeps the buffer)
        return flush(buffer.clear())
            .catch(() => true)
            .then(flushCompressed)
            .then(() => self.close())
            .catch(() => self.close());
    }

    // the data payload must be an object to go further
    if (!(message.data instanceof Object)) {
        const err = new Error('Invalid Error');
        self.postMessage({
            error: err.stack || JSON.parse(JSON.stringify(err)),
            message: err.message,
            payload: message.data
        });
        return;
    }

    const data = message.data;

    // handle event payloads
    if (data.payload) {
        const payload = data.payload;
        const eventPayload = payload.eventPayload;
        const metadata = eventPayload.metadata;

        //console.log('payload', payload);

        if (payload.type === 'profiler') {
            if (eventPayload.event.type === 'load') {
                origin = eventPayload.event.url;
                // NOTE: options should contain the profiler-id
                options = payload.data.options;
                return getSession().then(() => addBufferData(data));
            }
        } else {
            // we need to process the payload to remove redundant data
            if (metadata.styleSheets) {
                const json = JSON.stringify(metadata.styleSheets);
                if (!styleSheets || json !== styleSheets) {
                    styleSheets = json;
                }
                metadata.styleSheets = null;
                delete metadata.styleSheets;
            }
            if (metadata.snapshot && metadata.isDocument) {
                if (!snapshot || metadata.snapshot !== snapshot) {
                    snapshot = metadata.snapshot;
                } else {
                    metadata.snapshot = null;
                    delete metadata.snapshot;
                }
            }
        }

        return addBufferData(data);
    }

    // invalid payload
    const err = new Error('Invalid Message');
    self.postMessage({
        error: err.stack || JSON.parse(JSON.stringify(err)),
        message: 'Invalid Message',
        payload: data
    });

});