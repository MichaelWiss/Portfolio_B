/**
 * State Management Module
 * Centralizes all application state in organized containers
 * Replaces scattered global variables with predictable accessors
 */

const State = (() => {
    // Private state objects
    const state = {
        resumeDrawer: {
            initialized: false,
            contentLoaded: false,
            isOpen: false,
            element: null,
            panelElement: null,
            overlayElement: null,
            closeButton: null,
            statusElement: null,
            shadowHost: null,
            shadowRoot: null,
            externalStylesLoaded: false,
            loadingPromise: null,
            triggerElement: null,
            focusReturnTarget: null,
            previousBodyOverflow: null,
        },
        modal: {
            currentVideo: null,
            currentElements: null,
            currentResizeHandler: null,
        },
        projects: {
            currentData: [],
            isMobileView: false,
            mediaQuery: null,
            viewportChangeHandler: null,
            forceVideoPreviews: false,
            posterRenderCount: 0,
            preloadedPosters: new Set(),
        },
        marquee: {
            isInteractiveInitialized: false,
        },
        ui: {
            webmSupport: null,
            sparkleGradientCounter: 0,
            videoLookup: {},
        },
    };

    return {
        /**
         * Resume Drawer State
         */
        resumeDrawer: {
            get initialized() {
                return state.resumeDrawer.initialized;
            },
            set initialized(val) {
                state.resumeDrawer.initialized = val;
            },
            get contentLoaded() {
                return state.resumeDrawer.contentLoaded;
            },
            set contentLoaded(val) {
                state.resumeDrawer.contentLoaded = val;
            },
            get isOpen() {
                return state.resumeDrawer.isOpen;
            },
            set isOpen(val) {
                state.resumeDrawer.isOpen = val;
            },
            get element() {
                return state.resumeDrawer.element;
            },
            set element(val) {
                state.resumeDrawer.element = val;
            },
            get panelElement() {
                return state.resumeDrawer.panelElement;
            },
            set panelElement(val) {
                state.resumeDrawer.panelElement = val;
            },
            get overlayElement() {
                return state.resumeDrawer.overlayElement;
            },
            set overlayElement(val) {
                state.resumeDrawer.overlayElement = val;
            },
            get closeButton() {
                return state.resumeDrawer.closeButton;
            },
            set closeButton(val) {
                state.resumeDrawer.closeButton = val;
            },
            get statusElement() {
                return state.resumeDrawer.statusElement;
            },
            set statusElement(val) {
                state.resumeDrawer.statusElement = val;
            },
            get shadowHost() {
                return state.resumeDrawer.shadowHost;
            },
            set shadowHost(val) {
                state.resumeDrawer.shadowHost = val;
            },
            get shadowRoot() {
                return state.resumeDrawer.shadowRoot;
            },
            set shadowRoot(val) {
                state.resumeDrawer.shadowRoot = val;
            },
            get externalStylesLoaded() {
                return state.resumeDrawer.externalStylesLoaded;
            },
            set externalStylesLoaded(val) {
                state.resumeDrawer.externalStylesLoaded = val;
            },
            get loadingPromise() {
                return state.resumeDrawer.loadingPromise;
            },
            set loadingPromise(val) {
                state.resumeDrawer.loadingPromise = val;
            },
            get triggerElement() {
                return state.resumeDrawer.triggerElement;
            },
            set triggerElement(val) {
                state.resumeDrawer.triggerElement = val;
            },
            get focusReturnTarget() {
                return state.resumeDrawer.focusReturnTarget;
            },
            set focusReturnTarget(val) {
                state.resumeDrawer.focusReturnTarget = val;
            },
            get previousBodyOverflow() {
                return state.resumeDrawer.previousBodyOverflow;
            },
            set previousBodyOverflow(val) {
                state.resumeDrawer.previousBodyOverflow = val;
            },
            reset() {
                state.resumeDrawer = {
                    initialized: false,
                    contentLoaded: false,
                    isOpen: false,
                    element: null,
                    panelElement: null,
                    overlayElement: null,
                    closeButton: null,
                    statusElement: null,
                    shadowHost: null,
                    shadowRoot: null,
                    externalStylesLoaded: false,
                    loadingPromise: null,
                    triggerElement: null,
                    focusReturnTarget: null,
                    previousBodyOverflow: null,
                };
            },
        },

        /**
         * Modal State
         */
        modal: {
            get currentVideo() {
                return state.modal.currentVideo;
            },
            set currentVideo(val) {
                state.modal.currentVideo = val;
            },
            get currentElements() {
                return state.modal.currentElements;
            },
            set currentElements(val) {
                state.modal.currentElements = val;
            },
            get currentResizeHandler() {
                return state.modal.currentResizeHandler;
            },
            set currentResizeHandler(val) {
                state.modal.currentResizeHandler = val;
            },
            reset() {
                state.modal = {
                    currentVideo: null,
                    currentElements: null,
                    currentResizeHandler: null,
                };
            },
        },

        /**
         * Projects State
         */
        projects: {
            get currentData() {
                return state.projects.currentData;
            },
            set currentData(val) {
                state.projects.currentData = val;
            },
            get isMobileView() {
                return state.projects.isMobileView;
            },
            set isMobileView(val) {
                state.projects.isMobileView = val;
            },
            get mediaQuery() {
                return state.projects.mediaQuery;
            },
            set mediaQuery(val) {
                state.projects.mediaQuery = val;
            },
            get viewportChangeHandler() {
                return state.projects.viewportChangeHandler;
            },
            set viewportChangeHandler(val) {
                state.projects.viewportChangeHandler = val;
            },
            get forceVideoPreviews() {
                return state.projects.forceVideoPreviews;
            },
            set forceVideoPreviews(val) {
                state.projects.forceVideoPreviews = val;
            },
            get posterRenderCount() {
                return state.projects.posterRenderCount;
            },
            set posterRenderCount(val) {
                state.projects.posterRenderCount = val;
            },
            get preloadedPosters() {
                return state.projects.preloadedPosters;
            },
            reset() {
                state.projects = {
                    currentData: [],
                    isMobileView: false,
                    mediaQuery: null,
                    viewportChangeHandler: null,
                    forceVideoPreviews: false,
                    posterRenderCount: 0,
                    preloadedPosters: new Set(),
                };
            },
        },

        /**
         * Marquee State
         */
        marquee: {
            get isInteractiveInitialized() {
                return state.marquee.isInteractiveInitialized;
            },
            set isInteractiveInitialized(val) {
                state.marquee.isInteractiveInitialized = val;
            },
            reset() {
                state.marquee.isInteractiveInitialized = false;
            },
        },

        /**
         * UI State (constants and helpers)
         */
        ui: {
            get webmSupport() {
                return state.ui.webmSupport;
            },
            set webmSupport(val) {
                state.ui.webmSupport = val;
            },
            get sparkleGradientCounter() {
                return state.ui.sparkleGradientCounter;
            },
            set sparkleGradientCounter(val) {
                state.ui.sparkleGradientCounter = val;
            },
            incrementSparkleGradient() {
                return ++state.ui.sparkleGradientCounter;
            },
            get videoLookup() {
                return state.ui.videoLookup;
            },
            set videoLookup(val) {
                state.ui.videoLookup = val;
            },
            reset() {
                state.ui = {
                    webmSupport: null,
                    sparkleGradientCounter: 0,
                    videoLookup: {},
                };
            },
        },

        /**
         * Reset all state (useful for testing or page reload scenarios)
         */
        resetAll() {
            this.resumeDrawer.reset();
            this.modal.reset();
            this.projects.reset();
            this.marquee.reset();
            this.ui.reset();
        },
    };
})();
