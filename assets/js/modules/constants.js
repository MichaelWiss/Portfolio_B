/**
 * Constants Module
 * Centralizes configuration, selectors, and magic strings for Portfolio B.
 */

const Constants = (() => {
    const SVG_NS = 'http://www.w3.org/2000/svg';

    // Data & asset paths
    const CONTENT_PATH = 'assets/data/content.json';
    const RESUME_DRAWER_PATH = 'assets/resume/resume.html';

    // Media patterns
    const VIDEO_PREVIEW_PATTERN = /\.(webm|mp4|m4v|ogv)$/i;

    // Preload / eager limits
    const MAX_EAGER_PROJECT_VIDEOS = 1;
    const MAX_EAGER_POSTER_IMAGES = 6;

    // Timeouts & animation prefs
    const MEDIA_TIMEOUT_MS = 500;
    const PREFERS_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

    // Projects marquee keyframes
    const PROJECTS_MARQUEE_STYLE_ID = 'projects-marquee-keyframes';
    const PROJECTS_MARQUEE_ANIMATION_NAME = 'scroll-projects-marquee';

    // DOM element IDs
    const ELEMENTS = {
        hero: 'hero',
        navLogo: 'navLogo',
        navLinks: 'navLinks',
        nameMarquee: 'nameMarquee',
        projectsMarquee: 'projectsMarquee',
        thankYouMarquee: 'thankYouMarquee',
        journeyTitle: 'journeyTitle',
        accordionContainer: 'accordionContainer',
        panelsSection: 'panelsSection',
        menuContainer: 'menuContainer',
        modal: 'modal',
        modalTitle: 'modalTitle',
        videoContainer: 'videoContainer',
        closeModalBtn: 'closeModalBtn',
        resumeDrawer: 'resumeDrawer',
        portfolioContentData: 'portfolio-content-data',
    };

    // CSS class names
    const CLASSES = {
        gradientText: 'gradient-text',
        sparkle: 'sparkle',
        sparkleIcon: 'sparkle-icon',
        sparkleGradientStop: 'sparkle-gradient-stop',
        sparkleGradientStopStart: 'sparkle-gradient-stop--start',
        sparkleGradientStopEnd: 'sparkle-gradient-stop--end',

        grateCard: 'grate-card',
        grateLabel: 'grate-label',
        grateTitle: 'grate-title',
        grateMedia: 'grate-media',
        grateMediaPlaceholder: 'grate-media--placeholder',

        navLink: 'nav-link',

        accordionItem: 'accordion-item',
        accordionHeader: 'accordion-header',
        accordionContent: 'accordion-content',
        accordionActive: 'active',

        panel: 'panel',
        panelDark: 'panel--dark',

        menuItem: 'menu-item',
        detailPage: 'detail-page',
        detailContent: 'detail-content',
        closeBtn: 'close-btn',

        arrowIcon: 'arrow-icon',

        marqueeContainerGallery: 'marquee-container--gallery',
        projectsGallery: 'projects-gallery',
        marqueeDesktop: 'marquee--desktop',
        marqueeAnimated: 'marquee--animated',
        marqueePaused: 'marquee--paused',

        resumeDrawerPanel: 'resume-drawer__panel',
        resumeDrawerOverlay: 'resume-drawer__overlay',

        videoPlaceholder: 'video-placeholder',
    };

    // Data attributes (dataset keys, without `data-` prefix)
    const DATA_ATTRIBUTES = {
        modalType: 'modalType',
        modalTitle: 'modalTitle',
        page: 'page',
        closePage: 'closePage',
        resumeDrawer: 'resumeDrawer',
        previewSrc: 'previewSrc',
        previewType: 'previewType',
        posterSrc: 'posterSrc',
        deferLoad: 'deferLoad',
        mediaPreloaderInitialized: 'mediaPreloaderInitialized',
    };

    // ARIA / accessibility attribute names
    const ARIA = {
        hidden: 'aria-hidden',
        role: 'role',
        label: 'aria-label',
        controls: 'aria-controls',
        expanded: 'aria-expanded',
    };

    // Common media types
    const MIME_TYPES = {
        mp4: 'video/mp4',
        quicktime: 'video/quicktime',
        webm: 'video/webm',
        ogg: 'video/ogg',
    };

    const MARQUEES = {
        projects: {
            // 120000ms = 120s, matching legacy behavior
            duration: 120000,
        },
    };

    // IntersectionObserver options for video preloading
    const VIDEO_PRELOADER_OPTIONS_MOBILE = {
        root: null,
        rootMargin: '200px 0px',
        threshold: 0.1,
    };

    const VIDEO_PRELOADER_OPTIONS_DESKTOP = {
        root: null,
        rootMargin: '64px',
        threshold: 0.2,
    };

    // Sparkle SVG paths (used by HeroRenderer)
    const SPARKLE_PATHS = [
        'M22.625 2c0 15.834-8.557 30-20.625 30c12.068 0 20.625 14.167 20.625 30c0-15.833 8.557-30 20.625-30c-12.068 0-20.625-14.166-20.625-30',
        'M47 32c0 7.918-4.277 15-10.313 15C42.723 47 47 54.084 47 62c0-7.916 4.277-15 10.313-15C51.277 47 47 39.918 47 32z',
        'M51.688 2c0 7.917-4.277 15-10.313 15c6.035 0 10.313 7.084 10.313 15c0-7.916 4.277-15 10.313-15c-6.036 0-10.313-7.083-10.313-15',
    ];

    return {
        SVG_NS,
        CONTENT_PATH,
        RESUME_DRAWER_PATH,
        VIDEO_PREVIEW_PATTERN,
        MAX_EAGER_PROJECT_VIDEOS,
        MAX_EAGER_POSTER_IMAGES,
        MEDIA_TIMEOUT_MS,
        PREFERS_REDUCED_MOTION_QUERY,
        PROJECTS_MARQUEE_STYLE_ID,
        PROJECTS_MARQUEE_ANIMATION_NAME,
        ELEMENTS,
        CLASSES,
        DATA_ATTRIBUTES,
        ARIA,
        MIME_TYPES,
        MARQUEES,
        VIDEO_PRELOADER_OPTIONS_MOBILE,
        VIDEO_PRELOADER_OPTIONS_DESKTOP,
        SPARKLE_PATHS,
    };
})();