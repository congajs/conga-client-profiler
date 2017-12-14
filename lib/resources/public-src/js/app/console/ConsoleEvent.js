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
 * The ConsoleEvent represent an event that captured from a console method
 */
export class ConsoleEvent extends AbstractProfilerEvent {
    /**
     * Get an appropriate event type instance from serialized event data
     * @param {String} json Stringified JSON
     * @returns {XhrEvent}
     */
    static eventFromSerialized(json) {
        const event = new ConsoleEvent(json.event);
        event.metadata = json.metadata;
        return event;
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.playback
     */
    playback() {
        // we don't play back console requests
        return Promise.resolve();
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.serializeEvent
     */
    serializeEvent() {
        return Object.assign({ isTrusted: true }, this.event);
    }
}