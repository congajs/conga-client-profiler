/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { ErrorProfilerEvent } from './ErrorProfilerEvent';

/**
 * The ErrorManager records data from common console methods
 */
export class ErrorManager {
    /**
     *
     * @param {{event:{Function}}} options Custom options
     */
    constructor(options) {
        this.options = options;
        this._onerror = null;
        this._errorHandler = err => this.errorHandler(err);
    }

    /**
     * Start the Console profiler
     * @returns {void}
     */
    start() {
        this.stop();
        this.bindErrorEvent();
    }

    /**
     * Stop the Console Manager
     * @returns {void}
     */
    stop() {
        const onError = this._onerror || (window.onerror && window.onerror._onerror);
        if (onError instanceof Function) {
            window.onerror = onError;
        } else {
            window.onerror = null;
        }
    }

    /**
     * Listen for the error event
     * @returns {Function|undefined|*} The previous error handler function reference
     */
    bindErrorEvent() {
        const _error = window.onerror;
        window.onerror = function(msg, src, line, col, err) {
            let bool = false;
            if (_error instanceof Function) {
                bool = _error(...arguments);
            }
            if (bool) {
                // onerror returned true, so addEventListener('error') won't be called
                // call error handling manually with a special event
                const error = new ErrorEvent(msg, src, line, col, err);
                error.stack = err && err.stack;
                this.errorHandler(error);
            }
            return bool;
        };
        this._onerror = _error;
        window.onerror._onerror = _error;
        window.addEventListener('error', this._errorHandler);
        return _error;
    }

    /**
     * Handle incoming errors
     * @param {ErrorEvent|Error|Event|Object|*} error The error event / object
     * @returns {void}
     */
    errorHandler(error) {
        let stack = error.stack || (error.error && error.error.stack);
        if (!stack) {
            try {
                throw new Error(error.message);
            } catch (err) {
                if (!err.stack) {
                    err = new Error(error.message);
                    stack = err.stack.replace(/^Error:\s*/, '').replace(/[\r\n]+[^\r\n]+[\r\n]+/, '\r\n');
                    error.stack = stack;
                } else {
                    stack = err.stack;
                }
            }
        }
        error.stack = stack;
        this.options.event({
            type: 'error',
            event: new ErrorProfilerEvent(error)
        });
    }
}