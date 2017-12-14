/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { DomUtil } from './../DomUtil';
import { DomEvent } from './DomEvent';

/**
 * The mouse event type assists with mouse events
 */
export class MouseEvent extends DomEvent {
    /**
     * {@inheritDoc}
     * @see DomEvent.serializeEvent
     */
    serializeEvent() {
        return Object.assign({}, super.serializeEvent(), {
            button: this.event.button,
            buttons: this.event.buttons,
            x: this.event.x,
            y: this.event.y,
            clientX: this.event.clientX,
            clientY: this.event.clientY,
            movementX: this.event.movementX,
            movementY: this.event.movementY,
            offsetX: this.event.offsetX,
            offsetY: this.event.offsetY,
            screenX: this.event.screenX,
            screenY: this.event.screenY,
            region: this.event.region,
            webkitForce: this.event.webkitForce,
            mozPressure: this.event.mozPressure,
            mozInputSource: this.event.mozInputSource,
            relatedTargetSelector: this.event.relatedTarget &&
                DomUtil.getSelectorFromNode(this.event.relatedTarget)
        });
    }
}