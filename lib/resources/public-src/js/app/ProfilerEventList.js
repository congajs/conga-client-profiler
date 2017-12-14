/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { AbstractProfilerEvent } from './AbstractProfilerEvent';

/**
 * Execute an array of promise factories in series
 * @param {Array<Function>} funcs Array of functions that return promises
 * @returns {Promise}
 */
const series = funcs => {
    const fn = funcs.shift();
    if (!fn) {
        return Promise.resolve();
    }
    return fn().then(() => series(funcs));
};

/**
 * Profiler event list stores a collection of events
 */
export class ProfilerEventList extends AbstractProfilerEvent {
    /**
     *
     * @param {Array<AbstractProfilerEvent>} [events] Array of profiler events to initialize with
     */
    constructor(events = []) {
        super({type: 'list'});
        this.events = events;
    }

    /**
     * Add an event to the list
     * @param {AbstractProfilerEvent} event
     * @returns {void}
     */
    add(event) {
        this.events.push(event);
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.capture
     */
    capture() {
        return series(this.events.map(event => event.capture.bind(event)));
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.playback
     */
    playback() {
        return series(this.events.map(event => event.playback.bind(event)));
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.getEventClassName
     */
    getEventClassName() {
        return this.constructor.name;
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.toJSON
     */
    toJSON() {
        return Object.assign({}, super.toJSON(), {
            events: this.events.map(event => ({
                eventPayload: event.toJSON(),
                type: event.type || null
            }))
        });
    }
}