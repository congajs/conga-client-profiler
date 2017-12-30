/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// external libs
const _ = require('lodash');

import Vue from 'vue';

// bundle libs
const { eventAggregator } = require('../../../../recording/EventAggregator');

// local libs
import HttpService from './HttpService';

// css
import './../css/client-profiler.css';

// the component
export default Vue.extend({

    template: `

        <div id="client-profiler">

            <hero>

                <span slot="hero-title">Client Profiler</span>
                <span slot="hero-subtitle">
                    <strong>{{ account.firstName }} {{ account.lastName }}</strong>
                    // {{ website.host }}
                </span>

                <div class="container" slot="hero-foot">

                    <div class="tabs is-boxed">
                        <ul>
                            <li v-bind:class="{ 'is-active': $route.name === 'client-profiler.session' }">
                                <router-link class="panel-block":to="{ name: 'client-profiler.session', params: { id: id }}">
                                    Session Overview
                                </router-link>
                            </li>
                            <li v-bind:class="{ 'is-active': $route.name === 'client-profiler.session.waterfall' }">
                                <router-link class="panel-block":to="{ name: 'client-profiler.session.waterfall', params: { id: id }}">
                                    Event Waterfall
                                </router-link>
                            </li>
                        </ul>
                    </div>

                </div>

            </hero>

            <main-section v-if="isReady !== false">

                <div class="content">
                    <router-view 
                        :session=session 
                        :account=account 
                        :website=website 
                        :recordings=recordings
                        :is-ready=isReady
                        :get-event-data=getEventData
                    ></router-view>
                </div>

            </main-section>

        </div>

    `,

    props: ['id'],

    data: function() {

        /**
         * Wrapper for aggregateEventData
         * @see aggregateEventData
         */
        const getEventData = recordings => {
            if (!getEventData._events) {
                getEventData._events = eventAggregator(recordings);
            }
            return getEventData._events;
        };
        getEventData._events = null;

        return {
            isReady: false,
            session: {browser: {os: {}, is: {}, agent: {}}},
            account: {},
            website: {},
            token: {},
            recordings: [],
            getEventData: function() {
                return getEventData(this.recordings);
            }
        };
    },

    created: function() {
        const url = '_conga/profiler/client/session/' + encodeURIComponent(this.id);
        HttpService.get(this.$http, this.$router, url).then(response => {
            this.session = response.body.session;
            this.account = response.body.account;
            this.website = response.body.website;
            this.token = response.body.token;
            this.recordings = response.body.recordings;
            this.isReady = true;
        }, (response) => {

        });
    }
});
