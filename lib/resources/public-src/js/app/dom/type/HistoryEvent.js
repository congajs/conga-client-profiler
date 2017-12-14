/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { DomEvent } from './DomEvent';

/**
 * The history event type assists location / history changes
 */
export class HistoryEvent extends DomEvent {
    /**
     * {@inheritDoc}
     * @see DomEvent.constructor
     */
    constructor(event) {
        super(event);
        this.metadata.isHistoryEvent = true;
    }
}