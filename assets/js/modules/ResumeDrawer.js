/**
 * ResumeDrawer Class
 * Encapsulates resume drawer functionality: initialization, content loading, opening, closing
 * Manages shadow DOM, focus management, and event listeners
 */

class ResumeDrawer {
    constructor() {
        this.element = null;
        this.panelElement = null;
        this.overlayElement = null;
        this.closeButton = null;
        this.statusElement = null;
        this.shadowHost = null;
        this.shadowRoot = null;
        this.externalStylesLoaded = false;
        this.contentLoaded = false;
        this.loadingPromise = null;
        this.triggerElement = null;
        this.focusReturnTarget = null;
        this.previousBodyOverflow = null;
        this.keydownHandler = null;
    }

    /**
     * Initialize drawer elements from DOM
     */
    init() {
        this.element = DOMUtils.byId(Constants.ELEMENTS.resumeDrawer);
        if (!this.element) return false;

        this.panelElement = DOMUtils.query(`.${Constants.CLASSES.resumeDrawerPanel}`, this.element);
        this.overlayElement = DOMUtils.query(`.${Constants.CLASSES.resumeDrawerOverlay}`, this.element);

        if (!this.panelElement) {
            console.warn('Resume drawer panel not found');
            return false;
        }

        this.setupDrawerStyles();
        this.setupOverlayStyles();
        this.setupPanelStyles();
        this.setupCloseButton();
        this.setupStatusElement();
        this.setupShadowHost();
        this.setupOverlayClickHandler();

        DOMUtils.removeAttribute(this.element, 'hidden');
        DOMUtils.setAttribute(this.element, Constants.ARIA.hidden, 'true');

        return true;
    }

    /**
     * Setup drawer container styles
     */
    setupDrawerStyles() {
        DOMUtils.setInlineStyles(this.element, {
            position: 'fixed',
            inset: '0',
            pointerEvents: 'none',
            zIndex: '2000',
        });
    }

    /**
     * Setup overlay styles
     */
    setupOverlayStyles() {
        if (!this.overlayElement) return;

        DOMUtils.setInlineStyles(this.overlayElement, {
            position: 'absolute',
            inset: '0',
            background: 'rgba(0, 0, 0, 0.35)',
            opacity: '0',
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none',
            zIndex: '2000',
        });
    }

    /**
     * Setup panel styles
     */
    setupPanelStyles() {
        DOMUtils.setInlineStyles(this.panelElement, {
            position: 'absolute',
            top: '0',
            right: '0',
            width: '100vw',
            height: '100vh',
            background: '#f5f5f5',
            overflowY: 'auto',
            padding: 'clamp(1rem, 2vw, 2rem)',
            transform: 'translateX(100%)',
            transition: 'transform 0.5s ease',
            zIndex: '2001',
        });
    }

    /**
     * Setup close button
     */
    setupCloseButton() {
        if (!this.closeButton) {
            this.closeButton = DOMUtils.createElement('button', '', {
                type: 'button',
                'aria-label': 'Close resume',
            });

            const icon = DOMUtils.createElement('span', '', { text: '✕' });
            DOMUtils.setAttribute(icon, Constants.ARIA.hidden, 'true');
            DOMUtils.append(this.closeButton, icon);

            DOMUtils.setInlineStyles(this.closeButton, {
                position: 'sticky',
                top: '0',
                margin: '0 0 1rem auto',
                width: '48px',
                height: '48px',
                border: 'none',
                borderRadius: '999px',
                fontSize: '1.5rem',
                color: '#1a1a1a',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '2101',
                transition: 'background 0.3s ease, transform 0.3s ease',
                background: 'rgba(0, 0, 0, 0.05)',
            });

            DOMUtils.addEventListener(this.closeButton, 'mouseenter', () => {
                this.closeButton.style.background = 'rgba(0, 0, 0, 0.1)';
                this.closeButton.style.transform = 'scale(1.05)';
            });

            DOMUtils.addEventListener(this.closeButton, 'mouseleave', () => {
                this.closeButton.style.background = 'rgba(0, 0, 0, 0.05)';
                this.closeButton.style.transform = 'scale(1)';
            });

            DOMUtils.addEventListener(this.closeButton, 'focus', () => {
                this.closeButton.style.background = 'rgba(0, 0, 0, 0.1)';
                this.closeButton.style.transform = 'scale(1.05)';
            });

            DOMUtils.addEventListener(this.closeButton, 'blur', () => {
                this.closeButton.style.background = 'rgba(0, 0, 0, 0.05)';
                this.closeButton.style.transform = 'scale(1)';
            });

            DOMUtils.addEventListener(this.closeButton, 'click', () => this.close());
        }

        if (!DOMUtils.isConnected(this.closeButton)) {
            DOMUtils.insertBefore(this.closeButton, this.panelElement.firstChild);
        }
    }

