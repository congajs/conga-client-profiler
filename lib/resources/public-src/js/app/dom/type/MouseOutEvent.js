/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { MouseHoverEvent } from './MouseHoverEvent';
import { HOVER_CLASS_REG } from '../DomUtil';

/**
 * The mouse out event type assists with mouse out events
 */
export class MouseOutEvent extends MouseHoverEvent {
    /**
     * {@inheritDoc}
     * @see DomEvent.playback
     */
    playback() {
        return new Promise((resolve, reject) => {

            if (this.el) {
                this.el.className = this.el.className.replace(HOVER_CLASS_REG, '');
            }

            super.playback().then(resolve).catch(reject);

        });
    }
}