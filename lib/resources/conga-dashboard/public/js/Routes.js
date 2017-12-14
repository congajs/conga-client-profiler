/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export default [

    {
        name: "client-profiler",
        path: "/profiler/client",
        component: require('./ListSessionsComponent').default,
    },
    {
        name: "client-profiler.login",
        path: "/profiler/client/login",
        component: require('./LoginComponent').default,
    },
    {
        path: "/profiler/client/session/:id",
        component: require('./SessionComponent').default,
        props: true,
        children: [
            {
                name: "client-profiler.session",
                path: "",
                component: require('./SessionOverviewComponent').default,
                props: true
            },
            {
                name: "client-profiler.session.waterfall",
                path: "/profiler/client/session/:id/waterfall",
                component: require('./SessionWaterfallComponent').default,
                props: true
            }
        ]
    }

];
