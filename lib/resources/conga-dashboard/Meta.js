/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const pck = require('../../../package.json');

module.exports = {

    id: 'client-profiler',
    name: 'Client Profiler',
    description: 'the client profiler',
    bundle: pck.name,
    version: pck.version

};
