/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Vue from 'vue';

/**
 * Style the timeline event markers
 * @param {Object} eventData
 * @returns {void}
 */
const styleEventMarkers = eventData => {
    for (const [index, event] of eventData.events.entries()) {

        const payload = event.payload;
        const eventPayload = payload.eventPayload;
        const metadata = eventPayload.metadata;

        const pages = eventData.pages;
        let page = pages[eventPayload.pageIdx];

        const el = document.getElementById('marker-' + index);
        const elWidth = el.parentNode.offsetWidth;

        const tr = el.parentNode.parentNode;

        // if the row is hidden don't style it
        if (tr.style.display === 'none') {
            continue;
        }

        let left;
        let width;
        if (payload.isNewPage) {
            width = elWidth * (page.duration / eventData.duration);
            left = elWidth * ((metadata.time - pages[0].startTime) / eventData.duration);
        } else {
            // async events have their own duration
            let duration = eventPayload.duration;
            if (payload.data && payload.data.duration) {
                duration = payload.data.duration;
            }
            width = elWidth * (duration / page.duration);
            left = elWidth * ((metadata.time - page.startTime) / page.duration);
            // async events can overlap the end time so cut it off
            if (width + left > elWidth) {
                width = elWidth - left;
            }
        }

        width = Math.min(width, elWidth);

        setTimeout(() => {
            el.style.left = left + 'px';
            el.style.width = Math.max(1, width) + 'px';
        }, 0);
    }
};

