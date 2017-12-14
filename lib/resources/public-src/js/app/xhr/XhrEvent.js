/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { AbstractProfilerEvent } from "../AbstractProfilerEvent";

/**
 * Event keys to include in serialization
 * @type {Array}
 */
export const EVENT_KEYS = [
    'bubbles','cancelable','view','detail',
    'lengthComputable','loaded','total'
];

/**
 * The XhrEvent represent an event that captured from an XMLHttpRequest instance
 */
export class XhrEvent extends AbstractProfilerEvent {
    /**
     * Get an appropriate event type instance from serialized event data
     * @param {String} json Stringified JSON
     * @returns {XhrEvent}
     */
    static eventFromSerialized(json) {
        const event = new XhrEvent(json.event);
        event.metadata = json.metadata;
        return event;
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.playback
     */
    playback() {
        // we don't play back XHR requests
        return Promise.resolve();
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.serializeEvent
     */
    serializeEvent() {
        return EVENT_KEYS.reduce((obj, key) => {
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