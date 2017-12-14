/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { ConsoleEvent } from './ConsoleEvent';

/**
 * The ConsoleManager records data from common console methods
 */
export class ConsoleManager {
    /**
     *
     * @param {{event:{Function}}} options Custom options
     */
    constructor(options) {
        this.options = options;
        this._console = window.console;
    }

    /**
     * Capture a console event
     * @param {Object} event
     * @param {String} [output]
     * @returns {void}
     */
    capture(event, output = null) {
        if (!(this.options.event instanceof Function)) {
            return;
        }
        if (output && output instanceof Object) {
            try {
                output = JSON.parse(JSON.stringify(output));
            } catch (e) {
                output = e.stack || e.message || e;
            }
        }
        // TODO
        // this.options.event({
        //     event: new ConsoleEvent(event),
        //     type: 'console',
        //     data: { output }
        // });
    }

    /**
     * Start the Console profiler
     * @returns {void}
     */
    start() {
        this.stop();

        const console = this._console;
        const capture = this.capture.bind(this);

        window.console = Object.assign({}, console, {
            trace: function() {
                console.trace(...arguments);
                const err = new Error('console.trace');
                const stack = err.stack.replace(/^Error:\s*/, '').replace(/[\r\n]+[^\r\n]+[\r\n]+/, '\r\n');
                capture({type: 'trace'}, stack);
                return stack;
            }
        });

        ['info','log','warn','error','exception'].forEach(type => {
            window.console[type] = function() {
                console.log('got call', type, arguments);
                console[type](...arguments);
                let output = '';
                for (const arg of arguments) {
                    if (typeof arg === 'string') {
                        if (output.length === 0) {
                            output = arg;
                        }
                        break;
                    }
                    output += arg.toString();
                }
                capture({type, arguments}, output);
            };
        });
    }

    /**
     * Stop the Console Manager
     * @returns {void}
     */
    stop() {
        window.console = this._console;
    }
}