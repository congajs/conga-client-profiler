/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { DomEvent } from './DomEvent';

/**
 * The Input event assists with key events
 */
export class InputEvent extends DomEvent {
    /**
     * {@inheritDoc}
     * @see DomEvent.constructor
     */
    constructor(event) {
        super(event);
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.capture
     */
    capture() {
        return super.capture().then(() => {
            this.metadata.value = this.el && this.el.value;
        });
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.playback
     */
    playback() {

        /* when a key is pressed, we want to make sure the target has focus.
           when tab is pressed we want to blur the target */

        const event = this.event;
        if (event.code === 'Tab') {
            DomEvent.blurFocusTarget();
        } else {
            // when the key is pressed and we aren't the blur target, make it so
            DomEvent.focusTarget(this.el);
        }

        // we want to handle blur before we dispatch the event
        return super.playback();
    }

    /**
     * Dispatch this event onto the target element
     * @returns {void}
     */
    dispatch() {
        super.dispatch();
        this.el.value = this.event.metadata.value;
        this.el.dispatchEvent(new Event('input', {bubbles: true}));
    }

    /**
     * {@inheritDoc}
     * @see DomEvent.serializeEvent
     */
    serializeEvent() {
        return Object.assign({}, super.serializeEvent(), {
            charCode: this.event.charCode,
            key: this.event.key,
            code: this.event.code,
            keyCode: this.event.keyCode,
            isComposing: this.event.isComposing,
            locale: this.event.locale,
            location: this.event.location,
            repeat: this.event.repeat,
            value: this.el && this.el.value
        });
    }
}