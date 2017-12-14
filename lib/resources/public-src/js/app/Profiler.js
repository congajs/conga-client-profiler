/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { DomEventManager } from './dom/DomEventManager';
import { XhrManager } from './xhr/XhrManager';
import { ConsoleManager } from './console/ConsoleManager';
import { ErrorManager } from './error/ErrorManager';
import { CORSWorker } from './CORSWorker';
import { ProfilerLoadEvent } from './ProfilerLoadEvent';

/**
 * The profiler constantly gathers information about the browser and sends it to a worker
 */
export class Profiler {
    /**
     *
     * @param {Object} [options] Custom options
     */
    constructor(options = {}) {
        this.options = options || {};
        this._manager = {};
        this.eventHandler({
            type: 'profiler',
            event: new ProfilerLoadEvent({ url: location.href }),
            data: {
                options: JSON.parse(JSON.stringify(this.options))
            }
        });
    }

    /**
     * Get the worker instance
     * @returns {Worker|CORSWorker}
     */
    get worker() {
        if (!this._worker) {
            // TODO: check to see if CORSWorker is needed first, otherwise use Worker()
            this._worker = new CORSWorker(this.getWorkerPath());
            //this._worker = new Worker(this.getWorkerPath());
            this._worker.onmessage = evt => {
                if (this.options.message instanceof Function) {
                    this.options.message(evt.data);
                }
            };
        }
        return this._worker;
    }

    /**
     * Get the path to the web worker script (iframe bridge)
     * @returns {String}
     */
    getWorkerPath() {
        let path = '/recording/worker/bridge';
        if (this.options.url) {
            path = this.options.url.replace(/\/$/g, '') + path;
        }
        return path;
        //return this.options.worker || '/dist/conga-client-profiler-worker.bundle.js';
    }

    /**
     * Get the error manager
     * @returns {ErrorManager}
     */
    getErrorManager() {
        if (!this._manager.error) {
            this._manager.error = new ErrorManager(Object.assign({}, this.options.error || {}, {
                event: evt => this.errorHandler(evt)
            }));
        }
        return this._manager.error;
    }

    /**
     * Get the event manager
     * @returns {DomEventManager}
     */
    getDomEventManager() {
        if (!this._manager.event) {
            this._manager.event = new DomEventManager(Object.assign({}, this.options.event || {}, {
                event: evt => this.eventHandler(evt),
                unload: () => this.worker.postMessage('unload')
            }));
        }
        return this._manager.event;
    }

    /**
     * Get the XHR manager
     * @returns {XhrManager}
     */
    getXhrManager() {
        if (!this._manager.xhr) {
            this._manager.xhr = new XhrManager(Object.assign({}, this.options.xhr || {}, {
                event: evt => this.eventHandler(evt)
            }));
        }
        return this._manager.xhr;
    }

    /**
     * Get the console manager
     * @returns {ConsoleManager}
     */
    getConsoleManager() {
        if (!this._manager.console) {
            this._manager.console = new ConsoleManager(Object.assign({}, this.options.console || {}, {
                event: evt => this.eventHandler(evt)
            }));
        }
        return this._manager.console;
    }

    /**
     * Handle incoming events
     * @param {Object} payload The event payload object
     * @returns {void}
     */
    eventHandler(payload) {
        if (!payload || !payload.event) {
            throw new Error('no event');
        }
        this.worker.postMessage({
            payload: {
                type: payload.type,
                data: payload.data,
                eventPayload: payload.event.toJSON()
            },
            readyState: document.readyState,
            // TODO: e.performance||e.msPerformance||e.webkitPerformance||e.mozPerformance
            memory: window.performance.memory && {
                // https://stackoverflow.com/questions/25389096/why-is-memory-usage-not-correctly-updated
                jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit,
                totalJSHeapSize: window.performance.memory.totalJSHeapSize,
                usedJSHeapSize: window.performance.memory.usedJSHeapSize
            }
        });
        if (this.options.event instanceof Function) {
            this.options.event(event);
        }
    }

    /**
     * Handle incoming errors
     * @param {ErrorProfilerEvent} event The error event
     * @returns {void}
     */
    errorHandler(event) {
        this.eventHandler(event);
        if (this.options.error instanceof Function) {
            this.options.error(event);
        }
    }

    /**
     * Start the profiler
     * @returns {void}
     */
    start() {

        // TODO: hook up the stopwatch into window.performance.stopwatch

        this.getErrorManager().start();
        this.getConsoleManager().start();
        this.getDomEventManager().start();
        this.getXhrManager().start();
    }

    /**
     * Stop the profiler
     * @returns {void}
     */
    stop() {
        this.getErrorManager().stop();
        this.getConsoleManager().stop();
        this.getDomEventManager().stop();
        this.getXhrManager().stop();
    }
}