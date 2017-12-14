/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// framework libs
const Security = require('@conga/framework-security');

/**
 * The EventApiProvider checks the http referrer via header to match an account
 */
class EventApiProvider extends Security.Provider.AbstractProvider {
    /**
     *
     * @param {Container} container The service container
     */
    constructor(container) {
        super(null);
        this.container = container;
    }

    /**
     * {@inheritDoc}
     * @see AbstractProvider.supportsResource
     */
    supportsResource(resource) {
        if (!(resource instanceof Object)) {
            return false;
        }
        return !!resource.host;
    }

    /**
     * Get the resource that needs to be authenticated
     * @param {*} credentials Object containing host or profilerId
     * @returns {Promise}
     * @see AbstractProvider.getResource
     */
    getResource(credentials) {
        if (typeof credentials === 'string') {
            credentials = {host: credentials};
        }
        let p;
        if (credentials.sessionId) {
            p = this.getResourceFromSession(credentials.sessionId);
        } else if (credentials.host) {
            p = this.getResourceFromHost(credentials.host);
        }
        return p.then(resource => {
            if (!resource) {
                return null;
            }
            return new Security.AuthResourceProxy(resource);
        });
    }

    /**
     * Get a resource from a website host
     * @param {String} host The website host
     * @returns {Promise}
     */
    getResourceFromHost(host) {
        return this.container.get('profiler').getStorageManager()
            .findOneBy('RecordingWebsite', {host});
    }

    /**
     * Get a resource from an existing recording-session id
     * @param {String} sessionId The existing session id
     * @returns {Promise}
     */
    getResourceFromSession(sessionId) {
        const manager = this.container.get('profiler').getStorageManager();
        return manager.find('RecordingSession', sessionId).then(session => {
            if (!session) {
                return null;
            }
            return manager.find('RecordingWebsite', session.websiteId);
        });
    }

    /**
     * {@inheritDoc}
     * @see AbstractProvider.getResource
     */
    refreshResource(resource) {
        return this.getResource({host: resource.host});
    }
}

module.exports = EventApiProvider;