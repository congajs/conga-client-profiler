/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { DomUtil } from './../DomUtil';
import { AbstractProfilerEvent } from "../../AbstractProfilerEvent";

/**
 * Default event keys to include in serialization
 * @type {Array}
 */
export const DEFAULT_EVENT_KEYS = [
    'which', 'altKey', 'ctrlKey', 'metaKey', 'shiftKey',
    'pageX', 'pageY', 'layerX', 'layerY',
    'detail', 'bubbles', 'cancelable', 'composed', 'defaultPrevented',
    'eventPhase', 'timeStamp', 'returnValue'
];

/**
 * The DomEvent represents an event that was captured from a DOM event listener
 */
export class DomEvent extends AbstractProfilerEvent {
    /**
     * See if a focus target has been set
     * @returns {boolean}
     */
    static hasFocusTarget() {
        return !!this.__focusTarget;
    }

    /**
     * See if a target node is the focus target node
     * @param {Element} target
     * @returns {boolean}
     */
    static isFocusTarget(target) {
        return this.__focusTarget === target;
    }

    /**
     * Blur the current focus target (if any)
     * @returns {void}
     */
    static blurFocusTarget() {
        if (this.__focusTarget) {
            this.__focusTarget.blur();
            this.__focusTarget = null;
        }
    }

    /**
     * Set a new focus target and apply focus on it
     * @param {Element} target
     * @returns {void}
     */
    static focusTarget(target) {
        if (!this.isFocusTarget(target)) {
            this.blurFocusTarget();
            this.__focusTarget = target;
        }
        this.__focusTarget.focus();
    }

