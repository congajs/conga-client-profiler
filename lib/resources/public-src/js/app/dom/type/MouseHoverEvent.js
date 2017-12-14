/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { MouseEvent } from './MouseEvent';
import { StyleAwareMixin } from './StyleAwareMixin';

/**
 * The mouse hover event type assists with mouse over / out (hover) events
 */
export class MouseHoverEvent extends StyleAwareMixin(MouseEvent) {
    /**
     * {@inheritDoc}
     * @see MouseEvent.capture
     */
    // capture() {
    //     return super.capture().then(() => {
    //         this.capturePerimeter();
    //         this.captureComputedStyle();
    //     });
    // }

    /**
     * {@inheritDoc}
     * @see DomEvent.playback
     */
    playback() {
        return this.playbackStyles().then(() => super.playback());
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.serializeMetadata
     */
    serializeMetadata() {
        return Object.assign({}, super.serializeMetadata(), this.serializeStyleMetadata());
    }
}