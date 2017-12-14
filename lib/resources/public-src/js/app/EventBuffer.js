/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Insert a new payload into the buffer, sorted by time
 * @param {Array} buffer The existing buffer
 * @param {Object} data The new payload to add to the buffer
 * @returns {Number} The index at which data was inserted
 */
export const binaryInsert = (buffer, data) => {
    let index,
        left = 0,
        right = buffer.length - 1;

    // the time at which the event was captured (as close to, before any processing)
    const time = data.payload.eventPayload.timeStamp;

    // work through the array from outer edges in towards the middle
    while (left <= right) {
        // get the floored index at our center point
        index = (left + right) / 2 | 0;

        // get our value at the current index
        const check = buffer[index].payload.eventPayload.timeStamp;

        // if the new time is less than time at index, move the right position one less than index
        if (time < check) {
            right = index - 1;
        } else {
            // if new time is gte time at index, increment left position one
            left = index + 1;
            // if the time exists at this index, add the payload after this index
            if (check === time) {
                break;
            }
        }
    }

    // our left position is the position at which to insert the new buffer payload
    buffer.splice(left, 0, data);
    return left;
};

/**
 * The buffer helps with managing a collection of events
 */
export class EventBuffer {

    /**
     * The highest amount of events to keep in the buffer before flushing
     * @returns {Number}
     */
    static get FLUSH_BUFFER_LIMIT_HIGH() {
        return 20;
    }

    /**
     * The lowest amount of events to keep in the buffer before flushing (used when recording)
     * @returns {Number}
     */
    static get FLUSH_BUFFER_LIMIT_LOW() {
        return 8;
    }

    /**
     *
     * @param {Array} [buffer] Optional buffer
     */
    constructor(buffer = []) {
        this.duration = 0;
        this.recording = false;
        this.startTime = 0;
        this.endTime = 0;
        this.lowThreshold = EventBuffer.FLUSH_BUFFER_LIMIT_LOW;
        this.highThreshold = EventBuffer.FLUSH_BUFFER_LIMIT_HIGH;
        this.errors = [];
        this.buffer = [];
        this.lastData = new Array(2);
        buffer.forEach(event => this.add(event));
    }

    /**
     * Get the number of items in the buffer
     * @returns {Number}
     */
    get length() {
        return this.buffer.length;
    }

    /**
     * Get the data representation of this buffer
     * @returns {Object}
     */
    get data() {
        return {
            errors: this.errors.slice(),
            buffer: this.buffer.slice()
        };
    }

    /**
     * See if the buffer includes an error event
     * @returns {Boolean}
     */
    get error() {
        return this.errors.length !== 0;
    }

    /**
     * Get an item in the buffer at a specific index
     * @param {number} index
     * @returns {*}
     */
    index(index) {
        return this.buffer[index];
    }

    /**
     * Add an event to the buffer
     * @param {Object} data Event payload data (from toJSON) to add to the buffer
     * @returns {void}
     */
    add(data) {
        const event = data.payload.eventPayload;
        const { time } = event.metadata || {time: 0};
        this.startTime = !this.startTime ? time : Math.min(this.startTime, time);
        this.endTime = !this.endTime ? time : Math.max(this.endTime, time);
        this.duration = this.endTime - this.startTime;
        if (data.payload.type === 'error') {
            this.errors.push(event);
            this.recording = true;
        }
        binaryInsert(this.buffer, data);
        if (this.lastData.length === 2) {
            this.lastData.pop();
        }
        this.lastData.unshift(data.payload.eventPayload.event.timeStamp);
    }

    /**
     * Get the duration from the last two events added
     * @returns {Number}
     */
    getLastDuration() {
        if (!this.lastData[1]) {
            return 0;
        }
        return this.lastData[0] - this.lastData[1];
    }

    /**
     * Clear the buffer
     * @returns {Object} The data before clearing
     */
    clear() {
        const data = this.data;

        this.buffer = [];
        this.errors = [];
        this.duration = 0;
        this.startTime = 0;
        this.endTime = 0;

        return data;
    }

    /**
     * See if the buffer should be flushed or not
     * @returns {Boolean}
     */
    shouldFlush() {
        const len = this.buffer.length;
        if (this.recording) {
            return len >= this.lowThreshold;
        }
        return len >= this.highThreshold;
    }

    /**
     * Slice the buffer
     * @returns {Array.<*>}
     */
    slice(start, stop) {
        return this.buffer.slice(...arguments);
    }
}