/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { XhrEvent } from './XhrEvent';

/**
 * Get the length of a string in bytes
 * @param {String} str
 * @returns {Number}
 */
const lengthInUtf8Bytes = str => {
    // https://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
    // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
    const m = encodeURIComponent(str).match(/%[89ABab]/g);
    return str.length + (m ? m.length : 0);
};

/**
 * The XhrManager records data from all AJAX requests using XMLHttpRequest
 */
export class XhrManager {
    /**
     *
     * @param {{event:{Function}}} options Custom options
     */
    constructor(options) {
        this.options = options;
    }

    /**
     * Start the XHR Profiler
     * @returns {void}
     */
    start() {
        this.stop();
        const fnEvent = this.options.event;
        const fnReadyState = this.options.readyState;
        const C = XMLHttpRequest;
        const _open = C.prototype.open;
        const _send = C.prototype.send;
        C.prototype.send = function(data) {
            this.__profiler_start_time = window.performance.now();
            return _send.apply(this, arguments);
        };
        C.prototype.open = function(method, url, async, user, password) {
            let timeHeadersReceived;
            const value = _open.apply(this, arguments);
            const capture = event => {
                const time = window.performance.now();
                const startTime = this.__profiler_start_time || 0;
                fnEvent({
                    event: new XhrEvent(event),
                    type: 'xhr',
                    data: {
                        url,
                        method,
                        'async': async,
                        startTime,
                        timeHeadersReceived,
                        duration: time - startTime,
                        responseType: this.responseType,
                        responseStatus: this.status,
                        responseStatusText: this.statusText,
                        responseTextLength: this.responseText.length,
                        responseTextBytes: lengthInUtf8Bytes(this.responseText),
                        contentLength: this.getResponseHeader('Content-Length'),
                        responseHeaders: this.getAllResponseHeaders(),
                        //responseText: this.responseText,      // TODO: I think it's important that we include this data for debugging
                        readyState: this.readyState,
                        withCredentials: this.withCredentials
                    }
                });
            };
            this.addEventListener('load', capture);
            this.addEventListener('abort', capture);
            this.addEventListener('error', capture);
            this.addEventListener('readystatechange', evt => {
                if (this.readyState === XMLHttpRequest.HEADERS_RECEIVED && !timeHeadersReceived) {
                    timeHeadersReceived = window.performance.now();
                }
                if (fnReadyState instanceof Function) {
                    fnReadyState(evt);
                }
            });
            return value;
        };
        C.__profiler_open = _open;
        C.__profiler_send = _send;
    }

    /**
     * Stop the XHR Profiler
     * @returns {void}
     */
    stop() {
        const C = XMLHttpRequest;
        if (C.__profiler_open) {
            C.prototype.open = C.__profiler_open;
            delete C.__profiler_open;
        }
        if (C.__profiler_send) {
            C.prototype.send = C.__profiler_send;
            delete C.__profiler_send;
        }
    }
}