    /**
     * Get the event keys to serialize
     * @returns {Array}
     */
    static getEventKeys() {
        return DEFAULT_EVENT_KEYS;
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.constructor
     */
    constructor(event) {
        super(event);
        this._el = null;
        this.window = window;
        this.className = null;
    }

    /**
     * Get the content-window for this event
     * @returns {Window}
     */
    get window() {
        if (!this._window) {
            this._window = window;
        }
        return this._window;
    }

    /**
     * Set the content-window for this event
     * @param {Window} contentWindow
     * @returns {void}
     */
    set window(contentWindow) {
        // NOTE: metadata will be out of data if the window changes (but we don't want to update it during playback)
        this._window = contentWindow;
        this._el = null;
    }

    /**
     * See if this event was performed on the window
     * @returns {Boolean}
     */
    get isWindow() {
        return !!this.metadata.isWindow || this.el instanceof this.window.constructor;
    }

    /**
     * See if this event was performed on the document
     * @returns {Boolean}}
     */
    get isDocument() {
        return !!this.metadata.isDocument || this.el instanceof this.window.document.constructor;
    }

    /**
     * See if this node is or is inside the HEAD of the document
     * @returns {Boolean}
     */
    get isHead() {
        if (this.metadata.nodeName === 'HTML' || this.metadata.nodeName === 'HEAD' ) {
            return true;
        }
        if (this.metadata.parentNodeName === 'HEAD') {
            return true;
        }
        return false;
    }

    /**
     * See if this event is for a Node element
     * @returns {boolean}
     */
    get isNode() {
        if (this.metadata.isNode) {
            return true;
        }
        if (this.metadata.nodeType === Node.ELEMENT_NODE) {
            return true;
        }
        if (!this.el) {
            return false;
        }
        if (this.el.nodeType === Node.ELEMENT_NODE) {
            return true;
        }
        return false;
    }

    /**
     * Get the target element for the event
     * @returns {Element|Node|null}
     */
    get el() {
        if (this._el) {
            return this._el;
        }

        if (this.metadata.selector && this.metadata.selector.length !== 0) {
            this._el = DomUtil.querySelector(this.metadata.selector, this.window);
            if (this._el) {
                return this._el;
            }
        }

        if (this.event.target instanceof Element) {
            this._el = this.event.target;
            this.metadata.selector = DomUtil.getSelectorFromNode(this._el);
            return this._el;
        }

        if (this.event.target instanceof Node && this.event.target.nodeName === '#document') {
            this._el = this.window.document;
            this.metadata.selector = '#document';
            return this._el;
        }

        if (this.event.target instanceof this.window.constructor) {
            this._el = this.window;
            this.metadata.selector = '#window';
            return this._el;
        }

        if (Array.isArray(this.event.path) && this.event.path.length !== 0) {
            if (this.event.path[0].nodeName === '#document') {
                this._el = this.window.document;
                this.metadata.selector = '#document';
                return this._el;
            }
            if (this.event.path.length <= 1) {
                this._el = this.window;
                this.metadata.selector = '#window';
                return this._el;
            }
        }

        return null;
    }

    /**
     * Getter to see if this event has a snapshot
     * @returns {boolean}
     */
    get hasSnapshot() {
        return !!(
            this.metadata.snapshot &&
            this.metadata.snapshot !== 'undefined' &&
            this.metadata.snapshot.length !== 0
        );
    }

    /**
     * Get a css selector path from a DOM associated objected (event, mutation record, etc.)
     * @returns {String}
     */
    getTargetSelector() {
        return DomUtil.getSelectorFromEvent(this.event);
    }

    /**
     * Capture data for this event
     * @returns {Promise}
     */
    capture() {
        return new Promise(resolve => {
            // TODO: a way to refresh the metadata (but might need to persist some data like the selector, isDocument, isWindow)
            Object.assign(this.metadata, {
                selector: this.getTargetSelector(),
                width: DomUtil.windowWidth(),
                height: DomUtil.windowHeight(),
                scrollTop: DomUtil.scrollTop(),
                scrollLeft: DomUtil.scrollLeft(),
                elScrollY: this.getScrollTop(),
                elScrollX: this.getScrollLeft(),
                nodeName: this.el ? this.el.nodeName : null,
                nodeType: this.el ? this.el.nodeType : null,
                parentNodeName: this.el && this.el.parentNode ? this.el.parentNode.nodeName : null,
                isDocument: this.el instanceof this.window.document.constructor,
                isWindow: this.el instanceof this.window.constructor,
                isHead: this.isHead,
                isNode: this.isNode,
            });
            resolve();
        });
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.playback
     */
    playback() {
        // TODO: break apart the playback from the collection - playback.event.el - make an event playback factory
        // TODO: if readyState != DONE then don't play back the event (we have have a full snapshot)
        if (this.el) {

            const { width, height, scrollLeft, scrollTop } = this.metadata;

            const win = this.window;
            const frameElement = win.frameElement || win;

            if (width !== DomUtil.windowWidth(win) || height !== DomUtil.windowHeight(win)) {
                if (frameElement.resizeTo) {
                    win.resizeTo(width, height);
                } else {
                    frameElement.style.width = parseInt(width, 10) + 'px';
                    frameElement.style.height = parseInt(height, 10) + 'px';
                }
            }

            if (scrollLeft !== DomUtil.scrollLeft(win) || scrollTop !== DomUtil.scrollTop(win)) {
                win.scrollTo(scrollLeft, scrollTop);
            }

            if (this.metadata.elScrollTop) {
                this.el.scrollTop = this.metadata.elScrollTop;
            }

            if (this.metadata.elScrollLeft) {
                this.el.scrollLeft = this.metadata.elScrollLeft;
            }

            this.dispatch();
        }
        return Promise.resolve();
    }

    /**
     * Dispatch this event onto the target element
     * @returns {void}
     */
    dispatch() {
        if (this.el) {
            this.el.dispatchEvent(this.event);
        }
    }

    /**
     * Get the CSS Selector Path
     * @returns {String|*}
     */
    getSelector() {
        return this.metadata.selector;
    }

    /**
     * Get the time of the event since the browser session started / page loaded
     * @returns {Number} milliseconds
     */
    getTimeSince() {
        return this.event.timeStamp;
    }

    /**
     * Get the scroll-top value for the target element
     * @returns {Number|*}
     */
    getScrollTop() {
        return this.el && this.el.scrollTop;
    }

    /**
     * Get the scroll-left value for the target element
     * @returns {Number|*}
     */
    getScrollLeft() {
        return this.el && this.el.scrollLeft;
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.serializeMetadata
     */
    serializeMetadata() {
        const metadata = super.serializeMetadata();
        if (this.hasSnapshot) {
            metadata.snapshot = this.metadata.snapshot
                .replace(/[\r\n]/g, ' ')
                //.replace(/"/g, '\"')
                .replace(/^\s*|\s*$/g, '');
        }
        return metadata;
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.serializeEvent
     */
    serializeEvent() {
        return this.constructor.getEventKeys().reduce((obj, key) => {
            if (key in this.event) {
                obj[key] = this.event[key];
            }
            return obj;
        }, {
            type: this.event.type,
            isTrusted: this.event.isTrusted,
        });
    }
}