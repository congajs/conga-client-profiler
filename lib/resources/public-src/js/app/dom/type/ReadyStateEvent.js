/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { DomEvent } from './DomEvent';
import { DomUtil } from './../DomUtil';

/**
 * Keep track of the last known ready-state - should work as the readystate series of events only
 * fires once per document load (ie. after a completed readyState, it doesn't occurr until the
 * next page load)
 *
 * @type {ReadyStateEvent}
 */
let lastKnownReadyState = null;

/**
 * The readyState event type assists readyState changes
 */
export class ReadyStateEvent extends DomEvent {

    /**
     * See if the document has loaded
     * @returns {boolean}
     */
    static get domLoaded() {
        return document.readyState === 'complete';
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.constructor
     */
    constructor(event) {
        super(event);
        this.isFirstReadyState = lastKnownReadyState === null;
        lastKnownReadyState = this;
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.capture
     */
    capture() {
        return super.capture().then(() => {
            const readyState = this.el && this.el.readyState;
            this.metadata.isReady = readyState === 'interactive' || readyState === 'complete';
            this.metadata.readyState = readyState;
            if (this.metadata.isReady) {
                if (this.isDocument) {
                    this.metadata.snapshot = this.window.document.getElementsByTagName('html')[0].outerHTML;
                } else {
                    this.metadata.snapshot = this.el.innerHTML;
                }
            }
            if (this.isFirstReadyState) {
                this.metadata.url = this.window.location.href;
            }
        });
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.playback
     */
    playback() {
        return (new Promise((resolve, reject) => {

            if (!this.metadata.snapshot) {
                resolve();
                return;
            }

            if (this.isDocument) {
                this.window.document.open();
                try {
                    this.window.document.write(this.metadata.snapshot);
                } catch (e) {
                    console.error(e.stack || e);
                    reject(e);
                }
                this.window.document.close();
                // wait 5 seconds on page load
                setTimeout(() => {

                    DomUtil.replacePseudoCssForPlayback(this.window);
                    resolve();

                }, 5000);
                return;
            }

            this.el.innerHTML = this.metadata.snapshot;
            resolve();

        })).then(() => super.playback());
    }

    /**
     * ReadyState does not dispatch
     * @returns {null}
     * @see DomEvent.dispatch
     */
    dispatch() {
        return null;
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.serializeMetadata
     */
    serializeMetadata() {
        return Object.assign({}, super.serializeMetadata(), {
            snapshot: encodeURIComponent(this.metadata.snapshot)
        });
    }
}