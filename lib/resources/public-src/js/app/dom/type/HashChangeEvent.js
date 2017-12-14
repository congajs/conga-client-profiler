/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { HistoryEvent } from "./HistoryEvent";

/**
 * The hash change event listens to hash changes on the URL and records location changes
 */
export class HashChangeEvent extends HistoryEvent {
    /**
     * {@inheritDoc}
     * @see HistoryEvent.constructor
     */
    constructor(event) {
        super(event);
        this.metadata.isHistoryEvent = false;
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.capture
     */
    capture() {
        return super.capture().then(() => {
            this.metadata.previousUrl = this.event.oldURL;
            this.metadata.url = this.event.newURL;
        });
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.playback
     */
    playback() {
        return (new Promise((resolve, reject) => {

            if (!this.metadata.url) {
                resolve();
                return;
            }

            this.window.location.href = this.metadata.url;

            resolve();

        })).then(() => super.playback());
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.dispatch
     */
    dispatch() {
        this.window.onhashchange(this.event);
    }
}