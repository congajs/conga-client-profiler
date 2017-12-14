/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// core libs
const fs = require('fs');
const zlib = require('zlib');
const url = require('url');

// framework libs
const { Controller, ErrorResponse } = require('@conga/framework');
const { StopwatchPeriod } = require('@conga/framework-profiler').Stopwatch;

/**
 * Amount of time to keep in the buffer at all times
 * @type {number}
 */
const BUFFER_TIME = 10000;  // 10 seconds

/**
 *
 * @Route("/_conga/client/profiler/events/playback")
 *
 * @Firewall(realm="conga_client_profiler",
 *           roles=["ROLE_PROFILER"],
 *           stateless=false,
 *           shared=true,
 *           authenticator="@profiler.security.authenticator",
 *           provider="@profiler.security.provider")
 *
 */
class EventPlaybackController extends Controller {

    stream(sessionId, buffer, time, duration = 0, index = 0) {
        if (duration >= BUFFER_TIME) {
            // if we have a full buffer, in half as much time, fetch more
            return setTimeout(() => {
                duration = Math.max(0, duration - (BUFFER_TIME / 2));
                this.stream(sessionId, buffer, StopwatchPeriod.microtime(), duration, index);
            }, BUFFER_TIME / 2);
        }

        const manager = this.container.get('profiler').getStorageManager();
        manager.findBy('Recording', {sessionId}, {createdAt: -1}, index, 1).then(recordings => {

            // update the duration with our process time
            duration = Math.max(0, duration - (StopwatchPeriod.microtime() - time));
            const offsetTime = StopwatchPeriod.microtime();

            // if we don't have any more recordings, try for more after a delay
            if (!recordings || recordings.length === 0) {
                return setTimeout(() => {
                    duration = Math.max(0, duration - (BUFFER_TIME / 2));
                    this.stream(sessionId, buffer, StopwatchPeriod.microtime(), duration, index);
                }, BUFFER_TIME / 2);
            }

            const [ recording ] = recordings;

            duration += recording.duration;
            buffer.write(recording.compressed, buffer._offset);

            this.stream(sessionId, buffer, offsetTime, duration, index + 1);

        }).catch(err => {
            this.container.get('logger').error(err.stack || err);
        });
    }

    /**
     *
     * @-Route("/:sessionId", name="events.playback.stream", methods=["GET"])
     */
    eventPlaybackStream(req, res) {
        const manager = this.container.get('profiler').getStorageManager();
        manager.find('RecordingSession', req.params.sessionId).then(session => {
            if (!session) {
                res.error(ErrorResponse.fromError(new Error('Not Found'), 404));
                return;
            }

            // data is compressed as gzip
            res.header('encoding', 'gzip');

            // stream from the DB to the buffer continuously
            const buffer = Buffer.alloc(session.bytes);
            buffer.__offset = 0;
            this.stream(req.params.sessionId, buffer, StopwatchPeriod.microtime());

            // stream the buffer to the client continuously
            const readStream = fs.createReadStream(buffer);
            readStream.on('close', () => res.end());
            readStream.pipe(res);
        });
    }

    /**
     *
     * @Route("/api/:sessionId", name="events.get", methods=["GET"])
     * @Route("/api/:sessionId/:index", name="events.get.index", methods=["GET"])
     */
    getEvents(req, res) {
        const manager = this.container.get('profiler').getStorageManager(true);
        const index = !isNaN(req.params.index) ? parseInt(req.params.index, 10) : 0;
        const sessionId = req.params.sessionId;
        return new Promise((resolve, reject) => {
            manager.findBy('Recording', {sessionId}, {createdAt: 1}, index, 1).then(docs => {
                if (!docs || docs.length === 0) {
                    reject(ErrorResponse.fromError(new Error('Not Found'), 404));
                    return;
                }
                const [recording] = docs;
                zlib.gunzip(recording.compressed, (err, buff) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    let payload;
                    try {
                        payload = JSON.parse(buff.toString('ascii'));
                        payload.eventBuffer = payload.eventBuffer.map(str => {
                            if (typeof str !== 'string') {
                                return str;
                            }
                            try {
                                return JSON.parse(str);
                            } catch (e) {
                                console.log(str);
                                console.error(e.stack || e);
                                return null;
                            }
                        });
                    } catch (e) {
                        console.log(buff.toString('ascii'));
                        console.error(e.stack || e);
                        reject(e);
                        return;
                    }
                    /* NOTE: the server should be using gzip for the entire HTTP response
                             payload so we don't compress the payload buffer */
                    resolve({
                        id: recording.id,
                        sessionId: recording.sessionId,
                        websiteId: recording.websiteId,
                        url: recording.url,
                        duration: recording.duration,
                        hasError: recording.hasError,
                        createdAt: recording.createdAt,
                        payload
                    });
                });
            });
        });
    }

    /**
     *
     * @Route("/:sessionId", name="playback", methods=["GET"])
     * @Template
     */
    playback(req, res) {
        const sessionId = req.params.sessionId;
        const manager = this.container.get('profiler').getStorageManager(true);
        return Promise.all([
            manager.findCountBy('Recording', {sessionId}),
            manager.find('RecordingSession', sessionId)
        ]).then(all => {
            const [ payloadCount, session ] = all;
            if (!session) {
                return Promise.reject(ErrorResponse.fromError(new Error('Not Found'), 404));
            }
            return {
                session: {
                    id: session.id,
                    websiteId: session.websiteId,
                    url: {
                        full: session.url,
                        parsed: url.parse(session.url, true)
                    },
                    duration: session.duration,
                    hasError: session.hasError,
                    createdAt: session.createdAt,
                    payloadCount
                }
            };
        });
    }
}

module.exports = EventPlaybackController;