/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import('./app/Profiler').then(module => {

    const { Profiler } = module;

    const profiler = new Profiler({
        event: evt => {
            //console.log('got event', evt);
        },
        error: err => {
            console.log('got error', err);
        },
        message: payload => {
            //console.log('got message', payload);
        },
        url: 'http://localhost:3000'
    });

    profiler.start();

}).catch(err => console.error(err.stack || err));