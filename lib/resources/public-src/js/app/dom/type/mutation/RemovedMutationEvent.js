/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { MutationEvent } from './MutationEvent';

/**
 * The RemovedMutationEvent represents a node that has been removed from the DOM Tree
 */
export class RemovedMutationEvent extends MutationEvent {
    /**
     * {@inheritDoc}
     * @see MutationEvent.playback()
     */
    playback() {
        return new Promise((resolve, reject) => {
            if (this.el) {
                if (this.parentNode) {
                    this.parentNode.removeChild(this.el);
                } else if (this.el.remove instanceof Function) {
                    this.el.remove();
                }
            }
            super.playback().then(resolve).catch(reject);
        });
    }
}