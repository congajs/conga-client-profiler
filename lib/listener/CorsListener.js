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

/**
 * Add CORS response headers
 * @param {Container} container The service container
 * @param {Object} request Express request object
 * @param {Object} response Express response object
 * @returns {void}
 */
const addResponseHeaders = (container, request, response) => {
    // TODO
    // const config = container.get('config').get('profiler').client || {};
    // if (config.cors === false) {
    //     return;
    // }
    // const url = new URL(request.protocol + '://' + request.hostname + request.originalUrl);
    // if (Array.isArray(config.cors) && config.cors.indexOf(url.host) === -1) {
    //     return;
    // }
    response.header('Access-Control-Allow-Credentials', 'true');
    response.header('Access-Control-Allow-Methods', '"GET,HEAD,PUT,PATCH,POST,DELETE"');
    response.header('Access-Control-Expose-Headers', 'Content-Length');
    response.header('Access-Control-Allow-Origin', '*');
};

/**
 * Cross Origin Sharing
 */
class CorsListener {
    /**
     * Add a CORS header on every response (when applicable)
     * @param {Container} container The service container
     * @param {Object} app The express app
     * @param {Function} next The callback function
     * @returns {void}
     */
    onKernelRegisterMiddleware(container, app, next) {
        app.use(function(req, res, fn) {
            addResponseHeaders(container, req, res);
            if (req.method === 'OPTIONS') {
                return res.send(200);
            }
            return fn();
        });
        next();
    }

    /**
     * Add a CORS header on every response (when applicable)
     * @param {Object} event
     * @param {Function} next
     * @returns {void}
     */
    handleCorsHeader(event, next) {
        addResponseHeaders(event.container, event.request, event.response);
        next();
    }
}

module.exports = CorsListener;