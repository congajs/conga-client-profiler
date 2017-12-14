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

/**
 * The mouse down event type assists with mouse down events
 */
export class MouseDownEvent extends MouseEvent {
    /**
     * {@inheritDoc}
     * @see DomEvent.playback
     */
    playback() {

        /* when the mouse is pressed, we want to blur any active element
           and if this element allows it, focus this */

        MouseEvent.focusTarget(this.el);
    }
}