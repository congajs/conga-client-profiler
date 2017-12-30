/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// core libs
const zlib = require('zlib');
const crypto = require('crypto');

// framework libs
const { Controller, ErrorResponse } = require('@conga/framework');

// external libs
const lz = require('lz-string');
const useragent = require('useragent');

/**
 *
 * @Route("/_conga/client/profiler/api/events")
 *
 * @Firewall(realm="client_profiler_api",
 *           shared=false,
 *           stateless=false,
 *           roles="ROLE_CLIENT_PROFILER_API",
 *           provider="@profiler.client.security.provider.event_api",
 *           authenticator="@profiler.client.security.authenticator.event_api")
 */
class EventApiController extends Controller {
    /**
     *
     * @Route("/session", name="events.session", methods=["GET"])
     */
    getSession(req, res) {
        if (req.session.get('recording-session')) {
            return Promise.resolve(req.session.get('recording-session'));
        }
        return new Promise((resolve, reject) => {
            crypto.randomBytes(15, (err, buff) => {
                if (err) {
                    reject(err);
                    return;
                }
                const rand = crypto.createHash('md5').update(buff.toString('hex')).digest('hex');
                const security = this.container.get('security.context').getAuthToken();
                const manager = this.container.get('profiler').getStorageManager(true);
                const browser = useragent.parse(req.headers['user-agent']);
                const { os, device, ...agent } = browser.toJSON();
                const document = manager.createDocument('RecordingSession', {
                    originUrl: req.headers['x-worker-origin'] || req.headers.referer,
                    url: req.headers.referer,
                    accountId: security.resource.account.id,
                    websiteId: security.resource.id,
                    profilerId: rand,
                    ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    userAgent: req.headers['user-agent'],
                    browser: Object.assign({}, {
                        os,
                        device,
                        agent,
                        is: useragent.is(req.headers['user-agent'])
                    }),
                    pageCount: 0,
                    pages: [],
                    bytes: 0,
                    duration: 0,
                    hasError: false
                });
                manager.persist(document);
                manager.flush(document).then(() => {
                    const session = {
                        sessionId: document.id,
                        accountId: document.accountId,
                        websiteId: document.websiteId,
                        profilerId: document.profilerId
                    };
                    req.session.set('recording-session', session);
                    req.session.save();     // TODO: this should not be necessary
                    resolve(session);
                }).catch(reject);
            });
        });
    }

    /**
     *
     * @Route("/:profilerId", name="events.save", methods=["POST"])
     */
    saveEvents(req, res) {
        // clients must get a session first
        if (!req.session.has('recording-session')) {
            return Promise.reject(ErrorResponse.fromError(new Error('Unauthorized'), 401));
        }

        // security (sanity) checks
        const security = this.container.get('security.context').getAuthToken();
        const session = req.session.get('recording-session');
        // TODO: if no session, create one here
        if (!session ||
            security.resource.id !== session.websiteId ||
            security.resource.account.id !== session.accountId ||
            req.params.profilerId !== session.profilerId
        ) {
            return Promise.reject(ErrorResponse.fromError(new Error('Access Denied'), 403));
        }

        return new Promise((resolve, reject) => {

            // extract the data from the payload
            let json;
            try {
                json = JSON.parse(lz.decompressFromEncodedURIComponent(req.body.payload));
            } catch (e) {
                return reject(e);
            }

            // aggregate the page views
            let page;
            const pages = [];
            for (const bufferPayload of json.eventBuffer) {
                // TODO: this should not be needed!  look at binaryInsert
                bufferPayload.buffer.sort((a,b) => {
                    a = a.payload.eventPayload.metadata.time;
                    b = b.payload.eventPayload.metadata.time;
                    return a - b;
                });
                let bufferEventIdx = 0;
                for (const buffer of bufferPayload.buffer) {
                    const payload = buffer.payload;
                    const eventPayload = payload.eventPayload;
                    const metadata = eventPayload.metadata;
                    payload.bufferPageIdx = pages.length;
                    if (metadata.isHistoryEvent ||
                         (payload.type === 'profiler' && eventPayload.event.type === 'load')
                    ) {
                        page = {
                            bufferEventIdx,
                            url: metadata.url,
                            timeStamp: eventPayload.event.timeStamp,
                            startTime: metadata.time
                        };
                        pages.push(page);
                        payload.isNewPage = true;
                    }
                    bufferEventIdx += 1;
                }
            }

            // store the payload with GZIP compression
            zlib.gzip(Buffer.from(JSON.stringify(json)), (err, gzip) => {
                if (err) {
                    resolve(err);
                    return;
                }

                const bytes = gzip.length;

                // use the profiler manager
                const manager = this.container.get('profiler').getStorageManager(true);

                // save the payload as a "recording" which is really just a partial
                const recording = manager.createDocument('Recording', {
                    sessionId: session.sessionId,
                    profilerId: session.profilerId,
                    accountId: security.resource.account.id,
                    websiteId: security.resource.id,
                    ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    originUrl: req.headers['x-worker-origin'] || req.headers.referer,
                    url: pages.length ? pages[pages.length - 1] : null,
                    duration: json.duration || 0,
                    hasError: !!json.error,
                    stats: [],
                    pageCount: pages.length,
                    pages,
                    bytes
                });

                recording.compressed = gzip;

                manager.persist(recording);
                manager.flush(recording).then(() => {

                    resolve({success: true});

                    process.nextTick(() => {
                        // update the recording-session's byte count, duration, hasError, etc...
                        const update = {
                            '$inc': {
                                bytes,
                                duration: json.duration || 0,
                                version: 1,
                                pageCount: pages.length
                            },
                            '$set': {updatedAt: new Date()}
                        };
                        if (json.error) {
                            update['$set'].hasError = true;
                        }
                        manager.updateBy('RecordingSession', {id: session.sessionId}, update)
                            .catch(err => console.error(err.stack || err));
                    });

                }).catch(reject);
            });
        });
    }
}

module.exports = EventApiController;