export default Vue.extend({

    template: `
            
        <div id="session-waterfall">
        
            <h2>Client Event Waterfall</h2>
            
            <info-block type="info">
                <p>
                    This view shows every event that took place in the user session, in order by 
                    its timestamp.
                </p>
            </info-block>
            
            <h4>Event Filter</h4>
            
            <p>
                The event filter allows you to toggle what you see in the waterfall table.
                
                You can toggle event types and tag types.  
                
                As you toggle something, the associated events will show and hide.
            </p>
            
            <form id="event-filter" onsubmit="return false">
                <div class="columns">
                    <div class="column">
                        <h6>Event Types</h6>
                        <ul id="event-types"> 
                            <li v-for="(type, index) in Object.keys(eventData.eventTypes)">
                                <label v-bind:class="type.split('.').join(' ')" 
                                       v-on:click="toggleEventType(type)"
                                >
                                    <input type="checkbox" 
                                           value="1" 
                                           checked="checked" 
                                           v-bind:id=" 'filter-toggle-type-' + index" 
                                           v-on:change="toggleEventType(type)" 
                                    />
                                    <span>{{ type }}</span>
                                </label>
                            </li>
                        </ul>
                    </div>
                    <div class="column">
                        <h6>Tag Names</h6>
                        <ul id="node-names"> 
                            <li v-for="(type, index) in Object.keys(eventData.nodeNames)">
                                <label v-bind:class=" 'node-name-' + type.toLowerCase().replace(/[^a-z\-]+/g, '')" 
                                       v-on:click="toggleTagType(type)"
                                >
                                    <input type="checkbox" 
                                           value="1" 
                                           checked="checked" 
                                           v-bind:id=" 'filter-toggle-tag-' + index"
                                           v-on:change="toggleTagType(type)" 
                                    />
                                    <span>{{ type }}</span>
                                </label>
                            </li>
                        </ul>
                    </div>
                </div>
            </form>
            
            <div class="columns">
                <div class="column">
                    <info-block type="primary">
                        <p>Events are grouped into pages.  Pages are found by key event types.</p> 
                        <ul class="is-size-7"> 
                            <li>The profiler load event tags the first page, including refreshes and links.</li>
                            <li>Pop-state events fired after page load tags subsequent pages.</li>
                        </ul>
                    </info-block>
                </div>
                <div class="column">
                    <info-block type="primary"> 
                        <p>The width of the timeline (duration) can represent different values.</p>
                        <ul class="is-size-7">
                            <li> 
                                Synchronous events (DOM) represent the time until the next event.
                            </li>
                            <li> 
                                Asynchronous events (XHR) represent the duration of the event.
                            </li>
                        </ul>
                    </info-block>
                </div>
            </div>
            
            <table class="table waterfall">
                <thead>
                    <tr>
                        <th>Event</th>
                        <th>Timeline</th>
                        <th title="Time until next event.  For async events, it represents the true duration of the event.">Duration</th>
                        <th>Memory</th>
                        <th>
                            Date
                            <span class="icon">
                                <i class="fa fa-sort-amount-asc" aria-hidden="true"></i>
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(event, index) in eventData.events" 
                        v-if="event.type !== 'console'" 
                        v-bind:id=" 'event-row-' + index"
                        v-bind:class="getClassForEvent(event)" 
                        v-on:click="toggleEventDetails(event, index)"
                    >
                        <td>
                            <span v-if="event.isPageOverlap"> 
                                <span class="icon"> 
                                    <i class="fa fa-share fa-flip-vertical" aria-hidden="true"></i>
                                </span>
                            </span>
                            <span v-if="event.payload.type === 'error'">
                                {{ event.payload.eventPayload.event.type || 'Error' }}
                                <span class="icon has-text-danger"> 
                                    <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
                                </span> 
                            </span>
                            <span v-else-if="event.payload.type === 'xhr'">
                                {{ event.payload.type }}.{{ event.payload.eventPayload.event.type }}
                                <span v-if="event.payload.eventPayload.event.type === 'error'" 
                                      class="icon has-text-danger"
                                > 
                                    <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
                                </span>
                                <span v-else-if="event.payload.eventPayload.event.type === 'load' && event.payload.data.withCredentials"
                                      class="icon has-text-success"
                                      title="Sent With Authentication"
                                > 
                                    <i v-if="event.payload.data.url.substr(0, 5) === 'https'"
                                       class="fa fa-lock"></i>
                                    <i v-else class="fa fa-key" aria-hidden="true"></i>
                                </span> 
                            </span>
                            <span v-else-if="event.payload.eventPayload.event.type">
                                {{ event.payload.type }}.{{ event.payload.eventPayload.event.type }}
                            </span>
                            <span v-else>
                                {{ event.payload.type }}
                            </span>
                        </td>
                        <td class="timeline">
                            <span class="timeline-marker" v-bind:id=" 'marker-' + index"></span>
                            <span class="event-info is-size-7">
                                <span v-if="event.payload.isNewPage">
                                    {{ event.payload.eventPayload.metadata.url }}
                                </span>
                                <span v-else-if="event.payload.eventPayload.event.type === 'hashchange'"> 
                                    #{{ event.payload.eventPayload.metadata.url.split(/#/).pop() }}
                                </span>
                                <span v-else-if="event.payload.eventPayload.event.type === 'readystatechange'"
                                      class="is-capitalized"
                                > 
                                    {{ event.payload.eventPayload.metadata.readyState }}
                                </span>
                                <span v-else-if="event.payload.type === 'xhr' && event.payload.eventPayload.event.type === 'load'">
                                    {{ event.payload.data.responseStatusText }} 
                                    {{ event.payload.data.responseStatus }} 
                                    <span v-if="event.payload.data.responseTextBytes >= 1000000">
                                        ~{{ (event.payload.data.responseTextBytes / 1000000).toFixed(2) }} MB 
                                    </span>
                                    <span v-else-if="event.payload.data.responseTextBytes >= 500">
                                        ~{{ (event.payload.data.responseTextBytes / 1000).toFixed(1) }} KB
                                    </span>
                                    <span v-else>
                                        ~{{ event.payload.data.responseTextBytes }} B 
                                    </span>
                                </span>
                                <span v-else-if="event.payload.type === 'error'"> 
                                    {{ event.payload.eventPayload.event.message.substr(0, 100) }}
                                    <span v-if="event.payload.eventPayload.event.message.length > 100"> 
                                        &hellip;
                                    </span>
                                </span>
                                <span v-if="event.isOverlapDuration" class="icon"> 
                                    <i class="fa fa-share fa-rotate-180" aria-hidden="true"></i>
                                </span>
                                <!--<span v-else-if="event.payload.type === 'xhr'">{{ event.payload.data.url }}</span>-->
                                <!--<span v-else-if="event.payload.type === 'dom'">{{ event.payload.eventPayload.metadata.selector }}</span>-->
                            </span>
                            <div class="information"></div>
                        </td>
                        <td class="duration" v-bind:class="event.payload.data && (event.payload.data.duration >= 3500 ? 'is-danger' : (event.payload.data.duration >= 850 ? 'is-warning' : ''))">
                            <span v-if="event.payload.data && event.payload.data.duration"> 
                                {{ (event.payload.data.duration / 1000).toFixed(3) }} sec 
                            </span>
                            <span v-else>
                                {{ (event.payload.eventPayload.duration / 1000).toFixed(3) }} sec
                            </span>
                        </td>
                        <td class="memory"> 
                            <span v-if="event.memory instanceof Object"> 
                                <span v-if="event.memory.isUp" class="icon has-text-warning">
                                     <i class="fa fa-long-arrow-up" aria-hidden="true"></i>
                                </span>
                                <span v-else-if="event.memory.isDown" class="icon has-text-success">
                                     <i class="fa fa-long-arrow-down" aria-hidden="true"></i>
                                </span>
                                {{ (event.memory.usedJSHeapSize / 1000000).toFixed(3) }} mb
                            </span>
                        </td>
                        <td class="date">
                            {{ new Date(event.payload.eventPayload.metadata.time) | moment('H:mm:ss') }}.{{ new Date(event.payload.eventPayload.metadata.time) | moment('SSS') }}
                        </td>
                    </tr>
                </tbody>
            </table>
        
        </div>

    `,

    props: ['id', 'session', 'account', 'website', 'recordings', 'getEventData', 'isReady'],

    data: function() {
        // TODO: need to place memory up and down markers when events / tags are toggled
        return {
            eventData: this.getEventData(),
            getClassForEvent: function(event) {
                const payload = event.payload;
                const eventPayload = payload.eventPayload;
                const metadata = eventPayload.metadata;

                let className = payload.type;

                if (eventPayload.event.type) {
                    className += ' evt-' + eventPayload.event.type;
                }

                const nodeName = metadata.nodeName &&
                                    metadata.nodeName.toLowerCase().replace(/[^a-z\-]+/g, '');

                if (nodeName && nodeName.length !== 0) {
                    className += ' node-name-' + nodeName;
                }

                if (payload.isNewPage) {
                    className += ' is-new-page';
                }

                if (event.isPageOverlap) {
                    className += ' is-page-overlap';
                }

                return className;
            },
            toggleEventType: function(type) {
                const table = document.querySelector('table.waterfall');
                const input = document.querySelector('label.' + type + ' input');
                const eventNodeSelector = type.split('.').shift() + '.evt-' + type.split('.').pop();
                const eventNodes = table.querySelectorAll('tr.' + eventNodeSelector);
                const hideClassName = 'hide-event-type-' + type.split('.').join('-');
                const tblHasClass = table.className.indexOf(hideClassName) !== -1;
                if (!input.checked) {
                    if (tblHasClass) {
                        return;
                    }
                    table.className += ' ' + hideClassName;
                    eventNodes.forEach(node => node.style.display = 'none');
                } else {
                    if (!tblHasClass) {
                        return;
                    }
                    table.className = table.className.replace(hideClassName, '');
                    eventNodes.forEach(node => node.style.display = '');
                }
                styleEventMarkers(this.eventData);
            },
            toggleTagType: function(nodeName) {
                nodeName = nodeName.toLowerCase().replace(/[^a-z\-]+/g, '');
                const table = document.querySelector('table.waterfall');
                const input = document.querySelector('label.node-name-' + nodeName + ' input');
                const eventNodes = table.querySelectorAll('tr.node-name-' + nodeName);
                const hideClassName = 'hide-node-name-' + nodeName;
                const tblHasClass = table.className.indexOf(hideClassName) !== -1;
                if (!input.checked) {
                    if (tblHasClass) {
                        return;
                    }
                    table.className += ' ' + hideClassName;
                    eventNodes.forEach(node => node.style.display = 'none');
                } else {
                    if (!tblHasClass) {
                        return;
                    }
                    table.className = table.className.replace(hideClassName, '');
                    eventNodes.forEach(node => node.style.display = '');
                }
                styleEventMarkers(this.eventData);
            },
            toggleEventDetails: function(event, index) {
                const tr = document.getElementById('event-row-' + index);
                if (!tr) {
                    return;
                }

                if (tr.className.indexOf('has-info') !== -1) {
                    document.getElementById('event-row-information-' + index).remove();
                    tr.className = tr.className.replace(/\s*has\-info/g, '');
                    return;
                }

                const info = tr.querySelector('.information');
                const infoTr = document.createElement('tr');
                const infoTd = document.createElement('td');
                info.innerHTML = '<pre>' + JSON.stringify(event, null, 4) + '</pre>';
                infoTr.id = 'event-row-information-' + index;
                infoTr.className = 'event-information';
                infoTd.colSpan = tr.getElementsByTagName('td').length;
                infoTd.appendChild(info.cloneNode(true));
                infoTr.appendChild(infoTd);
                tr.parentNode.insertBefore(infoTr, tr.nextSibling);

                tr.className = (tr.className || '') + ' has-info';
            }
        };
    },

    updated: function() {
        this.$nextTick(() => styleEventMarkers(this.eventData));
    },

    created: function() {
        this.$nextTick(() => styleEventMarkers(this.eventData));
    }

});
