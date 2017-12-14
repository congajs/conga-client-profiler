/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// third party libs
const MutationSummary = require('mutation-summary');

// local libs
import { AbstractProfilerEvent } from './../AbstractProfilerEvent';
import { DomEventFactory } from './DomEventFactory';
import { ReadyStateEvent } from './type/ReadyStateEvent';

/**
 * Default events to listen for
 * @type {Object}
 */
const DEFAULT_EVENTS = {
    window: [
        'load',
        'wheel','scroll','resize','copy','cut','paste','hashchange',
        'online','offline','popstate'
    ],
    document: [
        'readystatechange',
        'mousemove','mouseenter','mouseleave','mousedown','mouseup','mouseover','mouseout',
        'click','dblclick','auxclick','contextmenu',
        'dragstart','drag','dragend','dragenter','dragover','dragleave','drop',
        'keydown','keyup','keypress','select',
        'touchstart','touchcancel','touchend','touchmove'
    ]
};

/**
 * The dom event manager listens for DOM events and mutations
 */
export class DomEventManager {
    /**
     * The default events exposed
     * @returns {Object}
     */
    static get DEFAULT_EVENTS() {
        return DEFAULT_EVENTS;
    }

    /**
     *
     * @param {Object} options Custom options
     */
    constructor(options) {
        this.options = options;
        this.hasSnapshot = false;
        this.isObserverStarted = false;
        //this.observer = new MutationObserver(mutation => this.mutationHandler(mutation));
        this.events = Object.assign({}, this.constructor.DEFAULT_EVENTS, options.events || {});
        this._eventHandler = evt => this.eventHandler(evt);
        this._unloadHandler = evt => {
            if (this.options.unload instanceof Function) {
                this.options.unload();
            }
            this.eventHandler(evt);
        };
    }

    /**
     * Start the manager
     * @returns {void}
     */
    start() {
        this.bindEvents();
        this.startObserver();
    }

    /**
     * Start the observer
     * @returns {Boolean}
     */
    startObserver() {
        // NOTE: bypassing the observer for now
        if (true || this.isObserverStarted) {
            return true;
        }
        try {
            this.observer = new MutationSummary({
                callback: summary => this.mutationHandler(summary),
                queries: [{all: true}]
            });
            this.isObserverStarted = true;
            return true;
        } catch (e) {
            console.error(e.stack || e);
            return false;
        }
        // this.observer.observe(document.body, {
        //     childList: true,
        //     attributes: true,
        //     // attributeFilter: [
        //     //     'style','id','class','src','href','rel','type','name','value','disabled',
        //     //     'width','height','border'
        //     // ],
        //     subtree: true,
        //     attributeOldValue: true,
        //     characterData: false,
        //     characterDataOldValue: false
        // });
    }

    /**
     * Stop the manager
     * @returns {void}
     */
    stop() {
        this.unbindEvents();
        this.observer.disconnect();
        this.isObserverStarted = false;
    }

    /**
     * Bind all the events we are listening for
     * @returns {void}
     */
    bindEvents() {
        for (const target in this.events) {
            const node = target === 'document' ? document : window;
            for (const event of this.events[target]) {
                node.addEventListener(event, this._eventHandler);
            }
        }
        window.addEventListener('beforeunload', this._unloadHandler);
    }

    /**
     * Unbind all the events we are listening for
     * @returns {void}
     */
    unbindEvents() {
        for (const target in this.events) {
            const node = target === 'document' ? document : window;
            for (const event of this.events[target]) {
                node.removeEventListener(event, this._eventHandler);
            }
        }
        window.removeEventListener('beforeunload', this._unloadHandler);
    }

    /**
     * Get common global data for an event payload
     * @returns {Object}
     */
    getGlobalDataForEvent() {
        return {
            width: window.outerWidth || window.width,
            height: window.outerHeight || window.height,
            scrollTop: 'scrollY' in window ? window.scrollY : document.body.scrollTop,
            scrollLeft: 'scrollX' in window ? window.scrollX : document.body.scrollLeft
        };
    }

    /**
     * Handle incoming events
     * @param {Event|Object|*} event The JS event object
     * @returns {void}
     */
    eventHandler(event) {
        if (!(event instanceof AbstractProfilerEvent)) {
            event = DomEventFactory.eventFromDOM(event);
        }
        if (!this.isObserverStarted) {
            // make sure the observer is started before we continue
            this.startObserver();
        }
        if (!this.hasSnapshot) {
            if (event.hasSnapshot) {
                this.hasSnapshot = true;
            } else {
                // add a snapshot event
                this.captureSnapshot();
            }
        }
        event.capture().then(() => {
            this.options.event({
                event,
                type: 'dom',
                data: this.getGlobalDataForEvent()
            });
        }).catch(err => console.error(err.stack || err));
    }

    /**
     * Handle an observed recording event (mutation)
     * @param {MutationRecord} mutation
     * @returns {void}
     */
    mutationHandler(mutation) {
        console.log('mutation', mutation);
        if (!this.hasSnapshot) {
            this.captureSnapshot();
        }
        if (!Array.isArray(mutation)) {
            mutation = [mutation];
        }
        // need to summarize the mutation
        for (let item of mutation) {
            const event = DomEventFactory.eventFromMutation(item);
            event.capture().then(() => {
                this.options.event({
                    event,
                    type: 'list',
                    data: this.getGlobalDataForEvent()
                });
            }).catch(err => console.error(err.stack || err));
        }
    }

    /**
     * Capture a snapshot of the document using ReadyStateEvent
     * @returns {Promise}
     */
    captureSnapshot() {
        // TODO: bypass the snapshot for now
        return Promise.resolve();

        // TODO: don't use the ready state event for this... ugh
        const event = new ReadyStateEvent({
            type: 'readystatechange',
            target: document,
            timeStamp: window.performance.now()
        });
        return event.capture().then(() => {
            if (event.metadata.snapshot &&
                event.metadata.snapshot.length !== 0 &&
                event.metadata.snapshot !== 'undefined'   // NOTE: checking for the string value
            ) {
                this.hasSnapshot = true;
                this.options.event({
                    event,
                    type: 'dom',
                    data: this.getGlobalDataForEvent()
                });
            }
        }).catch(err => {
            console.error(err.stack || err);
            this.hasSnapshot = err;
            return Promise.reject(err);
        });
    }
}