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
import { DomUtil } from './../../DomUtil';

/**
 * The ReorderMutationEvent represents a node that has had its sibling ordinal position changed
 */
export class ReorderMutationEvent extends MutationEvent {
    /**
     * {@inheritDoc}
     * @see MutationEvent.capture
     */
    capture() {
        // NOTE: the node's selector at time of capture should be the new selector we need the old
        return super.capture().then(() => {
            if (this.node && this.node.parentNode) {
                const selector = this.metadata.selector;
                const parentSelector = DomUtil.getSelectorFromNode(this.node.parentNode);
                const nodeSelector = selector.replace(parentSelector, '').replace(/^\s*|\s*$/g, '');
                this.metadata.oldSelector = parentSelector + ' > ' + nodeSelector;
                this.metadata.parentSelector = parentSelector;
            }
            if (this.node && this.node.nextElementSibling) {
                this.metadata.nextSibling = DomUtil.getSelectorFromNode(this.node.nextElementSibling);
            }
        });
    }

    /**
     * {@inheritDoc}
     * @see MutationEvent.playback
     */
    playback() {
        return new Promise((resolve, reject) => {
            if (this.metadata.oldSelector) {
                const node = DomUtil.querySelector(this.metadata.oldSelector, this.window);
                if (this.metadata.nextSibling) {
                    const nextSibling = DomUtil.querySelector(
                        this.metadata.nextSibling,
                        this.window
                    );
                    if (nextSibling) {
                        this.parentNode.insertBefore(node, nextSibling);
                    }
                } else if (this.metadata.parentSelector) {
                    const parent = DomUtil.querySelector(this.metadata.parentSelector, this.window);
                    parent.appendChild(node);
                }
            }
            super.playback().then(resolve).catch(reject);
        });
    }
}