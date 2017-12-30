/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The class name used to replace the pseudo :hover selector
 * @type {string}
 */
export const HOVER_CLASS = '__conga-client-profiler-HOVER__';

/**
 * The hover-class regular expression
 * @type {RegExp}
 */
export const HOVER_CLASS_REG = new RegExp(HOVER_CLASS, 'g');

/**
 * The DomUtil has commonly used DOM procedures
 */
export class DomUtil {
    /**
     * Gets a CSS selector by traversing the DOM hierarchy (up the parent chain) for a given element
     * @param {Element|Node} node The HTML Element / node you want to get the CSS selector for
     * @returns {String}
     */
    static getSelectorFromNode(node) {
        if (!node) {
            return null;
        }
        if (node instanceof window.constructor) {
            return '#window';
        }
        if (node instanceof document.constructor) {
            return '#document';
        }
        let path = '';
        while (node) {

            if (node.nodeName === 'BODY' || node.nodeName === '#document') {
                break;
            }

            let nodePath = this.getNodePathSelector(node);

            if (path.length !== 0) {
                path = nodePath + ' > ' + path;
            } else {
                path = nodePath;
            }

            node = node.parentNode;
        }
        if (path.length === 0) {
            return '#document';
        }
        return path;
    }

    /**
     * Get a CSS selector for an event by traversing the event path (quicker than parent chain)
     * @param {Event} event The javascript event
     * @returns {String}
     */
    static getSelectorFromEvent(event) {
        if (!event.path) {
            if (event.target) {
                return this.getSelectorFromNode(event.target);
            }
            return null;
        }
        let path = '';
        let capturePath = false;
        let len = event.path.length;
        for (let i = len - 1; i >= 0; i--) {

            const node = event.path[i];

            if (!capturePath) {
                capturePath = node.nodeName === 'BODY';
            }

            if (capturePath) {
                if (path.length !== 0) {
                    path += ' > ';
                }

                path += this.getNodePathSelector(node);
            }
        }
        if (path.length === 0) {
            return DomUtil.getSelectorFromNode(event.target);
        }
        return path;
    }

    /**
     * Get the node-specific css identifier for a query selector, includes nth-child for siblings
     * @param {Element|Node} node The HTML Element  node
     * @returns {String} tag#id or tag.class.name.list:nth-child(2)
     */
    static getNodePathSelector(node) {
        let nodePath = node.nodeName.toLowerCase();

        if (nodePath === 'html' || nodePath === 'head') {
            return nodePath;
        }

        let nth = 1;
        let el = node;

        while (el.previousElementSibling) {
            el = el.previousElementSibling;
            nth += 1;
        }

        nodePath = nodePath.replace(/\.{2,}/g, '.').replace(/^\.|\.$/g, '');
        nodePath += ':nth-child(' + nth + 'n)';

        return nodePath;
    }

    /**
     * Get a node element from a query selector (with special rules)
     * @param {String} selector
     * @param {Window} [contentWindow] The content-window
     * @returns {*|Element}
     */
    static querySelector(selector, contentWindow = null) {
        // TODO: support #text:nth-child(2n) AND p:nth-child(1n) > #text:nth-child(1n)
        if (!contentWindow) {
            contentWindow = window;
        }
        if (selector === '#window') {
            return contentWindow;
        }
        if (selector === '#document') {
            return contentWindow.document.body;
        }
        try {
            return contentWindow.document.querySelector(selector);
        } catch (e) {
            console.error(e.stack || e);
            return null;
        }
    }

    /**
     * Get the window width
     * @param {Window} [contentWindow] The content-window
     * @returns {Number}
     */
    static windowWidth(contentWindow = null) {
        if (!contentWindow) {
            contentWindow = window;
        }
        return contentWindow.innerWidth || contentWindow.width;
    }

    /**
     * Get the window height
     * @param {Window} [contentWindow] The content-window
     * @returns {Number}
     */
    static windowHeight(contentWindow = null) {
        if (!contentWindow) {
            contentWindow = window;
        }
        return contentWindow.innerHeight || contentWindow.height;
    }

    /**
     * Get the window scroll top
     * @param {Window} [contentWindow] The content-window
     * @returns {Number}
     */
    static scrollTop(contentWindow = null) {
        if (!contentWindow) {
            contentWindow = window;
        }
        return contentWindow.scrollY === undefined
            ? contentWindow.document.body.scrollTop
            : contentWindow.scrollY;
    }

