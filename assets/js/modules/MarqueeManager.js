/**
 * MarqueeManager Class
 * Controls marquee animations that still require JavaScript (projects marquee)
 * and configures CSS-driven marquees via custom properties.
 */

class MarqueeManager {
    constructor({ preloader } = {}) {
        this.preloader = preloader;
        this.projectsCleanup = null;
    }

    /**
     * Refresh static marquees (name and thank-you).
     *
     * Uses the existing seamless marquee helper (setupSeamlessMarquee)
     * from the legacy implementation to keep animations identical
     * while the rendering is driven by HeroRenderer and HTML.
     */
    refreshStaticMarquees() {
        if (typeof setupSeamlessMarquee !== 'function') {
            return;
        }

        const nameMarquee = DOMUtils.byId(Constants.ELEMENTS.nameMarquee);
        const thankYouMarquee = DOMUtils.byId(Constants.ELEMENTS.thankYouMarquee);

        if (nameMarquee) {
            setupSeamlessMarquee(nameMarquee);
        }
        if (thankYouMarquee) {
            setupSeamlessMarquee(thankYouMarquee);
        }
    }

    refreshProjectsMarquee({ duration } = {}) {
        const marquee = DOMUtils.byId(Constants.ELEMENTS.projectsMarquee);
        if (!marquee) {
            return;
        }

        this.teardownProjectsMarquee(marquee);

        if (State.projects.isMobileView || DOMUtils.hasClass(marquee, Constants.CLASSES.projectsGallery)) {
            return;
        }

        if (marquee.children.length < 2) {
            return;
        }

        const container = marquee.parentElement;
        if (!container) {
            return;
        }

        // Track active resources so we can unwind everything on teardown.
        const cleanupTasks = [];
        let pendingStart = null;
        let lastHalfWidth = null;
        let isAnimationActive = true;
        const animationDuration = typeof duration === 'number'
            ? duration
            : Constants.MARQUEES.projects.duration;

        const reduceMotionQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia(Constants.PREFERS_REDUCED_MOTION_QUERY)
            : null;

        const performCleanup = () => {
            isAnimationActive = false;
            pendingStart = null;

            while (cleanupTasks.length) {
                const task = cleanupTasks.shift();
                try {
                    task();
                } catch (error) {
                    console.warn('Projects marquee cleanup encountered an issue:', error);
                }
            }

            marquee.__projectsMarqueeCleanup = null;
            this.projectsCleanup = null;
        };

        marquee.__projectsMarqueeCleanup = performCleanup;
        this.projectsCleanup = performCleanup;

        try {
            // Use a double rAF so layout has settled before measuring scrollWidth.
            const scheduleMeasurement = () => new Promise(resolve => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(resolve);
                });
            });

            // Start/restart the marquee after media loads, respecting reduced-motion.
            const runAnimation = () => {
                if (!isAnimationActive) {
                    return Promise.resolve();
                }

                if (pendingStart) {
                    return pendingStart;
                }

                if (reduceMotionQuery && reduceMotionQuery.matches) {
                    DOMUtils.removeClass(marquee, Constants.CLASSES.marqueeAnimated, Constants.CLASSES.marqueePaused);
                    marquee.style.transform = '';
                    lastHalfWidth = null;
                    return Promise.resolve();
                }

                DOMUtils.removeClass(marquee, Constants.CLASSES.marqueeAnimated, Constants.CLASSES.marqueePaused);

                pendingStart = this.waitForMediaOrTimeout(marquee)
                    .then(scheduleMeasurement)
                    .then(() => {
                        if (!isAnimationActive) {
                            return;
                        }

                        const halfWidth = Math.round(marquee.scrollWidth / 2);
                        if (!halfWidth) {
                            return;
                        }

                        if (halfWidth !== lastHalfWidth) {
                            this.applyProjectsMarqueeStyles(halfWidth, animationDuration);
                            lastHalfWidth = halfWidth;
                        }

                        marquee.style.transform = `translate3d(-${halfWidth}px, 0, 0)`;
                        DOMUtils.addClass(marquee, Constants.CLASSES.marqueeAnimated);
                    })
                    .finally(() => {
                        pendingStart = null;
                    });

                return pendingStart;
            };

            const handleResize = () => {
                lastHalfWidth = null;
                runAnimation();
            };

            const handleMouseEnter = () => {
                if (!isAnimationActive) {
                    return;
                }
                DOMUtils.addClass(marquee, Constants.CLASSES.marqueePaused);
            };

            const handleMouseLeave = () => {
                DOMUtils.removeClass(marquee, Constants.CLASSES.marqueePaused);
            };

            runAnimation();

            if (typeof ResizeObserver !== 'undefined') {
                const resizeObserver = new ResizeObserver(handleResize);
                resizeObserver.observe(container);
                cleanupTasks.push(() => resizeObserver.disconnect());
            } else {
                window.addEventListener('resize', handleResize);
                cleanupTasks.push(() => window.removeEventListener('resize', handleResize));
            }

            container.addEventListener('mouseenter', handleMouseEnter);
            cleanupTasks.push(() => container.removeEventListener('mouseenter', handleMouseEnter));

            container.addEventListener('mouseleave', handleMouseLeave);
            cleanupTasks.push(() => container.removeEventListener('mouseleave', handleMouseLeave));

            if (reduceMotionQuery) {
                const handleMotionChange = () => {
                    if (reduceMotionQuery.matches) {
                        DOMUtils.removeClass(marquee, Constants.CLASSES.marqueeAnimated, Constants.CLASSES.marqueePaused);
                        marquee.style.transform = '';
                    } else {
                        lastHalfWidth = null;
                        if (this.preloader) {
                            this.preloader.init(marquee);
                        }
                        runAnimation();
                    }
                };

                if (typeof reduceMotionQuery.addEventListener === 'function') {
                    reduceMotionQuery.addEventListener('change', handleMotionChange);
                    cleanupTasks.push(() => {
                        if (typeof reduceMotionQuery.removeEventListener === 'function') {
                            reduceMotionQuery.removeEventListener('change', handleMotionChange);
                        }
                    });
                } else if (typeof reduceMotionQuery.addListener === 'function') {
                    reduceMotionQuery.addListener(handleMotionChange);
                    cleanupTasks.push(() => {
                        if (typeof reduceMotionQuery.removeListener === 'function') {
                            reduceMotionQuery.removeListener(handleMotionChange);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Projects marquee initialization failed:', error);
            performCleanup();
        }
    }

    teardownProjectsMarquee(marquee = DOMUtils.byId(Constants.ELEMENTS.projectsMarquee)) {
        if (!marquee) {
            return;
        }

        const existingCleanup = marquee.__projectsMarqueeCleanup;
        if (typeof existingCleanup === 'function') {
            try {
                existingCleanup();
            } catch (error) {
                console.warn('Projects marquee cleanup error:', error);
            }
        }

        marquee.__projectsMarqueeCleanup = null;
        this.projectsCleanup = null;

        DOMUtils.removeClass(marquee, Constants.CLASSES.marqueeAnimated, Constants.CLASSES.marqueePaused);
        marquee.style.transform = '';
    }

    destroy() {
        this.teardownProjectsMarquee();
    }

    applyProjectsMarqueeStyles(halfWidth, durationMs) {
        const head = document.head || document.querySelector('head');
        if (!head) {
            return;
        }

        let styleElement = DOMUtils.byId(Constants.PROJECTS_MARQUEE_STYLE_ID);
        if (!styleElement) {
            styleElement = DOMUtils.createElement('style');
            DOMUtils.setAttribute(styleElement, 'id', Constants.PROJECTS_MARQUEE_STYLE_ID);
            head.appendChild(styleElement);
        }

        const durationSeconds = Math.max(durationMs / 1000, 0.001);
        const formattedDuration = Number.isFinite(durationSeconds)
            ? durationSeconds.toFixed(3).replace(/\.?0+$/, '')
            : '120';

        const styleContent = `
@keyframes ${Constants.PROJECTS_MARQUEE_ANIMATION_NAME} {
    from { transform: translate3d(-${halfWidth}px, 0, 0); }
    to { transform: translate3d(0, 0, 0); }
}

#${Constants.ELEMENTS.projectsMarquee}.${Constants.CLASSES.marqueeAnimated} {
    animation: ${Constants.PROJECTS_MARQUEE_ANIMATION_NAME} ${formattedDuration}s linear infinite;
}

#${Constants.ELEMENTS.projectsMarquee}.${Constants.CLASSES.marqueeAnimated}.${Constants.CLASSES.marqueePaused} {
    animation-play-state: paused;
}
`.trim();

        if (styleElement.textContent !== styleContent) {
            styleElement.textContent = styleContent;
        }
    }

    waitForMediaOrTimeout(root, timeoutMs = Constants.MEDIA_TIMEOUT_MS) {
        if (!root) {
            return Promise.resolve();
        }

        const mediaElements = Array.from(root.querySelectorAll('img, video'));
        if (!mediaElements.length) {
            return Promise.resolve();
        }

        // Resolve once each media element is ready or a timeout occurs; keeps measurements stable.
        const mediaPromises = mediaElements.map(element => {
            const tagName = (element.tagName || '').toLowerCase();

            if (tagName === 'img') {
                if (element.loading === 'lazy' && !element.complete) {
                    return Promise.resolve();
                }

                if (element.complete && element.naturalWidth > 0) {
                    return Promise.resolve();
                }

                if (typeof element.decode === 'function') {
                    return element.decode().catch(() => {});
                }

                return new Promise(resolve => {
                    const finalize = () => {
                        element.removeEventListener('load', finalize);
                        element.removeEventListener('error', finalize);
                        resolve();
                    };

                    element.addEventListener('load', finalize, { once: true });
                    element.addEventListener('error', finalize, { once: true });
                });
            }

            if (tagName === 'video') {
                if (element.dataset && element.dataset.deferLoad === 'true') {
                    return Promise.resolve();
                }

                if (element.readyState >= 1) {
                    return Promise.resolve();
                }

                return new Promise(resolve => {
                    const finalize = () => {
                        element.removeEventListener('loadedmetadata', finalize);
                        element.removeEventListener('loadeddata', finalize);
                        element.removeEventListener('error', finalize);
                        resolve();
                    };

                    element.addEventListener('loadedmetadata', finalize, { once: true });
                    element.addEventListener('loadeddata', finalize, { once: true });
                    element.addEventListener('error', finalize, { once: true });
                });
            }

            return Promise.resolve();
        });

        const timeoutPromise = new Promise(resolve => {
            setTimeout(resolve, timeoutMs);
        });

        return Promise.race([
            Promise.all(mediaPromises).catch(() => {}),
            timeoutPromise,
        ]);
    }

}
