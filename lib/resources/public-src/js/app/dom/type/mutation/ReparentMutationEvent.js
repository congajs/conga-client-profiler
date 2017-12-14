/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { ReorderMutationEvent } from './ReorderMutationEvent';
import { DomUtil } from './../../DomUtil';

/**
 * The ReparentMutationEvent represents a node that has been moved to a new parent
 */
export class ReparentMutationEvent extends ReorderMutationEvent {
    /**
     * {@inheritDoc}
     * @see MutationEvent.capture
     */
    capture() {
        // NOTE: the node's selector at time of capture should be the new selector we need the old
        return super.capture().then(() => {
            if (this.node && this.node.parentNode) {
                const selector = this.metadata.selector;
                const oldParent = this.summary.getOldParentNode(this.node);
                const parentSelector = DomUtil.getSelectorFromNode(oldParent);
                const nodeSelector = selector.replace(parentSelector, '').replace(/^\s*|\s*$/g, '');
                this.metadata.oldSelector = parentSelector + ' > ' + nodeSelector;
                this.metadata.parentSelector = parentSelector;
            }
            if (this.node && this.node.nextElementSibling) {
                this.metadata.nextSibling = DomUtil.getSelectorFromNode(this.node.nextElementSibling);
            }
        });
    }
}