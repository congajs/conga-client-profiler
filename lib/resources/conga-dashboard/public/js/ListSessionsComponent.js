/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Vue from 'vue';

import HttpService from './HttpService';

export default Vue.extend({

    template: `

        <div>

            <hero>

                <span slot="hero-title">Client Profiler</span>
                <span slot="hero-subtitle">@conga/framework-profiler-client</span>

                <div class="container" slot="hero-foot">

                    <div class="tabs is-boxed">
                        <ul>
                            <li>
                                <router-link :to="{name: 'profiler'}">
                                    Request History
                                </router-link>
                            </li>
                            <li class="is-active"><a>Client Sessions</a></li>
                        </ul>
                    </div>

                </div>

            </hero>

            <main-section>

                <article class="message is-primary">
                    <div class="message-body">
                        These are the client sessions captured by the profiler.
                    </div>
                </article>


                    <div class="field has-addons is-pulled-right">
                      <div class="control">
                        <input class="input" type="text" placeholder="search by url, status, xhr, datetime">
                      </div>
                      <div class="control">
                        <a class="button">
                            <span class="icon is-small is-left">
                               <i class="fa fa-search"></i>
                             </span>
                        </a>
                      </div>
                    </div>

                    <table class="table is-striped is-narrow is-fullwidth" style="font-size: 11px;">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th>Website</th>
                                <th>OS</th>
                                <th>User Agent</th>
                                <th>Has Errors</th>
                                <th>Duration</th>
                                <th>Page Count</th>
                                <th>IP Address</th>
                                <th>Created At</th>
                                <th>Updated At</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="session in sessions" v-on:click="open(session.id)">
                                <td>
                                    {{ accounts[session.accountId].firstName }}
                                    {{ accounts[session.accountId].lastName }}                                
                                </td>
                                <td>{{ websites[session.websiteId].host }}</td>
                                <td>
                                    {{ session.browser.os.family }} 
                                    <span v-if="session.browser.device.family != 'Other'">// {{ session.browser.device.family }}</span>
                                </td>
                                <td v-bind:title="session.userAgent">
                                    <span v-if="session.browser.is.chrome">
                                        Chrome
                                        <span class="icon">
                                            <i class="fa fa-chrome" aria-hidden="true"></i>
                                        </span>
                                    </span>
                                    <span v-else-if="session.browser.is.opera">
                                        Opera
                                        <span class="icon">
                                            <i class="fa fa-opera" aria-hidden="true"></i>
                                        </span>
                                    </span>
                                    <span v-else-if="session.browser.is.firefox">
                                        FireFox
                                        <span class="icon">
                                            <i class="fa fa-firefox" aria-hidden="true"></i>
                                        </span>
                                    </span>
                                    <span v-else-if="session.browser.is.safari">
                                        <span v-if="session.browser.is.mobile_safari">Mobile</span>
                                        Safari
                                        <span class="icon">
                                            <i class="fa fa-safari" aria-hidden="true"></i>
                                        </span>
                                    </span>
                                    <span v-else-if="session.browser.is.ie && session.browser.agent.family == 'edge'">
                                        Edge
                                        <span class="icon">
                                            <i class="fa fa-edge" aria-hidden="true"></i>
                                        </span>
                                    </span>
                                    <span v-else-if="session.browser.is.ie">
                                        IE (v{{ session.browser.is.version }})
                                        <span class="icon">
                                            <i class="fa fa-internet-explorer" aria-hidden="true"></i>
                                        </span>
                                    </span>
                                </td>
                                <td>{{ session.hasError ? 'Has Errors' : 'NO' }}</td>
                                <td>
                                    <span v-if="session.duration < 1000">{{ session.duration }} ms</span>
                                    <span v-else-if="session.duration < 60000">{{ (session.duration / 1000).toFixed(3) }} seconds</span>
                                    <span v-else-if="session.duration < 3600000">{{ (session.duration / 60000).toFixed(3) }} minutes</span>
                                    <span v-else-if="session.duration < 86400000">{{ (session.duration / 3600000).toFixed(3) }} hours</span>
                                    <span v-else>{{ (session.duration / 86400000).toFixed(3) }} days</span>
                                </td>
                                <td>
                                    {{ session.pageCount }}
                                    {{ session.pageCount === 1 ? 'Page' : 'Pages' }} 
                                </td>
                                <td>{{ session.ipAddress }}</td>
                                <td>
                                    {{ session.createdAt | moment('H:mm:ss') }}.{{ session.createdAt | moment('SSS') }}
                                </td>
                                <td>
                                    {{ session.updatedAt | moment('H:mm:ss') }}.{{ session.updatedAt | moment('SSS') }}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <nav class="pagination is-small" role="navigation" aria-label="pagination">
                      <a class="pagination-previous">Previous</a>
                      <a class="pagination-next">Next page</a>
                      <ul class="pagination-list">
                        <li><a class="pagination-link" aria-label="Goto page 1">1</a></li>
                        <li><span class="pagination-ellipsis">&hellip;</span></li>
                        <li><a class="pagination-link" aria-label="Goto page 45">45</a></li>
                        <li><a class="pagination-link is-current" aria-label="Page 46" aria-current="page">46</a></li>
                        <li><a class="pagination-link" aria-label="Goto page 47">47</a></li>
                        <li><span class="pagination-ellipsis">&hellip;</span></li>
                        <li><a class="pagination-link" aria-label="Goto page 86">86</a></li>
                      </ul>
                    </nav>

            </main-section>

        </div>

    `,

    data: function() {
        return {
            sessions: [],
            accounts: {},
            websites: {},
            token: null
        };
    },

    created: function() {
        HttpService.get(this.$http, this.$router, '_conga/profiler/client/sessions').then(response => {
            this.sessions = response.body.sessions;
            this.accounts = response.body.accounts;
            this.websites = response.body.websites;
            this.token = response.body.token;
        }, (response) => {

        });
    },

    methods: {
        open: function(id) {
            this.$router.push({ name: 'client-profiler.session', params: { id }});
        }
    }

});
