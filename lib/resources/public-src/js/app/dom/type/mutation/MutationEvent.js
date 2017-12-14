/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { DomEvent } from '../DomEvent';
import { DomUtil } from '../../DomUtil';

/**
 * The MutationEvent represents any sort of mutation on the DOM Tree
 * @abstract
 */
export class MutationEvent extends DomEvent {
    /**
     *
     * @param {Element|Node} [node] The HTML element that is being modified (required for capture)
     * @param {String} [type] The mutation type
     * @param {Summary} [summary] The mutation summary
     */
    constructor(node = null, summary = null) {
        super({type: 'mutation'});
        this.node = node;
        this.summary = summary;
    }

    /**
     * Get the parent node
     * @returns {Node}
     */
    get parentNode() {
        if (!this._parentEl) {
            if (this.metadata.parentSelector) {
                this._parentEl = DomUtil.querySelector(this.metadata.parentSelector, this.window);
            } else if (this.el.parentNode) {
                return this.el.parentNode;
            }
        }
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.getTargetSelector
     */
    getTargetSelector() {
        return DomUtil.getSelectorFromNode(this.node);
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.capture
     */
    capture() {
        return super.capture().then(() => {
            if (this.node && this.node.parentNode) {
                this.metadata.parentSelector = DomUtil.getSelectorFromNode(this.node.parentNode);
            }
        });
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.getEventClassName
     */
    getEventClassName() {
        return this.constructor.name;
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.serializeEvent
     */
    serializeEvent() {
        return JSON.parse(JSON.stringify(this.event));
    }
}