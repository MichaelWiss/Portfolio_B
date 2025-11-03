/**
 * ModalManager Class
 * Encapsulates modal window functionality: opening, closing, sizing, and video handling
 * Manages all modal state internally and handles event cleanup
 */

class ModalManager {
    constructor() {
        this.modal = null;
        this.modalTitle = null;
        this.videoContainer = null;
        this.modalContent = null;
        this.modalBody = null;
        this.modalHeader = null;
        this.currentVideo = null;
        this.currentResizeHandler = null;
    }

    /**
     * Initialize modal elements from DOM
     */
    init() {
        this.modal = DOMUtils.byId(Constants.ELEMENTS.modal);
        this.modalTitle = DOMUtils.byId(Constants.ELEMENTS.modalTitle);
        this.videoContainer = DOMUtils.byId(Constants.ELEMENTS.videoContainer);
        this.modalContent = this.modal ? DOMUtils.query('.modal-content', this.modal) : null;
        this.modalBody = this.modal ? DOMUtils.query('.modal-body', this.modal) : null;
        this.modalHeader = this.modal ? DOMUtils.query('.modal-header', this.modal) : null;

        return this.isValid();
    }

    /**
     * Check if all required elements are available
     */
    isValid() {
        return !!(this.modal && this.modalTitle && this.videoContainer && this.modalContent && this.modalBody);
    }

