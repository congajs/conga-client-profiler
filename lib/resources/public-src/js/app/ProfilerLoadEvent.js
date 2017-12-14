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
 * The ProfilerLoadEvent is triggered as the first event when the profiler starts up
 */
export class ProfilerLoadEvent extends AbstractProfilerEvent {
    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.type
     */
    get type() {
        return 'load';
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
     * @see AbstractProfilerEvent.serializeEvent
     */
    serializeMetadata() {
        return Object.assign({}, super.serializeMetadata(), {
            url: this.event.url
        });
    }

    /**
     * {@inheritDoc}
     * @see AbstractProfilerEvent.serializeEvent
     */
    serializeEvent() {
        return Object.assign({

            type: this.type

        }, super.serializeEvent());
    }
}