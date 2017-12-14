/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The public interface for profiler events
 * @abstract
 */
export class AbstractProfilerEvent {
    /**
     * Get an appropriate event type instance from serialized event data
     * @param {String} json Stringified JSON
     * @returns {AbstractProfilerEvent}
     */
    static eventFromSerialized(json) {
        const event = new this.constructor(json.event);
        event.metadata = json.metadata;
        return event;
    }

    /**
     *
     * @param {Object} event The event data payload
     */
    constructor(event) {
        if (!('timeStamp' in event)) {
            event.timeStamp = window.performance.now();
        }
        this.event = event;
        this.metadata = { time: (new Date()).getTime() };
    }

    /**
     * Get the event type
     * @return {String}
     */
    get type() {
        if (this.event) {
            return this.event.type;
        }
    }

    /**
     * Play this event back in the browser
     * @returns {Promise}
     * @abstract
     */
    playback() {
        return Promise.resolve();
    }

    /**
     * Get the time of the event
     * @returns {Number} milliseconds
     */
    getTime() {
        return this.metadata.time;
    }

    /**
     * Get the Class name for our event object
     * @return {String}
     */
    getEventClassName() {
        return this.event.constructor.name;
    }

    /**
     * Serialize the event object into something that can be shared with a worker
     * @returns {Object}
     */
    serializeEvent() {
        return JSON.parse(JSON.stringify(this.event));
    }

    /**
     * Serialize the metadata object into something that can be shared with a worker
     * @returns {Object}
     */
    serializeMetadata() {
        return JSON.parse(JSON.stringify(this.metadata));
    }

    /**
     * Get the JSON representation of this event
     * @returns {Object}
     */
    toJSON() {
        return {
            event: this.serializeEvent(),
            metadata: this.serializeMetadata(),
            className: this.getEventClassName()
        };
    }
}