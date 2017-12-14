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
import { StyleAwareMixin } from './../StyleAwareMixin';

/**
 * The AddedMutationEvent represents a node that is added to the DOM Tree
 */
export class AddedMutationEvent extends StyleAwareMixin(MutationEvent) {
    /**
     * {@inheritDoc}
     * @see MutationEvent.capture
     */
    capture() {
        return super.capture().then(() => {
            this.metadata.nodeName = this.node.nodeName;

            if (this.node.nodeName === '#text') {
                this.metadata.snapshot = this.node.nodeValue;
            } else {
                this.metadata.snapshot = this.node.innerHTML;
            }

            this.metadata.style = this.node.style;

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
        return new Promise((resolve, reject)  => {
            const parent = this.parentNode;
            if (parent) {
                let frag;
                switch (this.metadata.nodeName) {
                    case '#text' :
                        frag = document.createTextNode(this.metadata.snapshot);
                        break;
                    case '#comment' :
                        frag = null;
                        break;
                    default :
                        frag = document.createElement(this.metadata.nodeName);
                        frag.innerHTML = this.metadata.snapshot;
                        this.applyStyles(this.metadata.style, frag);
                        break;
                }
                if (frag) {
                    if (this.metadata.nextSibling) {
                        const nextSibling = DomUtil.querySelector(
                            this.metadata.nextSibling,
                            this.window
                        );
                        if (nextSibling) {
                            this.el.insertBefore(frag, nextSibling);
                        }
                    } else {
                        this.el.appendChild(frag);
                    }
                }
            }
            super.playback().then(resolve).catch(reject);
        });
    }
}