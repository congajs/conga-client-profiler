/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// framework libs
const { Controller } = require('@conga/framework');

/**
 *
 * @Route("/recording/")
 */
class RecordingController extends Controller {

    /**
     *
     * @Route('worker/bridge', name="recording.worker.bridge", methods=["GET"])
     * @Template
     */
    iframe(req, res) {
        return Promise.resolve({});
    }

}

module.exports = RecordingController;