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

// framework libs
const { ErrorResponse, Controller }  = require('@conga/framework');

/**
 * The dashboard controller handles all the routes necessary for the backend profiler panel's view
 *
 * @Route('/_conga/profiler/client')
 *
 * @Firewall(realm="client_profiler_dashboard",
 *           roles=["ROLE_PROFILER"],
 *           stateless=false,
 *           shared=true,
 *           authenticator="@profiler.security.authenticator",
 *           provider="@profiler.security.provider")
 *
 */
module.exports = class ClientProfilerController extends Controller {
    /**
     * Get the profiler storage manager
     * @returns {Manager}
     */
    get manager() {
        return this.container.get('profiler').getStorageManager(true);
    }

    /**
     * @Route("/sessions", methods=["GET"])
     */
    sessions(req, res) {
        const data = {
            sessions: [],
            accounts: {},
            websites: {},
            token: this.container.get('security.context').getAuthToken()
        };
        const manager = this.manager;
        return manager.findBy('RecordingSession', {}, {createdAt: -1}, 0, 10).then(sessions => {
            data.sessions = sessions;
            return Promise.all(sessions.reduce((p, session) => {
                if (!(session.websiteId in data.websites)) {
                    p.push(manager.find('RecordingWebsite', session.websiteId).then(website => {
                        data.websites[website.id] = website;
                        data.accounts[website.account.id] = website.account;
                        website.accountId = website.account.id;
                        delete website.account;
                    }));
                }
                return p;
            }, [])).then(all => data);
        });
    }

    /**
     * @Route("/session/:sessionId", methods=["GET"])
     */
    session(req, res) {
        const manager = this.manager;
        const token = this.container.get('security.context').getAuthToken();
        return manager.find('RecordingSession', req.params.sessionId).then(session => {
            if (!session) {
                return Promise.reject(this.buildErrorResponse(null, 404, 'Session Not Found'));
            }
            const data = {
                token,
                session,
                account: null,
                website: null,
                recordings: []
            };
            return Promise.all([

                manager.findBy('Recording', {sessionId: session.id}, {createdAt: 1})
                    .then(recordings => {
                        const p = [];
                        for (const recording of recordings) {
                            p.push(new Promise((resolve, reject) => {
                                // TODO: this needs a service
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
                                                //console.log(str);
                                                console.error(e.stack || e);
                                                return null;
                                            }
                                        });
                                    } catch (e) {
                                        //console.log(buff.toString('ascii'));
                                        console.error(e.stack || e);
                                        reject(e);
                                        return;
                                    }
                                    /* NOTE: the server should be using gzip for the entire HTTP response
                                             payload so we don't compress the payload buffer */

                                    const data = Object.assign({payload}, recording);
                                    delete data.compressed;
                                    resolve(data);
                                });
                            }))
                        }
                        return Promise.all(p).then(recordings => data.recordings = recordings);
                    }),

                manager.find('RecordingAccount', session.accountId)
                    .then(account => data.account = account),

                manager.find('RecordingWebsite', session.websiteId)
                    .then(website => data.website = website)

            ]).then(all => data);
        });
    }
}
