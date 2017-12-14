/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * No-Op function for default onMessage, onError
 * @returns {void}
 */
const noop = function() { };

/**
 * Cross Origin Worker - Uses an iframe to communicate with a worker
 */
export class CORSWorker {
    /**
     *
     * @param {String} frameUrl
     * @param {Function} [onMessage]
     * @param {Function} [onError]
     */
    constructor(frameUrl, onMessage = noop, onError = noop) {
        this.onMessage = onMessage;
        this.onError = onError;
        this.messageQueue = [];
        this._embedFrame(frameUrl);
        this._loading = false;
    }

    /**
     * Embed the frame
     * @param {String} frameUrl
     * @returns {void}
     * @private
     */
    _embedFrame(frameUrl) {
        if (document.readyState !== 'interactive' && document.readyState !== 'complete') {
            setTimeout(() => this._embedFrame(frameUrl), 10);
            return;
        }

        if (this._loading) {
            return;
        }

        this._loading = true;

        const iframe = document.createElement('iframe');
        iframe.src = frameUrl;
        iframe.id = 'client-profiler';
        iframe.style.display = 'none';

        document.body.appendChild(iframe);

        iframe.addEventListener('load', evt => {
            this.iframe = iframe;
            this._loading = false;

            while (this.messageQueue.length !== 0) {
                const msg = this.messageQueue.shift();
                if (msg === 'terminate') {
                    this.terminate();
                    return;
                }
                this.postMessage(msg);
            }
        });

        iframe.addEventListener('message', evt => {
            // TODO: check evt.origin
            switch (evt.data) {
                case 'worker.error' :
                    this.onError(evt.data.data.error);
                    break;

                case 'worker.message' :
                    this.onMessage(evt.data);
                    break;
            }
        });
    }

    /**
     * Terminate the worker (and remove the iframe)
     * @returns {void}
     */
    terminate() {
        if (!this.iframe) {
            this.messageQueue.push('terminate');
            return;
        }
        this.iframe.contentWindow.postMessage('worker.terminate', '*');
        this.iframe.remove();
        this.iframe = null;
    }

    /**
     * Post a message to the worker
     * @param {*} data
     * @returns {void}
     */
    postMessage(data) {
        if (!this.iframe) {
            this.messageQueue.push(data);
            return;
        }
        this.iframe.contentWindow.postMessage(data, '*');
    }
}