    /**
     * Open modal with project title and video type
     */
    open(title, videoType) {
        if (!this.isValid()) {
            console.error('Modal elements not found');
            return;
        }

        // Clean up existing video
        this.cleanup();

        // Set title
        this.modalTitle.textContent = title || 'Project';

        // Clear container
        DOMUtils.clearChildren(this.videoContainer);

        // Get video path from lookup
        const videoPath = State.ui.videoLookup[videoType];

        if (!videoPath) {
            this.showPlaceholder('Project video coming soon.');
        } else {
            this.loadVideo(videoPath);
        }

        // Show modal
        DOMUtils.addClass(this.modal, 'active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close modal
     */
    close() {
        if (this.currentVideo) {
            this.currentVideo.pause();
            this.currentVideo = null;
        }

        if (this.currentResizeHandler) {
            window.removeEventListener('resize', this.currentResizeHandler);
            this.currentResizeHandler = null;
        }

        this.resetSizing();

        if (this.modal) {
            DOMUtils.removeClass(this.modal, 'active');
        }

        document.body.style.overflow = 'auto';

        // Reset placeholder after animation
        setTimeout(() => {
            if (this.videoContainer) {
                this.showPlaceholder('Project video will appear here.');
            }
        }, Constants.MODAL_CLOSE_DELAY);
    }

    /**
     * Load and play video
     */
    loadVideo(videoPath) {
        const video = DOMUtils.createElement('video', '', {
            controls: '',
            autoplay: '',
            playsinline: '',
        });

        const mp4Source = DOMUtils.createElement('source', '', {
            src: videoPath,
            type: Constants.MIME_TYPES.mp4,
        });

        const movSource = DOMUtils.createElement('source', '', {
            src: videoPath,
            type: Constants.MIME_TYPES.quicktime,
        });

        DOMUtils.append(video, mp4Source);
        DOMUtils.append(video, movSource);
        DOMUtils.append(this.videoContainer, video);
        this.currentVideo = video;

        // Handle metadata loaded
        const handleMetadata = () => {
            requestAnimationFrame(() => {
                if (!this.currentVideo) return;
                this.sizeToVideo(video);
                this.setupResizeHandler(video);
            });
        };

        const metadataHandler = () => {
            handleMetadata();
            video.removeEventListener('loadedmetadata', metadataHandler);
        };

        if (video.readyState >= 1) {
            handleMetadata();
        } else {
            video.addEventListener('loadedmetadata', metadataHandler);
        }

        // Handle error
        video.addEventListener('error', () => {
            this.handleVideoError();
        }, { once: true });
    }

    /**
     * Size modal content to video dimensions
     */
    sizeToVideo(video) {
        const mediaWidth = video.videoWidth || video.clientWidth || 0;
        const mediaHeight = video.videoHeight || video.clientHeight || 0;

        if (!mediaWidth || !mediaHeight) return;

        const contentStyles = this.modalContent ? window.getComputedStyle(this.modalContent) : null;
        const bodyStyles = this.modalBody ? window.getComputedStyle(this.modalBody) : null;

        const borderHorizontal = contentStyles
            ? DOMUtils.parsePixels(contentStyles.borderLeftWidth) + DOMUtils.parsePixels(contentStyles.borderRightWidth)
            : 0;
        const borderVertical = contentStyles
            ? DOMUtils.parsePixels(contentStyles.borderTopWidth) + DOMUtils.parsePixels(contentStyles.borderBottomWidth)
            : 0;

        const bodyPaddingHorizontal = bodyStyles
            ? DOMUtils.parsePixels(bodyStyles.paddingLeft) + DOMUtils.parsePixels(bodyStyles.paddingRight)
            : 0;
        const bodyPaddingVertical = bodyStyles
            ? DOMUtils.parsePixels(bodyStyles.paddingTop) + DOMUtils.parsePixels(bodyStyles.paddingBottom)
            : 0;

        const headerHeight = this.modalHeader ? this.modalHeader.offsetHeight : 0;

        const maxWidth = Math.max((window.innerWidth * 0.9) - borderHorizontal - bodyPaddingHorizontal, 1);
        const maxHeight = Math.max((window.innerHeight * 0.9) - borderVertical - bodyPaddingVertical - headerHeight, 1);

        const { width, height } = this.fitWithinBounds(mediaWidth, mediaHeight, maxWidth, maxHeight);

        if (this.videoContainer) {
            DOMUtils.setInlineStyles(this.videoContainer, {
                width: `${width}px`,
                height: `${height}px`,
                padding: '0',
                background: 'transparent',
                minWidth: '0',
                minHeight: '0',
            });
        }

        DOMUtils.setInlineStyles(video, {
            width: `${width}px`,
            height: `${height}px`,
        });

        if (this.modalContent) {
            DOMUtils.setInlineStyles(this.modalContent, {
                width: `${width + bodyPaddingHorizontal + borderHorizontal}px`,
                height: `${height + bodyPaddingVertical + headerHeight + borderVertical}px`,
            });
        }
    }

    /**
     * Fit dimensions within bounds maintaining aspect ratio
     */
    fitWithinBounds(width, height, maxWidth, maxHeight) {
        let resultWidth = width || 0;
        let resultHeight = height || 0;

        if (!resultWidth || !resultHeight) {
            return { width: 0, height: 0 };
        }

        const widthScale = maxWidth > 0 ? maxWidth / resultWidth : 1;
        const heightScale = maxHeight > 0 ? maxHeight / resultHeight : 1;
        const scale = Math.min(widthScale, heightScale, 1);

        if (scale < 1) {
            resultWidth *= scale;
            resultHeight *= scale;
        }

        return {
            width: Math.max(resultWidth, 1),
            height: Math.max(resultHeight, 1),
        };
    }

    /**
     * Setup resize handler to re-size modal on window resize
     */
    setupResizeHandler(video) {
        if (this.currentResizeHandler) {
            window.removeEventListener('resize', this.currentResizeHandler);
        }

        this.currentResizeHandler = () => this.sizeToVideo(video);
        window.addEventListener('resize', this.currentResizeHandler);
    }

    /**
     * Reset modal sizing styles
     */
    resetSizing() {
        if (this.modalContent) {
            this.modalContent.style.width = '';
            this.modalContent.style.height = '';
        }

        if (this.videoContainer) {
            DOMUtils.setInlineStyles(this.videoContainer, {
                width: '',
                height: '',
                padding: '',
                background: '',
                minWidth: '',
                minHeight: '',
            });
        }
    }

    /**
     * Show placeholder message in video container
     */
    showPlaceholder(message) {
        DOMUtils.clearChildren(this.videoContainer);
        const placeholder = DOMUtils.createElement('div', Constants.CLASSES.videoPlaceholder, {
            text: message,
        });
        DOMUtils.append(this.videoContainer, placeholder);
    }

    /**
     * Handle video playback error
     */
    handleVideoError() {
        if (this.currentResizeHandler) {
            window.removeEventListener('resize', this.currentResizeHandler);
            this.currentResizeHandler = null;
        }

        this.resetSizing();
        this.showPlaceholder('Unable to play this video.');
        this.currentVideo = null;
    }

    /**
     * Cleanup all event listeners and references
     */
    cleanup() {
        if (this.currentVideo) {
            this.currentVideo.pause();
            this.currentVideo = null;
        }

        if (this.currentResizeHandler) {
            window.removeEventListener('resize', this.currentResizeHandler);
            this.currentResizeHandler = null;
        }

        this.resetSizing();
    }

    /**
     * Destroy manager instance
     */
    destroy() {
        this.cleanup();
        this.modal = null;
        this.modalTitle = null;
        this.videoContainer = null;
        this.modalContent = null;
        this.modalBody = null;
        this.modalHeader = null;
    }
}