    /**
     * Setup status element for loading messages
     */
    setupStatusElement() {
        if (!this.statusElement) {
            this.statusElement = DOMUtils.createElement('p', '', {});
            DOMUtils.setInlineStyles(this.statusElement, {
                padding: '2rem',
                textAlign: 'center',
                fontSize: '1rem',
                color: '#2E2520',
                display: 'none',
            });
        }

        if (!DOMUtils.isConnected(this.statusElement)) {
            DOMUtils.append(this.panelElement, this.statusElement);
        }
    }

    /**
     * Setup shadow DOM host for isolated resume content
     */
    setupShadowHost() {
        if (!this.shadowHost) {
            this.shadowHost = DOMUtils.createElement('div', '', {});
            DOMUtils.setInlineStyles(this.shadowHost, {
                minHeight: '100%',
                display: 'block',
                width: '100%',
            });
            this.shadowRoot = this.shadowHost.attachShadow({ mode: 'open' });
        }

        if (!DOMUtils.isConnected(this.shadowHost)) {
            DOMUtils.append(this.panelElement, this.shadowHost);
        }
    }

    /**
     * Setup overlay click handler
     */
    setupOverlayClickHandler() {
        if (this.overlayElement) {
            DOMUtils.addEventListener(this.overlayElement, 'click', () => this.close());
        }
    }

    /**
     * Open resume drawer
     */
    open(triggerElement = null) {
        if (!this.element) return;

        this.triggerElement = triggerElement || null;
        this.focusReturnTarget = document.activeElement;

        const loadPromise = this.loadContent() || Promise.resolve();

        DOMUtils.setAttribute(this.element, Constants.ARIA.hidden, 'false');
        this.element.style.pointerEvents = 'auto';

        if (this.previousBodyOverflow === null) {
            this.previousBodyOverflow = document.body.style.overflow || '';
        }
        document.body.style.overflow = 'hidden';

        if (this.overlayElement) {
            this.overlayElement.style.pointerEvents = 'auto';
            this.overlayElement.style.opacity = '1';
        }

        this.panelElement.style.transform = 'translateX(0)';

        if (this.triggerElement && typeof this.triggerElement.setAttribute === 'function') {
            DOMUtils.setAttribute(this.triggerElement, Constants.ARIA.expanded, 'true');
        }

        loadPromise
            .catch(() => {})
            .then(() => {
                if (this.element.getAttribute(Constants.ARIA.hidden) === 'false') {
                    if (this.closeButton && typeof this.closeButton.focus === 'function') {
                        this.closeButton.focus();
                    } else if (this.panelElement && typeof this.panelElement.focus === 'function') {
                        this.panelElement.focus({ preventScroll: true });
                    }
                }
            });
    }

