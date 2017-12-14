/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Vue from 'vue';

export default Vue.extend({

    template: `
            
        <section id="session-overview">
            
            <header>
                <div class="columns has-text-dark">
                    <div class="column">
                        <span class="icon is-size-2"> 
                            <i v-if="session.browser.os.family.toLowerCase().indexOf('mac') !== -1" 
                                class="fa fa-apple" 
                                aria-hidden="true" />
                            
                            <i v-else-if="session.browser.os.family.toLowerCase().indexOf('win') !== -1" 
                               class="fa fa-windows" 
                               aria-hidden="true" />
                            
                            <i v-else class="fa fa-linux" aria-hidden="true" />
                        </span>
                        <span class="icon-text is-size-3">{{ session.browser.os.family }}</span>
                    </div>

                    <div class="column">
                        <span class="icon is-size-2"> 
                            <i v-if="session.browser.is.chrome" 
                                class="fa fa-chrome" 
                                aria-hidden="true" />
                            
                            <i v-else-if="session.browser.is.opera" 
                               class="fa fa-opera" 
                               aria-hidden="true" />
                            
                            <i v-else-if="session.browser.is.firefox" 
                               class="fa fa-firefox" 
                               aria-hidden="true" />
                               
                            <i v-else-if="session.browser.is.safari" 
                               class="fa fa-safari" 
                               aria-hidden="true" />
                           
                            <i v-else-if="session.browser.is.ie && session.browser.agent.family == 'edge'" 
                               class="fa fa-edge" 
                               aria-hidden="true" />
                           
                            <i v-else-if="session.browser.is.ie" 
                               class="fa fa-internet-explorer" 
                               aria-hidden="true" />

                            <i v-else class="fa fa-desktop" aria-hidden="true" />
                        </span>
                        <span class="icon-text is-size-3"> 
                            <span v-if="session.browser.is.mobile_safari" 
                                  class="is-size-7 has-text-weight-semibold"
                            >Mobile</span>

                            {{ session.browser.agent.family }} 

                            <span class="browser-version is-size-7 has-text-weight-semibold">
                                v{{ session.browser.is.version }}
                            </span>

                            <span v-if="session.browser.device.family != 'Other'" 
                                  class="is-size-7"
                              >// {{ session.browser.device.family }}</span>
                        </span>
                    </div>
                    
                    <div class="column">
                        <span class="icon is-size-2"> 
                            <i class="fa fa-clock-o" aria-hidden="true" />
                        </span>
                        <span class="icon-text is-size-3"> 
                            <span v-if="eventData.duration < 1000">
                                {{ eventData.duration }} 
                                <span class="is-size-7 has-text-weight-semibold">MS</span>
                            </span>
                            <span v-else-if="eventData.duration < 60000">
                                {{ (eventData.duration / 1000).toFixed(3) }} 
                                <span class="is-size-7 has-text-weight-semibold">Seconds</span>
                            </span>
                            <span v-else-if="eventData.duration < 3600000">
                                {{ (eventData.duration / 60000).toFixed(3) }} 
                                <span class="is-size-7 has-text-weight-semibold">Minutes</span>
                            </span>
                            <span v-else-if="eventData.duration < 86400000">
                                {{ (eventData.duration / 3600000).toFixed(3) }} 
                                <span class="is-size-7 has-text-weight-semibold">Hours</span>
                            </span>
                            <span v-else>
                                {{ (eventData.duration / 86400000).toFixed(3) }} 
                                <span class="is-size-7 has-text-weight-semibold">Days</span>
                            </span>
                        </span>
                    </div>
                </div>
            </header>
            
            <info-block type="danger" v-for="error of eventData.errors"> 
                <h4>{{ error.payload.eventPayload.metadata.errorClassName }}</h4>
                <p>{{ error.payload.eventPayload.event.message }}</p>
                <pre>{{ error.payload.eventPayload.metadata.stackTrace }}</pre>
            </info-block>
            
            <section class="content">
                <p class="is-size-3">
                    <span class="icon"> 
                        <i class="fa fa-hashtag" aria-hidden="true" />
                    </span>
                    <span class="icon-text">
                        {{ session.pageCount }}
                        <span v-if="session.pageCount === 1">Page Visited</span>
                        <span v-else>Pages Visited</span>
                    </span>
                </p>
                <table>
                    <thead>
                        <tr>
                            <th>URL</th>
                            <th>Duration</th>
                            <th>
                                Date
                                <span class="icon">
                                    <i class="fa fa-sort-amount-asc" aria-hidden="true"></i>
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="page in eventData.pages">
                            <td class="url">
                                <span v-if="page.hasErrors" class="icon has-text-danger">
                                    <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
                                </span>
                                {{ page.url }}
                            </td>
                            <td>
                                <span v-if="page.duration < 1000">{{ page.duration }} ms</span>
                                <span v-else-if="page.duration < 60000">{{ (page.duration / 1000).toFixed(3) }} seconds</span>
                                <span v-else-if="page.duration < 3600000">{{ (page.duration / 60000).toFixed(3) }} minutes</span>
                                <span v-else-if="page.duration < 86400000">{{ (page.duration / 3600000).toFixed(3) }} hours</span>
                                <span v-else>{{ (page.duration / 86400000).toFixed(3) }} days</span>
                            </td>
                            <td>
                                {{ page.time | moment('H:mm:ss') }}.{{ page.time | moment('SSS') }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>
        
        </section>

    `,

    props: ['id', 'session', 'account', 'website', 'recordings', 'getEventData', 'isReady'],

    data: function() {
        return {
            eventData: this.getEventData()
        }
    }

});
