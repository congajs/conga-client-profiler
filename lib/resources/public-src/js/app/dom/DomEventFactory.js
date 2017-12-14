/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { DomEvent } from './type/DomEvent';
import { InputEvent } from './type/InputEvent';
import { MouseEvent } from './type/MouseEvent';
import { MouseMoveEvent } from './type/MouseMoveEvent';
import { MouseOverEvent } from './type/MouseOverEvent';
import { MouseOutEvent } from './type/MouseOutEvent';
import { ClickEvent } from './type/ClickEvent';
import { ReadyStateEvent } from './type/ReadyStateEvent';
import { PopStateEvent } from './type/PopStateEvent';
import { HashChangeEvent } from './type/HashChangeEvent';
import { ProfilerEventList } from '../ProfilerEventList';
import { MutationEvent } from './type/mutation/MutationEvent';
import { AddedMutationEvent } from './type/mutation/AddedMutationEvent';
import { AttributeMutationEvent } from './type/mutation/AttributeMutationEvent';
import { RemovedMutationEvent } from './type/mutation/RemovedMutationEvent';
import { ReorderMutationEvent } from './type/mutation/ReorderMutationEvent';
import { ReparentMutationEvent } from './type/mutation/ReparentMutationEvent';

/**
 * The dom event factory helps with retrieving event-type objects
 */
export class DomEventFactory {
    /**
     * Get an appropriate event type instance from a DOM event
     * @param {Event|Object|*} event The DOM event
     * @returns {DomEvent}
     */
    static eventFromDOM(event) {
        if (!event) {
            console.trace();
        }
        switch (event.type) {
            case 'popstate' : {
                return new PopStateEvent(event);
            }
            case 'hashchange' : {
                return new HashChangeEvent(event);
            }
            case 'mousemove' : {
                return new MouseMoveEvent(event);
            }
            case 'mouseover' : {
                return new MouseOverEvent(event);
            }
            case 'mouseout' : {
                return new MouseOutEvent(event);
            }
            case 'dblclick' :
            case 'click' :
            case 'auxclick' :
            case 'contextmenu' : {
                return new ClickEvent(event);
            }
            case 'readystatechange' : {
                return new ReadyStateEvent(event);
            }
            default: {
                if (event.type.indexOf('mouse') === 0) {
                    return new MouseEvent(event);
                }
                if (event.type.indexOf('key') === 0) {
                    return new InputEvent(event);
                }
                return new DomEvent(event);
            }
        }
    }

    /**
     * Get an appropriate event type instance from a DOM event
     * @param {Summary} summary The Mutation summary object
     * @returns {ProfilerEventList}
     */
    static eventFromMutation(summary) {
        const {
            added,
            attributeChanged,
            removed,
            reordered,
            reparented,
            characterDataChanged
        } = summary;

        const eventList = new ProfilerEventList();

        added.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE ||
                node.nodeType === Node.TEXT_NODE
            ) {
                eventList.add(new AddedMutationEvent(node, summary));
            }
        });
        removed.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE ||
                node.nodeType === Node.TEXT_NODE
            ) {
                eventList.add(new RemovedMutationEvent(node, summary));
            }
        });
        reordered.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE ||
                node.nodeType === Node.TEXT_NODE
            ) {
                eventList.add(new ReorderMutationEvent(node, summary));
            }
        });
        reparented.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE ||
                node.nodeType === Node.TEXT_NODE
            ) {
                eventList.add(new ReparentMutationEvent(node, summary));
            }
        });

        Object.keys(attributeChanged).forEach(attribute => {
            attributeChanged[attribute].forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE ||
                    node.nodeType === Node.DOCUMENT_NODE
                ) {
                    eventList.add(new AttributeMutationEvent(attribute, node, summary));
                }
            });
        });

        return eventList;
    }

    /**
     * Deserialize an event from JSON into an event object
     * @param {DomEvent} event The event to deserialize into
     * @param {Object} json The serialized event payload
     * @param {String} [rewriteUrl] URL to rewrite assets to
     * @returns {DomEvent}
     */
    static deserializeEvent(event, json, rewriteUrl = null) {
        event.className = json.className;

        event.metadata = json.metadata;
        if (event.metadata.snapshot) {
            event.metadata.snapshot = this.prepareSnapshot(event.metadata.snapshot, rewriteUrl);
        }

        const iframe = document.querySelector('iframe#conga-client-profiler');
        if (iframe) {
            event.window = iframe.contentWindow;
        }

        return event;
    }

    /**
     * Get an appropriate DOM event type instance from serialized event data
     * @param {Object} json
     * @param {String} [rewriteUrl] URL to rewrite assets to
     * @returns {DomEvent}
     */
    static eventFromSerialized(json, rewriteUrl = null) {
        const event = this.eventFromDOM(json.event);
        event.event = this.domEventPayloadFromSerialized(event);
        return this.deserializeEvent(event, json, rewriteUrl);
    }

    /**
     * Get an appropriate mutation event type instance from serialized event data
     * @param {Object} json
     * @param {String} [rewriteUrl] URL to rewrite assets to
     * @returns {DomEvent}
     */
    static mutationEventFromSerialized(json, rewriteUrl = null) {
        if (!json.className) {
            json.className = 'Mutation';
        }

        const classes = {
            MutationEvent,
            AddedMutationEvent,
            AttributeMutationEvent,
            RemovedMutationEvent,
            ReorderMutationEvent,
            ReparentMutationEvent
        };

        if (!(json.className in classes)) {
            return null;
        }

        const event = this.deserializeEvent(new classes[json.className](), json, rewriteUrl);

        if (event.metadata.addedNodes) {
            event.metadata.addedNodes = event.metadata.addedNodes.map(node => {
                if (node.snapshot) {
                    node.snapshot = this.prepareSnapshot(node.snapshot, rewriteUrl);
                }
                return node;
            });
        }

        return event;
    }

    /**
     * Get an actual DOM Event from an event object
     * @param {DomEvent} domEvent
     * @return {Event|*}
     */
    static domEventPayloadFromSerialized(domEvent) {
        let C = domEvent.window[domEvent.className];
        if (!(C instanceof Function)) {
            C = Event;
        }
        try {
            return new C(domEvent.event.type, domEvent.event);
        } catch (e) {
            return domEvent.event;
        }
    }

    /**
     * Prepare a snapshot for playback
     * @param {String} snapshot The snapshot
     * @param {String} [rewriteUrl] URL to rewrite assets to
     */
    static prepareSnapshot(snapshot, rewriteUrl = null) {
        rewriteUrl = rewriteUrl.replace(/\/$/g, '');

        snapshot = decodeURIComponent(snapshot);

        // remove scripts
        snapshot = snapshot
            //.replace(/<link([^>]+)>/g, '<!-- link$1 -->')
            .replace(/<(script|style)/g, '<!-- $1')
            .replace(/<\/(script|style)>/g, '</$1 -->');

        // replace assets
        if (rewriteUrl) {
            snapshot = snapshot
                .replace(/href="\/\/([^'"]+)"/g, 'href="http://$1')
                .replace(/href="(?!javascript)(?!http[s]?:)\/?([^"]+)"/g, 'href="' + rewriteUrl + '/$1"')   // TODO: relative URLs
                .replace(/src="(?!javascript)(?!http[s]?:)\/?([^"]+)"/g, 'src="' + rewriteUrl + '/$1"');
        }

        snapshot = snapshot.replace(/<iframe.*?id="client-profiler"[^>]+>(.*?)<\/iframe>/g, '');

        return snapshot;
    }
}