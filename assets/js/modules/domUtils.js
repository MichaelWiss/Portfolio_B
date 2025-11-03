/**
 * DOM Utilities Module
 * Reusable helpers for common DOM operations
 * Reduces code duplication across rendering functions
 */

const DOMUtils = (() => {
    const SVG_NS = 'http://www.w3.org/2000/svg';

    return {
        /**
         * Query a single element, return null if not found
         * @param {string} selector - CSS selector
         * @param {Element} context - Optional context element (defaults to document)
         */
        query(selector, context = document) {
            if (!selector || !context) return null;
            return context.querySelector(selector);
        },

        /**
         * Query all elements matching selector
         */
        queryAll(selector, context = document) {
            if (!selector || !context) return [];
            return Array.from(context.querySelectorAll(selector));
        },

        /**
         * Query element by ID
         */
        byId(id) {
            if (!id) return null;
            return document.getElementById(id);
        },

        /**
         * Create a regular DOM element
         */
        createElement(tag, className = '', attributes = {}) {
            const el = document.createElement(tag);
            if (className) {
                el.className = className;
            }
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'text') {
                    el.textContent = value;
                } else if (key === 'html') {
                    el.innerHTML = value;
                } else {
                    el.setAttribute(key, value);
                }
            });
            return el;
        },

        /**
         * Create an SVG element
         */
        createSVG(tag, attributes = {}) {
            const el = document.createElementNS(SVG_NS, tag);
            Object.entries(attributes).forEach(([key, value]) => {
                el.setAttribute(key, value);
            });
            return el;
        },

        /**
         * Apply multiple styles to element
         */
        applyStyles(el, styles = {}) {
            if (!el || !styles) return;
            Object.assign(el.style, styles);
        },

        /**
         * Apply inline styles using Object.assign (for computed styles)
         */
        setInlineStyles(el, styles = {}) {
            if (!el) return;
            Object.entries(styles).forEach(([key, value]) => {
                el.style[key] = value;
            });
        },

        /**
         * Add event listener with automatic cleanup tracking
         */
        addEventListener(el, event, handler, options = {}) {
            if (!el) return () => {};
            el.addEventListener(event, handler, options);
            // Return cleanup function
            return () => el.removeEventListener(event, handler, options);
        },

        /**
         * Add multiple event listeners and return cleanup function
         */
        addEventListeners(el, events = {}) {
            const cleanups = [];
            Object.entries(events).forEach(([event, handler]) => {
                cleanups.push(this.addEventListener(el, event, handler));
            });
            return () => cleanups.forEach(fn => fn());
        },

        /**
         * Clear all children from element
         */
        clearChildren(el) {
            if (!el) return;
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        },

        /**
         * Toggle class on element
         */
        toggleClass(el, className, force) {
            if (!el) return;
            el.classList.toggle(className, force);
        },

        /**
         * Add classes to element
         */
        addClass(el, ...classNames) {
            if (!el) return;
            el.classList.add(...classNames);
        },

        /**
         * Remove classes from element
         */
        removeClass(el, ...classNames) {
            if (!el) return;
            el.classList.remove(...classNames);
        },

        /**
         * Check if element has class
         */
        hasClass(el, className) {
            if (!el) return false;
            return el.classList.contains(className);
        },

        /**
         * Get data attribute value
         */
        getData(el, key) {
            if (!el) return undefined;
            return el.dataset[key];
        },

        /**
         * Set data attribute value
         */
        setData(el, key, value) {
            if (!el) return;
            el.dataset[key] = value;
        },

        /**
         * Get attribute value
         */
        getAttribute(el, attr) {
            if (!el) return null;
            return el.getAttribute(attr);
        },

        /**
         * Set attribute value
         */
        setAttribute(el, attr, value) {
            if (!el) return;
            el.setAttribute(attr, value);
        },

        /**
         * Remove attribute
         */
        removeAttribute(el, attr) {
            if (!el) return;
            el.removeAttribute(attr);
        },

        /**
         * Insert element after another
         */
        insertAfter(newElement, referenceElement) {
            if (!referenceElement || !newElement) return;
            referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
        },

        /**
         * Insert element before another
         */
        insertBefore(newElement, referenceElement) {
            if (!referenceElement || !newElement) return;
            referenceElement.parentNode.insertBefore(newElement, referenceElement);
        },

        /**
         * Append element to parent
         */
        append(parent, child) {
            if (!parent || !child) return;
            parent.appendChild(child);
        },

        /**
         * Append multiple children to parent
         */
        appendChildren(parent, children = []) {
            if (!parent) return;
            children.forEach(child => {
                if (child) parent.appendChild(child);
            });
        },

        /**
         * Get computed style value
         */
        getComputedStyle(el, property) {
            if (!el) return null;
            return window.getComputedStyle(el).getPropertyValue(property);
        },

        /**
         * Check if element is connected to DOM
         */
        isConnected(el) {
            return el && el.isConnected;
        },

        /**
         * Closest parent matching selector
         */
        closest(el, selector) {
            if (!el) return null;
            return el.closest(selector);
        },

        /**
         * Get offset dimensions
         */
        getOffset(el) {
            if (!el) return { top: 0, left: 0, width: 0, height: 0 };
            const rect = el.getBoundingClientRect();
            return {
                top: el.offsetTop,
                left: el.offsetLeft,
                width: el.offsetWidth,
                height: el.offsetHeight,
                offsetHeight: el.offsetHeight,
                scrollWidth: el.scrollWidth,
                scrollHeight: el.scrollHeight,
            };
        },

        /**
         * Get bounding client rect
         */
        getBounds(el) {
            if (!el) return null;
            return el.getBoundingClientRect();
        },

        /**
         * Parse pixels string to number
         */
        parsePixels(value) {
            const parsed = parseFloat(value || '0');
            return Number.isNaN(parsed) ? 0 : parsed;
        },

        /**
         * Check if element matches selector
         */
        matches(el, selector) {
            if (!el) return false;
            return el.matches(selector);
        },
    };
})();
