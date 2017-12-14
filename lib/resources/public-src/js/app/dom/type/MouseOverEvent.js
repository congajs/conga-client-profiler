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
import { HOVER_CLASS, HOVER_CLASS_REG } from '../DomUtil';

/**
 * The mouse over event type assists with mouse over events
 */
export class MouseOverEvent extends MouseHoverEvent {
    /**
     * {@inheritDoc}
     * @see DomEvent.playback
     */
    playback() {
        return new Promise((resolve, reject) => {

            if (this.el) {

                const path = [];
                let node = this.el;
                while (node && node.nodeName !== 'BODY') {
                    path.unshift(node);
                    node = node.parentNode;
                }
                this.window.document.querySelectorAll('.' + HOVER_CLASS).forEach(node => {
                    if (path.indexOf(node) === -1) {
                        node.className = node.className
                            .replace(HOVER_CLASS_REG, '')
                            .replace(/^\s*|\s*$/g, '');
                    }
                });

                node = this.el;
                do {
                    if (node.className.indexOf(HOVER_CLASS) === -1) {
                        node.className += ' ' + HOVER_CLASS;
                    }
                    node = node.parentNode;
                } while (this.window.getComputedStyle(node).display.toLowerCase() !== 'block');
            }

            super.playback().then(resolve).catch(reject);

        });
    }
}