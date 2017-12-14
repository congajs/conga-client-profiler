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
import { StyleAwareMixin } from './../StyleAwareMixin';

/**
 * The AttributeMutationEvent represents a node that has its attribute value added or modified
 */
export class AttributeMutationEvent extends StyleAwareMixin(MutationEvent) {
    /**
     *
     * @param {String} attributeName The name of the attribute being modified
     * @param {Element|Node} [node] The HTML element that is being modified (required for capture)
     * @param {Summary} [summary] The mutation summary
     */
    constructor(attributeName, node = null, summary = null) {
        super(node, summary);
        this.event.attributeName = attributeName;
    }

    /**
     * {@inheritDoc}
     * @see MutationEvent.capture
     */
    capture() {
        return super.capture().then(() => {
            let value = this.getAttributeValue();
            if (value instanceof Object) {
                value = Object.keys(value).reduce((obj, key) => {
                    if (!isNaN(value[key])) {
                        obj[key] = value[key];
                    }
                    return obj;
                }, {});
            }
            this.metadata.attributeValue = value;
        });
    }

    /**
     * {@inheritDoc}
     * @see MutationEvent.playback
     */
    playback() {
        return super.playback().then(() => {
            this.setAttributeValue();
        });
    }

    /**
     * Get the attribute value
     * @returns {*}
     */
    getAttributeValue() {
        let el = this.el;
        if (this.isDocument) {
            el = this.window.document;
        }
        if (this.isWindow || !el) {
            return null;
        }
        switch (this.event.attributeName) {
            case 'style' :
                return el.style;
            case 'class' :
                return el.className;
            default :
                return el.getAttribute(this.event.attributeName);
        }
    }

    /**
     * Set the attribute value (for playback)
     * @returns {void}
     */
    setAttributeValue() {
        let el = this.el;
        if (this.isDocument) {
            el = this.window.document;
        }
        if (this.isWindow || !el) {
            return;
        }
        switch (this.event.attributeName) {
            case 'style' :
                this.applyStyles(this.metadata.attributeValue, el);
                break;

            case 'class' :
                el.className = this.metadata.attributeValue;
                break;

            default :
                el.setAttribute(this.event.attributeName, this.metadata.attributeValue);
        }
    }
}