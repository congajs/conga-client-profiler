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
 * The ErrorProfilerEvent represent an event that was captured from an error
 */
export class ErrorProfilerEvent extends AbstractProfilerEvent {
    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.constructor
     *
     * @param {Error|*} error The error object is the event
     */
    constructor(error) {
        super(error);
        this.metadata.errorClassName = 'Error';
        if (error.constructor) {
            this.metadata.errorClassName = error.constructor.name;
        }
        this.metadata.stackTrace = error.stack;
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.type
     */
    get type() {
        return this.metadata.errorClassName;
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.playback
     */
    playback() {
        // we don't play back error events
        return Promise.resolve();
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.serializeEvent
     */
    serializeEvent() {
        return Object.assign({
            type: this.type,
            isTrusted: true,
            message: this.event.message
        }, JSON.parse(JSON.stringify(this.event)));
    }
}