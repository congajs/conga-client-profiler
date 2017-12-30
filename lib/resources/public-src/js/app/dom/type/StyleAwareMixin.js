/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
import { DomEvent } from './DomEvent';
import { DomUtil } from '../DomUtil';

/**
 * The style aware event type assists with events that affect style information
 * @returns {StyleAwareEvent}
 */
export const StyleAwareMixin = (parent = DomEvent) => class StyleAwareEvent extends parent {
    /**
     * Capture the loaded style sheets on the document
     * @Returns {void}
     */
    captureStyleSheets() {
        return new Promise((resolve, reject) => {
            if (this.isNode || this.isDocument) {
                this.metadata.styleSheets = this.window.document.styleSheets;
            }
            resolve();
        });
    }

    /**
     * Capture the perimeter styles
     * @returns {void}
     */
    capturePerimeter() {
        if (!this.isNode && !this.isDocument) {
            return;
        }

        /**
         *
         * BLAH!!!
         *
         * ON PLAYBACK - after load after ready, go through all style rules and find :hover
         * Replace :hover with .__conga-client-profiler-HOVER__
         *
         * On mouse over add __conga-client-profiler-HOVER__ to node
         * On mouse out remove __conga-client-profiler-HOVER__ from node
         *
         * On mouse over also find all nodes matching .__conga-client-profiler-HOVER and if the node
         * is not equal to or a parent of the mouse over target, remove the class from it (ie. get the path to body, if the node is not in the path, remove class)
         *
         * Note: common sibling / descendants of a common parent need to stay hover but will be removed without more work
         *
         */

        // let path = [];
        // let level = 0;
        // let captured = {};
        // let perimeter = [];
        // let node = this.el;
        //
        // // go to document.body and capture styles for each node in the path
        // while (node &&
        //     node.nodeName !== 'BODY' &&
        //     node.nodeName !== '#document'
        // ) {
        //     if (level !== 0) {
        //         const selector = DomUtil.getSelectorFromNode(node);
        //         if (!(selector in captured)) {
        //             perimeter.push({
        //                 selector,
        //                 styles: this.window.getComputedStyle(node)
        //             });
        //             captured[selector] = 1;
        //         }
        //         if (level < 2) {
        //             path.push(node);
        //         }
        //     }
        //     node = node.parentNode;
        //     level += 1;
        // }
        // if (path.length !== 0) {
        //     perimeter = perimeter.concat(DomUtil.childrenStylesFromPath(path, captured));
        // }
        //
        // // go down
        // level = 0;
        // path = [];
        // node = this.el;
        // while (node.firstElementChild && ++level <= 100) {
        //     node = node.firstElementChild;
        //     path.push(node);
        // }
        // perimeter = perimeter.concat(DomUtil.childrenStylesFromPath(path, captured));
        //
        // // get sibling children
        // if (this.el.parentNode) {
        //     node = this.el.parentNode.firstElementChild;
        //     while (node) {
        //         if (node !== this.el) {
        //             perimeter = perimeter.concat(DomUtil.captureChildrenStyles(node, captured));
        //         }
        //         node = node.nextElementSibling;
        //     }
        // }
        //
        // this.metadata.perimeter = perimeter;
    }

    /**
     * Capture this node's computed style
     * @returns {void}
     */
    captureComputedStyle() {
        let el;
        if (this.isDocument || this.isWindow) {
            el = this.window.document.body;
        } else if (this.isNode) {
            el = this.el;
        }
        if (el) {
            this.metadata.computedStyle = this.window.getComputedStyle(el);
        }
    }

    /**
     * Apply styles for playback
     * @param {Object} styles
     * @param {Element} [el]
     * @return {void}
     */
    applyStyles(styles, el = this.el) {
        if (!el) {
            return;
        }
        for (const style in styles) {
            if (style in el.style) {
                el.style[style] = styles[style];
            } else {
                el.style[style] = '';
            }
        }
    }

    /**
     * Apply style sheets for playback
     * @param {StyleSheetList|Array} styleSheets Style sheets (serialized or not)
     * @returns {void}
     */
    applyStyleSheets(styleSheets) {
        styleSheets = Array.prototype.slice.call(styleSheets);
        if (styleSheets.length === 0) {
            return;
        }
        const id = 'conga-client-profiler-playback-styles';
        let node = this.window.document.querySelector('style#' + id);
        if (!node) {
            node = document.createElement('style');
            node.id = id;
            this.window.document.querySelector('head').appendChild(node);
        }
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
        styleSheets.forEach(sheet => {
            node.appendChild(document.createTextNode(sheet.cssText));
        });
    }

    /**
     * Playback the captured styles
     * @returns {Promise}
     */
    playbackStyles() {
        if (!this.el || !this.el.style) {
            return Promise.resolve();
        }
        if (this.metadata.styleSheets) {
            this.applyStyleSheets(this.metadata.styleSheets);
        }
        if (this.metadata.perimeter) {
            for (const data of this.metadata.perimeter) {
                if (data.selector && data.selector.length !== 0) {
                    const el = DomUtil.querySelector(data.selector, this.window);
                    if (!el) {
                        //console.log('NO EL', data.selector);
                        continue;
                    }
                    this.applyStyles(
                        data.styles,
                        DomUtil.querySelector(data.selector, this.window)
                    );
                }
            }
        }
        if (this.metadata.computedStyle) {
            this.applyStyles(this.metadata.computedStyle);
        }
        return Promise.resolve();
    }

    /**
     * Serialize computed styles
     * @param {Object} styles
     * @returns {Object}
     */
    serializeStyles(styles) {
        if (!(styles instanceof Object)) {
            return styles;
        }
        return JSON.parse(JSON.stringify(
            Object.keys(styles).reduce((obj, key) => {
                if (isNaN(key) && styles[key].length !== 0) {
                    obj[key] = styles[key];
                }
                return obj;
            }, {})
        ));
    }

    /**
     * Serialize document style sheets
     * @param {StyleSheetList} styleSheets
     * @returns {Array}
     */
    serializeStyleSheets(styleSheets) {
        return Array.prototype.reduce.call(styleSheets, (array, sheet) => {
            let rules;
            if ('cssRules' in sheet) {
                rules = sheet.cssRules;
            } else if ('rules' in sheet) {
                rules = sheet.rules;
            }
            if (rules) {
                array.push({
                    rules: Array.prototype.map.call(rules, rule => ({
                        cssText: rule.cssText,
                        hasParentRule: !!rule.parentRule,
                        hasParentStyleSheet: !!rule.parentStyleSheet,
                        selectorText: rule.selectorText,
                        style: this.serializeStyles(rule.style),
                        type: rule.type
                    })),
                    disabled: sheet.disabled,
                    href: sheet.href,
                    media: Array.prototype.slice.call(sheet.media),
                    ownerNode: DomUtil.getNodePathSelector(sheet.ownerNode),
                    ownerRule: sheet.ownerRule,
                    hasParentStyleSheet: !!sheet.parentStyleSheet,
                    title: sheet.title,
                    type: sheet.type
                });
            }
            return array;
        }, []);
    }

    /**
     * Serialize the style data in the metadata property
     * @returns {Object}
     */
    serializeStyleMetadata() {
        const json = {};
        if (this.metadata.perimeter) {
            json.perimeter = this.metadata.perimeter.map(data => ({
                selector: data.selector,
                styles: this.serializeStyles(data.styles),
            }));
        }
        if (this.metadata.computedStyle) {
            json.computedStyle = this.serializeStyles(this.metadata.computedStyle);
        }
        if (this.metadata.styleSheets) {
            json.styleSheets = this.serializeStyleSheets(this.metadata.styleSheets);
        }
        return json;
    }
};