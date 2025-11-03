/**
 * VideoPreloader Class
 * Encapsulates lazy video loading with IntersectionObserver
 * Manages video preloading based on viewport visibility
 */

class VideoPreloader {
    constructor() {
        this.marquee = null;
        this.videos = [];
        this.observer = null;
        this.isInitialized = false;
        this.cleanupTasks = [];
    }

    /**
     * Initialize video preloader for a marquee element
     */
    init(marqueeElement) {
        if (!marqueeElement) return false;

        if (marqueeElement.dataset.mediaPreloaderInitialized === 'true') {
            return true;
        }

        this.marquee = marqueeElement;
        this.videos = Array.from(marqueeElement.querySelectorAll('video[data-preview-src]'));

        if (!this.videos.length) {
            marqueeElement.dataset.mediaPreloaderInitialized = 'true';
            return true;
        }

        marqueeElement.dataset.mediaPreloaderInitialized = 'true';

        // Load eager videos
        const eagerCount = Math.max(this.getMaxEagerVideos(), 0);
        const eagerVideos = this.videos.slice(0, eagerCount);
        eagerVideos.forEach(video => this.loadVideo(video));

        // Setup observer for lazy videos
        const remainingVideos = this.videos.slice(eagerCount);
        if (remainingVideos.length > 0) {
            this.setupIntersectionObserver(remainingVideos);
        }

        // Setup warm-up handlers
        this.setupWarmupHandlers();

        this.isInitialized = true;
        return true;
    }

    /**
     * Get maximum eager videos to load immediately
     */
    getMaxEagerVideos() {
        if (State.projects.isMobileView) {
            return 0;
        }
        // Assuming shouldUseVideoPreviews() is available globally
        return typeof shouldUseVideoPreviews === 'function' && shouldUseVideoPreviews()
            ? Constants.MAX_EAGER_PROJECT_VIDEOS
            : 0;
    }

    /**
     * Setup IntersectionObserver for lazy-loading videos
     */
    setupIntersectionObserver(videos) {
        if (!('IntersectionObserver' in window)) {
            videos.forEach(video => this.loadVideo(video));
            return;
        }

        const observerOptions = State.projects.isMobileView
            ? Constants.VIDEO_PRELOADER_OPTIONS_MOBILE
            : {
                root: this.marquee.parentElement,
                ...Constants.VIDEO_PRELOADER_OPTIONS_DESKTOP,
            };

        this.observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadVideo(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        videos.forEach(video => this.observer.observe(video));

        // Cleanup task
        this.cleanupTasks.push(() => {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        });
    }

    /**
     * Load a single video element
     */
    loadVideo(video) {
        if (!video || video.dataset.previewLoaded === 'true') {
            return;
        }

        const src = video.dataset.previewSrc;
        if (!src) return;

        let source = video.querySelector('source');
        if (!source) {
            source = document.createElement('source');
            video.appendChild(source);
        }

        if (source.src !== src) {
            source.src = src;
        }

        const type = video.dataset.previewType;
        if (type) {
            source.type = type;
        }

        if (video.dataset.posterSrc && !video.poster) {
            video.poster = video.dataset.posterSrc;
        }

        delete video.dataset.deferLoad;
        video.dataset.previewLoaded = 'true';

        video.load();
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === 'function') {
            playPromise.catch(() => {});
        }
    }

    /**
     * Setup handlers to warm up all videos on user interaction
     */
    setupWarmupHandlers() {
        if (!this.marquee) return;

        const warmUpAllVideos = () => {
            this.videos.forEach(video => {
                this.loadVideo(video);
                if (this.observer) {
                    this.observer.unobserve(video);
                }
            });
        };

        DOMUtils.addEventListener(this.marquee, 'mouseenter', warmUpAllVideos, { once: true });
        DOMUtils.addEventListener(this.marquee, 'touchstart', warmUpAllVideos, { once: true });

        DOMUtils.addEventListener(this.marquee, 'focusin', event => {
            const target = event.target;
            if (target && target.tagName && target.tagName.toLowerCase() === 'video') {
                this.loadVideo(target);
            }
        });

        this.cleanupTasks.push(() => {
            // Event listeners are cleaned up via DOMUtils return value
        });
    }

    /**
     * Cleanup and destroy
     */
    cleanup() {
        this.cleanupTasks.forEach(task => {
            try {
                task();
            } catch (error) {
                console.warn('Video preloader cleanup error:', error);
            }
        });
        this.cleanupTasks = [];

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        this.marquee = null;
        this.videos = [];
        this.isInitialized = false;
    }

    /**
     * Destroy instance
     */
    destroy() {
        this.cleanup();
    }
}