    /**
     * Get the window scroll left
     * @param {Window} [contentWindow] The content-window
     * @returns {Number}
     */
    static scrollLeft(contentWindow = null) {
        if (!contentWindow) {
            contentWindow = window;
        }
        return contentWindow.scrollX === undefined
            ? contentWindow.document.body.scrollLeft
            : contentWindow.scrollX;
    }

    /**
     * Capture styles for all child nodes
     * @param {Element} node
     * @param {Object} [captured] Hash of captured nodes by selector key
     * @returns {Array}
     */
    static captureChildrenStyles(node, captured = {}) {
        if (node.nodeName === 'HTML' || node.nodeName === 'HEAD') {
            return [];
        }
        return Array.prototype.reduce.call(node.childNodes, (array, child) => {
            if (child.nodeType !== Node.ELEMENT_NODE) {
                return array;
            }
            const selector = this.getSelectorFromNode(child);
            if (!(selector in captured)) {
                array.push({
                    selector,
                    styles: window.getComputedStyle(child)
                });
                captured[selector] = 1;
            }
            return array;
        }, []);
    }

    /**
     * Capture styles for all children nodes following a path of nodes
     * @param {Array<Element>} path The path of elements to follow
     * @param {Object} [captured] Hash of captured nodes by selector key
     * @returns {Array}
     */
    static childrenStylesFromPath(path, captured = {}) {
        let styles = [];
        if (path.length === 0) {
            return styles;
        }
        for (const node of path) {
            if (!node || node instanceof window.constructor) {
                continue;
            }
            if (node.nodeType === Node.ELEMENT_NODE &&
                node.nodeName !== 'HTML' &&
                node.nodeName !== 'HEAD' &&
                (!node.parentNode || node.parentNode.nodeName !== 'HEAD')
            ) {
                const selector = this.getSelectorFromNode(node);
                if (!(selector in captured)) {
                    styles.push({
                        selector,
                        styles: window.getComputedStyle(node)
                    });
                    captured[selector] = 1;
                }
            }
            styles = styles.concat(this.captureChildrenStyles(node, captured));
        }
        return styles;
    }

    /**
     * Replace the pseudo selectors with class names
     * @param {Window} [contentWindow] The window object to perform the operation on
     * @returns {void}
     */
    static replacePseudoCssForPlayback(contentWindow = null) {
        if (!contentWindow) {
            contentWindow = window;
        }

        const node = document.createElement('style');
        node.setAttribute('type', 'text/css');

        // TODO: I think this needs to be recursive to get everything

        const styles = contentWindow.document.styleSheets;
        for (const style of styles) {
            let which;
            if ('cssRules' in style) {
                which = 'cssRules';
            } else if ('rules' in style) {
                which = 'rules';
            }
            if (!which || typeof Object(style[which])[Symbol.iterator] !== 'function') {
                continue;
            }
            for (const rule of style[which]) {
                if (rule && rule.cssText && rule.cssText.indexOf(':hover') !== -1) {
                    const isMedia = rule.media && rule.media.length !== 0;
                    if (isMedia) {
                        let which;
                        if ('cssRules' in rule) {
                            which = 'cssRules';
                        } else if ('rule' in rule) {
                            which = 'rule';
                        } else {
                            continue;
                        }
                        let count = 0;
                        let str = '';
                        for (const media of rule[which]) {
                            if (media.cssText && media.cssText.indexOf(':hover') !== -1) {
                                const cssText = media.cssText.replace(/:hover(?=[^{]+{)/g, '.' + HOVER_CLASS);
                                str += '\t' + cssText + '\r\n';
                                count += 1;
                            }
                        }
                        if (count !== 0) {
                            str = '@media ' + rule.conditionText + ' { \r\n' + str + '}';
                            //console.log(str);
                            node.appendChild(document.createTextNode(str));
                        }
                    } else {
                        const cssText = rule.cssText.replace(/:hover(?=[^{]+{)/g, '.' + HOVER_CLASS);
                        node.appendChild(document.createTextNode(cssText));
                    }
                }
            }
        }

        contentWindow.document.getElementsByTagName('head')[0].appendChild(node);
    }
}