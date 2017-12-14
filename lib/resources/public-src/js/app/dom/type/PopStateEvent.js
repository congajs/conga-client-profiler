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
 * The pop state event listens to history popstate and records location changes
 */
export class PopStateEvent extends HistoryEvent {
    /**
     * {@inheritDoc}
     * @see HistoryEvent.getEventKeys
     */
    static getEventKeys() {
        return super.getEventKeys().concat(['state']);
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.capture
     */
    capture() {
        return super.capture().then(() => {
            this.metadata.url = this.window.location.href;
            this.metadata.title = this.window.document.title;
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

            this.window.history.pushState(this.event.state, this.metadata.title, this.metadata.url);

            resolve();

        })).then(() => super.playback());
    }

    /**
     * Pop state does not dispatch
     * @returns {void}
     * @see DomEvent.dispatch
     */
    dispatch() {
        // empty
    }
}