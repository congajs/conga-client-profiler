/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { EventBuffer } from './EventBuffer';
import { EventBufferPlayback } from './EventBufferPlayback';
import { ProfilerEventList } from './ProfilerEventList';
import { DomEventFactory } from './dom/DomEventFactory';
import { XhrEvent } from './xhr/XhrEvent';
import { ErrorProfilerEvent } from './error/ErrorProfilerEvent';
import { ConsoleEvent } from './console/ConsoleEvent';

/**
 * The EventFactory helps with retrieving objects related to various (all) event types
 */
export class EventFactory {
    /**
     * Get a buffer playback instance from an array of serialized (json) event-buffers
     * @param {Array} serialized
     * @returns {EventBufferPlayback}
     */
    static bufferPlaybackFromSerialized(serialized) {
        return new EventBufferPlayback(this.bufferFromSerialized(serialized));
    }

    /**
     * Get a buffer from an array of serialized (json) event-buffers
     * @param {Array} serialized
     * @param {String} sessionUrl
     * @returns {EventBuffer}
     */
    static bufferFromSerialized(serialized, sessionUrl) {
        const buffer = new EventBuffer();
        for (const json of serialized) {
            for (const payload of json.buffer) {
                buffer.add(this.bufferPayloadFromSerialized(payload, sessionUrl));
            }
        }
        return buffer;
    }

    /**
     * Get a buffer payload from a serialized (json) buffer
     * @param {Object} serialized
     * @param {String} sessionUrl
     * @returns {Object}
     * @throws TypeError on unknown payload type
     */
    static bufferPayloadFromSerialized(serialized, sessionUrl) {
        return {
            payload: {
                type: serialized.payload.type,
                data: serialized.payload.data,
                eventPayload: this.eventFromSerialized(serialized.payload, sessionUrl)
            },
            readyState: serialized.readyState,
            memory: serialized.memory
        };
    }

    /**
     * Get an event object from its serialization
     * @param {Object} payload Serialized event payload
     * @param {String} sessionUrl
     * @returns {AbstractProfilerEvent}
     */
    static eventFromSerialized(payload, sessionUrl) {
        switch (payload.type) {
            case 'list' :
                return this.eventListFromSerialized(payload.eventPayload, sessionUrl);
            case 'dom' :
                return DomEventFactory.eventFromSerialized(payload.eventPayload, sessionUrl);
            case 'mutation' :
                return DomEventFactory.mutationEventFromSerialized(payload.eventPayload, sessionUrl);
            case 'xhr' :
                return XhrEvent.eventFromSerialized(payload.eventPayload);
            case 'error' :
                return ErrorProfilerEvent.eventFromSerialized(payload.eventPayload);
            case 'console' :
                return ConsoleEvent.eventFromSerialized(payload.eventPayload);
            default :
                throw new TypeError('Unknown payload; ' + payload.type);
        }
    }

    /**
     * Get an event list object from its serialization
     * @param {Object} json
     * @param {String} sessionUrl
     * @returns {ProfilerEventList}
     */
    static eventListFromSerialized(json, sessionUrl) {
        const events = json.events || [];
        return events.reduce((list, payload) => {
            list.add(this.eventFromSerialized(payload, sessionUrl));
            return list;
        }, new ProfilerEventList())
    }
}