/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// core libs
const path = require('path');

// framework libs
const { AbstractFixture } = require('@conga/framework-bass');

/**
 * This fixture loads dummy users and administrators
 */
module.exports = class LocalAccountFixture extends AbstractFixture {

    /**
     * Get the priority order to run this fixture on
     * @returns {Number}
     */
    getOrder() {
        return 1;
    }

    /**
     * Ge tthe name of the model that this fixture is for
     * @returns {String}
     */
    getModelName() {
        return 'RecordingAccount';
    }

    /**
     * Load the data into the database
     * @param {function} next The callback function
     * @returns {void}
     */
    load(next) {

        const manager = this.getManager();

        const account = manager.createDocument('RecordingAccount', {
            roles: ['ROLE_CLIENT_PROFILER_ACCOUNT', 'ROLE_CLIENT_PROFILER_API'],
            email: 'developer@conga',
            password: 'conga',
            firstName: 'Conga',
            lastName: 'Developer'
        });

        manager.persist(account);

        const port = this.container.get('config').get('framework').app.port;

        // TODO: get hosts from config
        // local host
        let website = manager.createDocument('RecordingWebsite', {
            publicKey: 'public-key',
            secretKey: 'secret-key',
            host: 'localhost' + (port != 80 ? ':' + port : '')
        });
        website.account = account;
        manager.persist(website);

        // dashboard
        website = manager.createDocument('RecordingWebsite', {
            publicKey: 'public-key',
            secretKey: 'secret-key',
            host: 'localhost:4000'
        });
        website.account = account;
        manager.persist(website);

        // TODO: remove me
        const strategy = manager.createDocument('RecordingWebsite', {
            publicKey: 'public-key',
            secretKey: 'secret-key',
            host: 'strategy.dev'
        });

        strategy.account = account;

        manager.persist(strategy);

        manager.flush().then(next).catch(err => {
            console.error(err.stack || err);
        });
    }
};