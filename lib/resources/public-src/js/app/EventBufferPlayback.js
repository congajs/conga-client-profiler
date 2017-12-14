/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { AbstractProfilerEvent } from "./AbstractProfilerEvent";

/**
 * No-Op Function
 */
const noop = () => { };

/**
 * Minimum number of buffer playbacks to queue
 * @type {number}
 */
const MIN_SAFE_BUFFER_LENGTH = 5;

/**
 * The EventBufferPlayback is a class that executes the playback functionality for each event in
 * a given EventBuffer, in time.
 */
export class EventBufferPlayback {
    /**
     *
     * @param {EventBuffer} buffer The buffer that you want to play back
     */
    constructor(buffer) {
        this.buffer = buffer;
        this._playing = false;
        this._index = 0;
    }

    /**
     * Get the current buffer playback index
     * @returns {number}
     */
    get index() {
        return this._index;
    }

    /**
     * Restart the playback
     * @param {Function} [fn] The function call when playback finished
     * @returns {void}
     */
    restart(fn = noop) {
        if (this._timer) {
            this._timer = clearTimeout(this._timer);
        }
        this._playing = false;
        this._index = 0;
        this.playback(fn);
    }

    /**
     * See if the number of payloads meets the minimum buffer playback requirements
     * @returns {boolean}
     */
    isSafeBufferLength() {
        return this.buffer.length > MIN_SAFE_BUFFER_LENGTH;
    }

    /**
     * See if the buffer is currently in playback
     * @returns {boolean}
     */
    isPlaying() {
        return this._playing;
    }

    /**
     * Begin / continue playback of the buffer
     * @param {Function} [fn] The function call when playback finished
     * @returns {*}
     */
    playback(fn = noop) {
        this._playing = true;

        let node;
        while (!node && this._index < this.buffer.length) {
            node = this.buffer.index(this._index++);
            console.log('node', node);
        }

        if (!node) {
            this._playing = false;
            fn();
            return;
        }

        console.log("got node");

        if (!(node.payload.eventPayload instanceof AbstractProfilerEvent)) {
            this._playing = false;
            fn(new TypeError('Invalid Event; expecting instance of AbstractProfilerEvent.'));
            return;
        }

        const event = node.payload.eventPayload;

        console.log('got event', event);

        const nextPlayback = () => {
            let delay = 0;
            if (this._index < this.buffer.length) {
                delay = Math.abs(
                    this.buffer.index(this._index).payload.eventPayload.metadata.time
                    - event.metadata.time);
            }
            console.log('>>>>>> DELAY', delay, 'next index', this._index);
            this._timer = setTimeout(() => this.playback(fn), delay);
        };

        console.log('event', event);
        event.playback().then(nextPlayback).catch(err => {
            console.error(err.stack || err);
            nextPlayback();
        });
    }
}