    /**
     * Close resume drawer
     */
    close() {
        if (!this.element || this.element.getAttribute(Constants.ARIA.hidden) === 'true') {
            return;
        }

        DOMUtils.setAttribute(this.element, Constants.ARIA.hidden, 'true');
        this.element.style.pointerEvents = 'none';

        if (this.overlayElement) {
            this.overlayElement.style.pointerEvents = 'none';
            this.overlayElement.style.opacity = '0';
        }

        this.panelElement.style.transform = 'translateX(100%)';

        if (this.panelElement) {
            this.panelElement.scrollTop = 0;
        }

        if (this.previousBodyOverflow !== null) {
            document.body.style.overflow = this.previousBodyOverflow;
            this.previousBodyOverflow = null;
        }

        if (this.triggerElement && typeof this.triggerElement.setAttribute === 'function') {
            DOMUtils.setAttribute(this.triggerElement, Constants.ARIA.expanded, 'false');
        }

        const focusTarget = this.triggerElement || this.focusReturnTarget;
        if (focusTarget && typeof focusTarget.focus === 'function') {
            focusTarget.focus();
        }

        this.triggerElement = null;
        this.focusReturnTarget = null;

        if (this.statusElement) {
            this.statusElement.style.display = 'none';
        }
    }

    /**
     * Load resume content asynchronously
     */
    loadContent() {
        if (this.contentLoaded || !this.panelElement) {
            return;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.showLoading();

        this.loadingPromise = fetch(Constants.RESUME_DRAWER_PATH, { cache: 'no-store' })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load resume (${response.status})`);
                }
                return response.text();
            })
            .then(text => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');

                // Load external styles into main document
                if (!this.externalStylesLoaded && doc.head) {
                    const documentHead = document.head || document.getElementsByTagName('head')[0];
                    DOMUtils.queryAll('link[rel="stylesheet"]', doc.head).forEach(linkNode => {
                        const href = DOMUtils.getAttribute(linkNode, 'href');
                        if (href && !DOMUtils.query(`link[rel="stylesheet"][href="${href}"]`, documentHead)) {
                            documentHead.appendChild(linkNode.cloneNode(true));
                        }
                    });
                    this.externalStylesLoaded = true;
                }

                if (this.statusElement) {
                    this.statusElement.style.display = 'none';
                }

                // Inject content into shadow DOM
                if (this.shadowRoot) {
                    this.shadowRoot.innerHTML = '';

                    if (doc.head) {
                        DOMUtils.queryAll('link[rel="stylesheet"]', doc.head).forEach(linkNode => {
                            this.shadowRoot.appendChild(linkNode.cloneNode(true));
                        });

                        DOMUtils.queryAll('style', doc.head).forEach(styleNode => {
                            this.shadowRoot.appendChild(styleNode.cloneNode(true));
                        });
                    }

                    if (doc.body) {
                        this.shadowRoot.appendChild(doc.body.cloneNode(true));
                    } else {
                        const wrapper = DOMUtils.createElement('div', '', { html: text });
                        this.shadowRoot.appendChild(wrapper);
                    }
                }

                if (this.panelElement) {
                    this.panelElement.scrollTop = 0;
                }

                this.contentLoaded = true;
            })
            .catch(error => {
                console.error('Failed to load resume:', error);
                if (this.shadowRoot) {
                    this.shadowRoot.innerHTML = '';
                }
                if (this.statusElement) {
                    this.statusElement.textContent = 'Unable to load resume right now.';
                    this.statusElement.style.display = 'block';
                }
            })
            .finally(() => {
                this.loadingPromise = null;
            });

        return this.loadingPromise;
    }

    /**
     * Show loading message
     */
    showLoading() {
        if (this.statusElement) {
            this.statusElement.textContent = 'Loading resume…';
            this.statusElement.style.display = 'block';
        }

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = '';
        }

        if (this.closeButton && !DOMUtils.isConnected(this.closeButton)) {
            DOMUtils.insertBefore(this.closeButton, this.panelElement.firstChild);
        }
    }

    /**
     * Handle keydown for escape key
     */
    handleKeydown(event) {
        if (event.key === 'Escape' && this.element && this.element.getAttribute(Constants.ARIA.hidden) === 'false') {
            this.close();
            event.preventDefault();
        }
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
        this.element = null;
        this.panelElement = null;
        this.overlayElement = null;
        this.closeButton = null;
        this.statusElement = null;
        this.shadowHost = null;
        this.shadowRoot = null;
    }
}
