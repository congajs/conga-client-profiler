/**
 * The ClientProfilerService handles tasks related to the client profiler, like creating accounts
 */
class ClientProfilerService {
    /**
     *
     * @param {Container} container The service container
     */
    constructor(container) {
        this.container = container;
    }

    /**
     * Get the profiler's bass storage manager
     * @param {boolean} [newSession] true to get a new session, false to use cache
     * @returns {Manager|null}
     */
    getStorageManager(newSession = false) {
        return this.container.get('profiler').getStorageManager(newSession);
    }

    /**
     * Create a new recording account
     * @param {Object} data The data to create the user account with
     * @returns {Promise}
     */
    createAccount(data) {
        const manager = this.getStorageManager();
        const account = manager.createDocument('RecordingAccount', data || {});
        return this.container.get('validator').validate(account).then(() => {
            return manager.findCountBy('RecordingAccount', {email: account.email}).then(num => {
                if (num > 0) {
                    const err = new Error('Validation Error');
                    err.validationErrors = [{
                        message: 'The provided email address is already taken.',
                        property: 'email'
                    }];
                    return Promise.reject(err);
                }
                manager.persist(account);
                return manager.flush(account);
            });
        }).catch(err => {
            if (Array.isArray(err)) {
                // the error will be an array if the validator found errors
                const e = new Error('Validation Error');
                e.validationErrors = err;
                return Promise.reject(e);
            }
            // it's possible that some other error was caught
            return Promise.reject(err);
        });
    }
}

module.exports = ClientProfilerService;