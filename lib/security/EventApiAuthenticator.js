/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// core libs
const { URL } = require('url');

// framework libs
const Security = require('@conga/framework-security');

/**

 X-Worker-Origin:http://localhost:8080/debug.html#view=login
 X-Worker-Session:59dbbeabb7c5b020df1845b6

 */

/**
 * The EventApiAuthenticator is used to authenticate requests to the client profiler event api
 */
class EventApiAuthenticator extends Security.Authenticator.AbstractAuthenticator {
    /**
     * {@inheritDoc}
     * @see Security.Authenticator.AbstractAuthenticator.createToken
     */
    createToken(request, realm = 'CongaProfiler_EventApi') {

        /* NOTE: every request has a referer and an origin, so every request would get a
                 NEW authenticated session, so to fix this we use the x-worker-session header */

        if ('x-worker-session' in request.headers) {
            return Promise.resolve(new Security.Token.PreAuthToken(
                {sessionId: request.headers['x-worker-session']},
                realm
            ));
        }

        /* NOTE: the client-profiler web worker's referer is different, so it uses
                 x-worker-origin */

        let origin = request.headers.referer;
        if ('x-worker-origin' in request.headers) {
            origin = request.headers['x-worker-origin'];
        }

        // if there is no origin header, respond in kind
        if (!origin) {
            return Promise.reject(this.getAccessDeniedError('Unauthorized', 401));
        }

        const url = new URL(origin);
        return Promise.resolve(new Security.Token.PreAuthToken({host: url.host}, realm));
    }
}

module.exports = EventApiAuthenticator;
