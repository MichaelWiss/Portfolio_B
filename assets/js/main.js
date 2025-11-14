// Portfolio B - Dynamic Content Initialization

const CONTENT_PATH = 'assets/data/content.json';
const SVG_NS = 'http://www.w3.org/2000/svg';
const SPARKLE_PATHS = [
    'M22.625 2c0 15.834-8.557 30-20.625 30c12.068 0 20.625 14.167 20.625 30c0-15.833 8.557-30 20.625-30c-12.068 0-20.625-14.166-20.625-30',
    'M47 32c0 7.918-4.277 15-10.313 15C42.723 47 47 54.084 47 62c0-7.916 4.277-15 10.313-15C51.277 47 47 39.918 47 32z',
    'M51.688 2c0 7.917-4.277 15-10.313 15c6.035 0 10.313 7.084 10.313 15c0-7.916 4.277-15 10.313-15c-6.036 0-10.313-7.083-10.313-15',
];
const VIDEO_PREVIEW_PATTERN = /\.(webm|mp4|m4v|ogv)$/i;
const MAX_EAGER_PROJECT_VIDEOS = 1;
const MAX_EAGER_POSTER_IMAGES = 6;
const PROJECTS_MOBILE_MEDIA_QUERY = '(max-width: 768px)';
const RESUME_DRAWER_PATH = 'assets/resume/resume.html';
const SEAMLESS_MARQUEE_REVERSE_CLASS = 'seamless-marquee--reverse';
const STATIC_MARQUEE_REGISTRY = new Map();
let projectsMediaQuery = null;
let isProjectsMobileView = false;
let currentProjectsData = [];
let forceProjectVideoPreviews = false;
let projectsViewportChangeHandler = null;
let supportsProjectsWebM = null;
let sparkleGradientCounter = 0;
let projectPosterRenderCount = 0;
const preloadedPosterSet = new Set();
let isInteractiveInitialized = false;
let resumeDrawerInitialized = false;
let resumeDrawerElement = null;
let resumeDrawerPanelElement = null;
let resumeDrawerFocusReturn = null;
let resumeDrawerOverlayElement = null;
let resumeDrawerTriggerElement = null;
let resumeDrawerCloseButton = null;
let resumeDrawerContentLoaded = false;
let resumeDrawerLoadingPromise = null;
let resumeDrawerPreviousBodyOverflow = null;
let resumeDrawerStatusElement = null;
let resumeDrawerShadowHost = null;
let resumeDrawerShadowRoot = null;
let resumeDrawerExternalStylesLoaded = false;
let resumeDrawerDocumentHTML = '';

let videoLookup = {};
let currentVideo = null;
let currentModalResizeHandler = null;
let currentModalElements = null;

// Module instances (initialized on DOMContentLoaded)
let modalManagerInstance = null;
let resumeDrawerInstance = null;
let videoPreloaderInstance = null;
let marqueeManagerInstance = null;
let eventDelegatorInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize responsive projects viewport mode and sync with State.
    initProjectsViewportMode();

    // Initialize module instances once the DOM is ready.
    modalManagerInstance = new ModalManager();
    resumeDrawerInstance = new ResumeDrawer();
    videoPreloaderInstance = new VideoPreloader();
    marqueeManagerInstance = new MarqueeManager({ preloader: videoPreloaderInstance });
    eventDelegatorInstance = new EventDelegator({ modalManager: modalManagerInstance });

    // Wire modal and resume drawer to DOM structure.
    modalManagerInstance.init();
    resumeDrawerInstance.init();

    try {
        const data = await ContentLoader.loadData();

        ContentRenderer.applyContent(data, {
            preloader: videoPreloaderInstance,
            marqueeManager: marqueeManagerInstance,
        });

        initializeInteractiveComponents(
            modalManagerInstance,
            resumeDrawerInstance,
            eventDelegatorInstance,
        );
    } catch (error) {
        console.error('App initialization error:', error);
        ContentRenderer.displayContentError(error);
    }
});

function initializeInteractiveComponents(modalManager, resumeDrawer, eventDelegator) {
    const alreadyInitialized = (typeof State !== 'undefined' && State.marquee)
        ? State.marquee.isInteractiveInitialized
        : isInteractiveInitialized;

    if (!alreadyInitialized) {
        // Use EventDelegator for click/keyboard handling.
        if (eventDelegator && typeof eventDelegator.init === 'function') {
            eventDelegator.init();
        }

        // Navigation behavior (sticky nav + smooth scroll) remains in this file.
        initNavigation(resumeDrawer);

        // Hook resume drawer Escape key handling via the module when available.
        if (resumeDrawer && !resumeDrawer.keydownHandler && typeof resumeDrawer.handleKeydown === 'function') {
            resumeDrawer.keydownHandler = event => resumeDrawer.handleKeydown(event);
            document.addEventListener('keydown', resumeDrawer.keydownHandler);
        }
    }

    // Marquee animations are handled via MarqueeManager inside ContentRenderer
    // and by viewport change hooks.

    if (typeof State !== 'undefined' && State.marquee) {
        State.marquee.isInteractiveInitialized = true;
    }
    isInteractiveInitialized = true;
}

async function loadContentData() {
    const isFileProtocol = typeof window !== 'undefined'
        && window.location
        && window.location.protocol === 'file:';

    if (isFileProtocol) {
        const fallback = await loadContentFallback();
        if (fallback) {
            return fallback;
        }

        throw new Error('Inline content data is unavailable while running via file:// protocol.');
    }

    try {
        return await fetchJson(CONTENT_PATH);
    } catch (primaryError) {
        console.warn('Primary content fetch failed, attempting fallbacks:', primaryError);

        const fallback = await loadContentFallback();
        if (fallback) {
            return fallback;
        }

        throw primaryError;
    }
}

async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
        throw new Error(`Failed to load content data (${response.status})`);
    }

    return response.json();
}

async function loadContentFallback() {
    const inlineData = readInlineContentData();
    if (inlineData) {
        verifyInlineContentSync(inlineData);
        return inlineData;
    }

    if (window.location.protocol === 'file:') {
        try {
            return await loadContentViaXHR();
        } catch (xhrError) {
            console.warn('XHR fallback failed:', xhrError);
        }
    }

    return null;
}

function readInlineContentData() {
    try {
        const inline = document.getElementById('portfolio-content-data');
        if (inline && inline.textContent) {
            return JSON.parse(inline.textContent);
        }
    } catch (error) {
        console.warn('Inline content data parse failed:', error);
    }
    return null;
}

function loadContentViaXHR() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.overrideMimeType('application/json');
        xhr.open('GET', CONTENT_PATH, true);

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (parseError) {
                        reject(parseError);
                    }
                } else {
                    reject(new Error(`XHR request failed with status ${xhr.status}`));
                }
            }
        };

        xhr.onerror = () => reject(new Error('XHR request experienced a network error'));
        xhr.send(null);
    });
}

function verifyInlineContentSync(inlineData) {
    if (!inlineData || window.location.protocol !== 'file:') {
        return;
    }

    (async () => {
        try {
            const externalData = await loadContentViaXHR();
            if (externalData && !contentPayloadsMatch(inlineData, externalData)) {
                console.warn(
                    'Inline portfolio JSON differs from assets/data/content.json. ' +
                    'Update demo1.html to keep both sources in sync.'
                );
            }
        } catch (error) {
            console.warn('Content sync check skipped (unable to read assets/data/content.json):', error);
        }
    })();
}

function contentPayloadsMatch(a, b) {
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch {
        return false;
    }
}

function canPlayProjectWebM() {
    if (supportsProjectsWebM !== null) {
        return supportsProjectsWebM;
    }

    if (typeof document === 'undefined') {
        supportsProjectsWebM = true;
        return supportsProjectsWebM;
    }

    try {
        const testVideo = document.createElement('video');
        if (!testVideo || typeof testVideo.canPlayType !== 'function') {
            supportsProjectsWebM = false;
            return supportsProjectsWebM;
        }

        const result = testVideo.canPlayType('video/webm; codecs="vp8, vorbis"')
            || testVideo.canPlayType('video/webm; codecs="vp9"')
            || testVideo.canPlayType('video/webm');

        supportsProjectsWebM = typeof result === 'string' && result.trim() !== '';
    } catch {
        supportsProjectsWebM = false;
    }

    return supportsProjectsWebM;
}

function getMaxEagerProjectVideos() {
    if (isProjectsMobileView) {
        return 0;
    }

    return shouldUseVideoPreviews() ? MAX_EAGER_PROJECT_VIDEOS : 0;
}

function initProjectsViewportMode() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        isProjectsMobileView = false;
        if (typeof State !== 'undefined' && State.projects) {
            State.projects.isMobileView = false;
        }
        return;
    }

    if ((projectsMediaQuery && projectsViewportChangeHandler)
        || (typeof State !== 'undefined'
            && State.projects
            && State.projects.mediaQuery
            && State.projects.viewportChangeHandler)) {
        return;
    }

    const mediaQuery = window.matchMedia(PROJECTS_MOBILE_MEDIA_QUERY);
    const matches = mediaQuery.matches;

    projectsMediaQuery = mediaQuery;
    isProjectsMobileView = matches;

    if (typeof State !== 'undefined' && State.projects) {
        State.projects.mediaQuery = mediaQuery;
        State.projects.isMobileView = matches;
    }

    const handler = event => {
        if (!event) {
            return;
        }
        handleProjectsViewportChange(event.matches);
    };

    projectsViewportChangeHandler = handler;
    if (typeof State !== 'undefined' && State.projects) {
        State.projects.viewportChangeHandler = handler;
    }

    if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handler);
    } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(handler);
    }
}

function handleProjectsViewportChange(nextIsMobile) {
    if (typeof nextIsMobile !== 'boolean') {
        const mq = (typeof State !== 'undefined' && State.projects && State.projects.mediaQuery)
            || projectsMediaQuery;
        nextIsMobile = mq ? mq.matches : false;
    }

    const previous = (typeof State !== 'undefined' && State.projects)
        ? State.projects.isMobileView
        : isProjectsMobileView;

    if (nextIsMobile === previous) {
        return;
    }

    isProjectsMobileView = nextIsMobile;
    if (typeof State !== 'undefined' && State.projects) {
        State.projects.isMobileView = nextIsMobile;
    }

    const marquee = document.getElementById('projectsMarquee');
    if (!marquee) {
        return;
    }

    const projects = (typeof State !== 'undefined'
        && State.projects
        && Array.isArray(State.projects.currentData))
        ? State.projects.currentData
        : (currentProjectsData || []);

    // Re-render projects via ProjectsRenderer.
    if (typeof ProjectsRenderer !== 'undefined'
        && ProjectsRenderer
        && typeof ProjectsRenderer.render === 'function') {
        ProjectsRenderer.render(projects, {
            preloader: videoPreloaderInstance || null,
            teardownMarquee: marqueeManagerInstance
                && typeof marqueeManagerInstance.teardownProjectsMarquee === 'function'
                ? marqueeManagerInstance.teardownProjectsMarquee.bind(marqueeManagerInstance)
                : undefined,
        });
    }

    // Refresh marquee animation using MarqueeManager.
    if (marqueeManagerInstance && typeof marqueeManagerInstance.refreshProjectsMarquee === 'function') {
        marqueeManagerInstance.refreshProjectsMarquee();
    }
}

function applyContent(data) {
    if (!data) {
        return;
    }

    const {
        site = {},
        navigation = {},
        projects = [],
        journey = {},
        panels = [],
        menu = [],
    } = data;

    renderDocumentMeta(site);
    renderNavigation(navigation, site);
    renderBlueMarquee(site);
    renderProjects(projects);
    renderJourney(journey);
    renderPanels(panels);
    renderMenu(menu);
    buildVideoLookup(projects);
    initHeroAnimation(site.heroText || site.title || '', site.heroSparkleWords || []);
}

function renderDocumentMeta(site) {
    if (site.title) {
        document.title = site.title;
    }
}

function renderNavigation(navigation, site) {
    const navLogo = document.getElementById('navLogo');
    const navLinks = document.getElementById('navLinks');

    if (navLogo) {
        navLogo.textContent = navigation.logo || site.title || document.title || '';
    }

    if (!navLinks) {
        return;
    }

    navLinks.innerHTML = '';

    (navigation.links || []).forEach(link => {
        if (!link || !link.text) {
            return;
        }

        const anchor = document.createElement('a');
        anchor.className = 'nav-link';
        anchor.href = link.href || '#';
        anchor.textContent = link.text;
        if ((link.href && link.href.toLowerCase() === '#resume') || normalizeWord(link.text) === 'resume') {
            anchor.dataset.resumeDrawer = 'true';
            anchor.setAttribute('role', 'button');
            anchor.setAttribute('aria-expanded', 'false');
            anchor.setAttribute('aria-controls', 'resumeDrawer');
        }
        navLinks.appendChild(anchor);
    });
}

function renderBlueMarquee(site) {
    const marquee = document.getElementById('nameMarquee');

    if (!marquee) {
        return;
    }

    marquee.classList.add('seamless-marquee');
    teardownSeamlessMarquee(marquee);
    marquee.innerHTML = '';

    const label = (site.title || 'Michael Wiss').toUpperCase();
    const repeated = `${Array(8).fill(label).join(' • ')} • `;

    const track = document.createElement('div');
    track.className = 'seamless-marquee__track';
    track.dataset.marqueeTrack = '';

    const createGroup = (isClone = false) => {
        const group = document.createElement('div');
        group.className = 'seamless-marquee__group';
        if (isClone) {
            group.setAttribute('aria-hidden', 'true');
        } else {
            group.dataset.marqueeGroup = '';
        }

        const textBlock = document.createElement('span');
        textBlock.className = 'blue-marquee-text seamless-marquee__item';
        textBlock.textContent = repeated;
        group.appendChild(textBlock);
        return group;
    };

    track.appendChild(createGroup(false));
    track.appendChild(createGroup(true));
    marquee.appendChild(track);

    setupSeamlessMarquee(marquee);
}

function setupSeamlessMarquee(container) {
    if (!container) {
        return;
    }

    const existing = STATIC_MARQUEE_REGISTRY.get(container);
    if (existing && typeof existing.update === 'function') {
        existing.update();
        return;
    }

    const track = container.querySelector('[data-marquee-track]');
    const group = track ? track.querySelector('[data-marquee-group]') : null;

    if (!track || !group) {
        return;
    }

    const animationName = container.classList.contains(SEAMLESS_MARQUEE_REVERSE_CLASS)
        ? 'marquee-scroll-reverse'
        : 'marquee-scroll-forward';
    const animationValue = `${animationName} var(--marquee-speed, 45s) linear infinite`;
    let rafId = null;
    let lastDistance = null;
    let isAnimationApplied = false;

    const restartAnimation = () => {
        track.style.animation = 'none';
        // Force reflow so the browser applies the new distance immediately
        void track.offsetWidth;
        track.style.animation = animationValue;
        isAnimationApplied = true;
    };

    const scheduleUpdate = () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
            const rect = group.getBoundingClientRect();
            const width = rect.width || group.scrollWidth || 0;

            if (!width) {
                track.style.animation = 'none';
                track.style.setProperty('--loop-distance', '0px');
                lastDistance = null;
                isAnimationApplied = false;
                return;
            }

            const nextDistance = `${Math.ceil(width)}px`;

            if (nextDistance !== lastDistance || !isAnimationApplied) {
                track.style.setProperty('--loop-distance', nextDistance);
                lastDistance = nextDistance;
                restartAnimation();
            }
        });
    };

    const cleanups = [];

    if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(() => scheduleUpdate());
        resizeObserver.observe(group);
        cleanups.push(() => resizeObserver.disconnect());
    }

    const handleWindowResize = () => scheduleUpdate();
    window.addEventListener('resize', handleWindowResize);
    cleanups.push(() => window.removeEventListener('resize', handleWindowResize));

    if (document.fonts) {
        if (typeof document.fonts.addEventListener === 'function') {
            const handleFontLoading = () => scheduleUpdate();
            document.fonts.addEventListener('loadingdone', handleFontLoading);
            cleanups.push(() => {
                if (typeof document.fonts.removeEventListener === 'function') {
                    document.fonts.removeEventListener('loadingdone', handleFontLoading);
                }
            });
        } else if (document.fonts.ready && typeof document.fonts.ready.then === 'function') {
            document.fonts.ready.then(() => scheduleUpdate()).catch(() => {});
        }
    }

    cleanups.push(() => {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    });

    const cleanup = () => {
        cleanups.forEach(fn => {
            try {
                fn();
            } catch (error) {
                console.warn('Marquee cleanup encountered an issue:', error);
            }
        });
        track.style.animation = 'none';
        track.style.removeProperty('--loop-distance');
        lastDistance = null;
        isAnimationApplied = false;
    };

    STATIC_MARQUEE_REGISTRY.set(container, { cleanup, update: scheduleUpdate });
    scheduleUpdate();
}

function teardownSeamlessMarquee(container) {
    const entry = STATIC_MARQUEE_REGISTRY.get(container);
    if (!entry) {
        return;
    }

    try {
        entry.cleanup();
    } finally {
        STATIC_MARQUEE_REGISTRY.delete(container);
    }
}

function initHeroAnimation(heroText, sparkleWords = []) {
    const heroEl = document.getElementById('hero');

    if (!heroEl) {
        console.warn('Hero element not found');
        return;
    }

    heroEl.innerHTML = '';

    if (!heroText) {
        heroEl.textContent = 'Content coming soon.';
        return;
    }

    const sparkleSet = new Set(
        sparkleWords
            .filter(Boolean)
            .map(normalizeWord)
    );

    heroText.split(/\s+/).forEach((word, index) => {
        if (!word) {
            return;
        }

        const normalized = normalizeWord(word);
        const animationDelay = `${index * 0.05}s`;

        if (sparkleSet.has(normalized)) {
            for (let i = 0; i < 3; i += 1) {
                const sparkle = document.createElement('span');
                sparkle.className = 'sparkle';
                sparkle.setAttribute('aria-hidden', 'true');
                sparkle.style.animationDelay = animationDelay;
                sparkle.appendChild(createSparkleIcon(animationDelay));
                heroEl.appendChild(sparkle);
            }
        }

        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        wordSpan.style.animationDelay = animationDelay;
        wordSpan.textContent = word;

        heroEl.appendChild(wordSpan);
        heroEl.appendChild(document.createTextNode(' '));
    });
}

function normalizeWord(word = '') {
    return word.replace(/[^\w]/g, '').toLowerCase();
}

function createSparkleIcon(animationDelay = '0s') {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.classList.add('sparkle-icon');
    svg.setAttribute('viewBox', '0 0 64 64');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.setProperty('--sparkle-offset', animationDelay);

    const gradientId = `sparkle-gradient-${sparkleGradientCounter += 1}`;
    const defs = document.createElementNS(SVG_NS, 'defs');
    const gradient = document.createElementNS(SVG_NS, 'linearGradient');
    gradient.id = gradientId;
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stopStart = document.createElementNS(SVG_NS, 'stop');
    stopStart.setAttribute('offset', '0%');
    stopStart.classList.add('sparkle-gradient-stop', 'sparkle-gradient-stop--start');
    stopStart.style.animationDelay = animationDelay;

    const stopEnd = document.createElementNS(SVG_NS, 'stop');
    stopEnd.setAttribute('offset', '100%');
    stopEnd.classList.add('sparkle-gradient-stop', 'sparkle-gradient-stop--end');
    stopEnd.style.animationDelay = animationDelay;

    gradient.appendChild(stopStart);
    gradient.appendChild(stopEnd);
    defs.appendChild(gradient);
    svg.appendChild(defs);

    SPARKLE_PATHS.forEach(d => {
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', `url(#${gradientId})`);
        svg.appendChild(path);
    });

    return svg;
}


function shouldUseVideoPreviews() {
    if (typeof window === 'undefined') {
        return true;
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
    }

    const connection = navigator.connection
        || navigator.mozConnection
        || navigator.webkitConnection;

    if (connection) {
        const { effectiveType, saveData } = connection;
        if (
            saveData
            || effectiveType === 'slow-2g'
            || effectiveType === '2g'
            || effectiveType === '3g'
        ) {
            return false;
        }
    }

    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        return false;
    }

    if (typeof window.innerWidth === 'number' && window.innerWidth < 900) {
        return false;
    }

    if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 3) {
        return false;
    }

    if (window.matchMedia && window.matchMedia('(any-hover: none)').matches) {
        return false;
    }

    return true;
}

function renderJourney(journey = {}) {
    const titleEl = document.getElementById('journeyTitle');
    if (titleEl) {
        titleEl.textContent = journey.title || '';
    }

    const container = document.getElementById('accordionContainer');
    if (!container) {
        return;
    }

    container.innerHTML = '';

    (journey.items || []).forEach(item => {
        container.appendChild(createAccordionItem(item));
    });
}

function createAccordionItem(item) {
    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';

    const header = document.createElement('div');
    header.className = 'accordion-header';

    const title = document.createElement('div');
    title.className = 'accordion-title';
    title.textContent = item.title || '';

    const icon = document.createElement('div');
    icon.className = 'accordion-icon';
    icon.textContent = '+';

    header.appendChild(title);
    header.appendChild(icon);

    const content = document.createElement('div');
    content.className = 'accordion-content';

    const body = document.createElement('div');
    body.className = 'accordion-body';
    body.textContent = item.content || '';

    content.appendChild(body);

    accordionItem.appendChild(header);
    accordionItem.appendChild(content);

    return accordionItem;
}

function renderPanels(panels = []) {
    const container = document.getElementById('panelsSection');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    panels.forEach((panel, index) => {
        const panelEl = document.createElement('div');
        panelEl.className = 'panel';
        panelEl.id = panel.id || `panel-${index + 1}`;

        if (panel.background) {
            panelEl.style.backgroundColor = panel.background;
        }
        if (panel.theme === 'dark') {
            panelEl.classList.add('panel--dark');
        }

        const number = document.createElement('div');
        number.className = 'panel-number';
        number.textContent = panel.number || `0${index + 1}`;

        const verticalLine = document.createElement('div');
        verticalLine.className = 'vertical-line';

        const content = document.createElement('div');
        content.className = 'panel-content';

        const heading = document.createElement('h1');
        heading.className = 'panel-title';
        heading.textContent = panel.title || '';

        const description = document.createElement('p');
        description.className = 'panel-description';
        description.textContent = panel.description || '';

        content.appendChild(heading);
        content.appendChild(description);

        panelEl.appendChild(number);
        panelEl.appendChild(verticalLine);
        panelEl.appendChild(content);

        container.appendChild(panelEl);
    });
}

function renderMenu(menuItems = []) {
    const container = document.getElementById('menuContainer');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    menuItems.forEach((item, index) => {
        if (!item) {
            return;
        }

        const menuItem = document.createElement('div');
        menuItem.className = `menu-item ${item.id || `menu-item-${index}`}`;
        menuItem.dataset.page = item.id || `menu-item-${index}`;
        if (item.background) {
            menuItem.style.backgroundColor = item.background;
        }

        const arrowIcon = createArrowIcon();
        arrowIcon.classList.add('menu-arrow');
        menuItem.appendChild(arrowIcon);

        const titleSpan = document.createElement('span');
        titleSpan.textContent = item.title || '';
        menuItem.appendChild(titleSpan);

        const detailPage = document.createElement('div');
        detailPage.className = `detail-page ${item.id || `menu-item-${index}`}`;
        detailPage.id = `page-${item.id || `menu-item-${index}`}`;
        if (item.background) {
            detailPage.style.backgroundColor = item.background;
        }

        const detailContent = document.createElement('div');
        detailContent.className = 'detail-content';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.dataset.closePage = item.id || `menu-item-${index}`;
        closeBtn.textContent = '✕ CLOSE';

        const heading = document.createElement('h1');
        heading.textContent = item.content?.title || item.title || '';

        const paragraph = document.createElement('p');
        paragraph.textContent = item.content?.text || '';

        detailContent.appendChild(closeBtn);
        detailContent.appendChild(heading);
        detailContent.appendChild(paragraph);

        detailPage.appendChild(detailContent);

        container.appendChild(menuItem);
        container.appendChild(detailPage);
    });
}

function buildVideoLookup(projects = []) {
    videoLookup = {};

    projects.forEach(project => {
        const key = project?.modalType || project?.id;
        if (key && project?.video) {
            videoLookup[key] = project.video;
        }
    });
}

function displayContentError(error) {
    const heroEl = document.getElementById('hero');
    const navLinks = document.getElementById('navLinks');

    if (heroEl) {
        const needsServer = window.location.protocol === 'file:';
        heroEl.textContent = needsServer
            ? 'Unable to load portfolio content. If you opened this file directly, try using a local server (e.g. `npx serve`).'
            : 'Unable to load portfolio content. Please try refreshing the page.';
        heroEl.classList.remove('gradient-text');
    }

    if (navLinks) {
        navLinks.innerHTML = '';
    }

    console.error('Content load error details:', error);
}

function parsePixels(value) {
    const parsed = parseFloat(value || '0');
    return Number.isNaN(parsed) ? 0 : parsed;
}

function fitWithinBounds(width, height, maxWidth, maxHeight) {
    let resultWidth = width || 0;
    let resultHeight = height || 0;

    if (!resultWidth || !resultHeight) {
        return {
            width: 0,
            height: 0,
        };
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

function resetModalSizing(elements) {
    if (!elements) {
        return;
    }

    const { modalContent, videoContainer } = elements;

    if (modalContent) {
        modalContent.style.width = '';
        modalContent.style.height = '';
    }

    if (videoContainer) {
        videoContainer.style.width = '';
        videoContainer.style.height = '';
        videoContainer.style.padding = '';
        videoContainer.style.background = '';
        videoContainer.style.minWidth = '';
        videoContainer.style.minHeight = '';
    }
}

function sizeModalToVideo(video, elements) {
    if (!video || !elements) {
        return;
    }

    const {
        modalContent,
        modalBody,
        modalHeader,
        videoContainer,
    } = elements;

    const mediaWidth = video.videoWidth || video.clientWidth || 0;
    const mediaHeight = video.videoHeight || video.clientHeight || 0;

    if (!mediaWidth || !mediaHeight) {
        return;
    }

    const contentStyles = modalContent ? window.getComputedStyle(modalContent) : null;
    const bodyStyles = modalBody ? window.getComputedStyle(modalBody) : null;

    const borderHorizontal = contentStyles
        ? parsePixels(contentStyles.borderLeftWidth) + parsePixels(contentStyles.borderRightWidth)
        : 0;
    const borderVertical = contentStyles
        ? parsePixels(contentStyles.borderTopWidth) + parsePixels(contentStyles.borderBottomWidth)
        : 0;

    const bodyPaddingHorizontal = bodyStyles
        ? parsePixels(bodyStyles.paddingLeft) + parsePixels(bodyStyles.paddingRight)
        : 0;
    const bodyPaddingVertical = bodyStyles
        ? parsePixels(bodyStyles.paddingTop) + parsePixels(bodyStyles.paddingBottom)
        : 0;

    const headerHeight = modalHeader ? modalHeader.offsetHeight : 0;

    const maxWidth = Math.max((window.innerWidth * 0.9) - borderHorizontal - bodyPaddingHorizontal, 1);
    const maxHeight = Math.max((window.innerHeight * 0.9) - borderVertical - bodyPaddingVertical - headerHeight, 1);

    const { width, height } = fitWithinBounds(mediaWidth, mediaHeight, maxWidth, maxHeight);

    if (videoContainer) {
        videoContainer.style.width = `${width}px`;
        videoContainer.style.height = `${height}px`;
        videoContainer.style.padding = '0';
        videoContainer.style.background = 'transparent';
        videoContainer.style.minWidth = '0';
        videoContainer.style.minHeight = '0';
    }

    video.style.width = `${width}px`;
    video.style.height = `${height}px`;

    if (modalContent) {
        modalContent.style.width = `${width + bodyPaddingHorizontal + borderHorizontal}px`;
        modalContent.style.height = `${height + bodyPaddingVertical + headerHeight + borderVertical}px`;
    }
}


function initNavigation(resumeDrawer) {
    try {
        const stickyNav = document.getElementById('stickyNav');
        const heroSection = document.getElementById('hero');

        if (!stickyNav || !heroSection) {
            console.warn('Navigation elements not found');
            return;
        }

        function handleScroll() {
            const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
            const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollPosition >= heroBottom - 100) {
                stickyNav.classList.add('visible');
            } else {
                stickyNav.classList.remove('visible');
            }
        }

        handleScroll();
        let navTicking = false;

        function throttledNavScroll() {
            if (!navTicking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    navTicking = false;
                });
                navTicking = true;
            }
        }

        window.addEventListener('scroll', throttledNavScroll);

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', event => {
                if (link.dataset.resumeDrawer === 'true') {
                    event.preventDefault();
                    if (resumeDrawer && typeof resumeDrawer.open === 'function') {
                        resumeDrawer.open(link);
                    }
                    return;
                }

                const targetId = link.getAttribute('href');
                if (!targetId || !targetId.startsWith('#')) {
                    return;
                }

                event.preventDefault();
                const targetSection = document.querySelector(targetId);

                if (targetSection) {
                    const navHeight = stickyNav.offsetHeight;
                    const targetPosition = targetSection.offsetTop - navHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth',
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error initializing navigation:', error);
    }
}

function initResumeDrawer() {
    if (resumeDrawerInitialized) {
        return;
    }

    resumeDrawerElement = document.getElementById('resumeDrawer');
    if (!resumeDrawerElement) {
        return;
    }

    resumeDrawerPanelElement = resumeDrawerElement.querySelector('.resume-drawer__panel');
    resumeDrawerOverlayElement = resumeDrawerElement.querySelector('.resume-drawer__overlay');

    if (!resumeDrawerPanelElement) {
        console.warn('Resume drawer panel not found');
        return;
    }

    resumeDrawerElement.setAttribute('aria-hidden', 'true');

    Object.assign(resumeDrawerElement.style, {
        position: 'fixed',
        inset: '0',
        pointerEvents: 'none',
        zIndex: '2000',
    });

    if (resumeDrawerOverlayElement) {
        Object.assign(resumeDrawerOverlayElement.style, {
            position: 'absolute',
            inset: '0',
            background: 'rgba(0, 0, 0, 0.35)',
            opacity: '0',
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none',
            zIndex: '2000',
        });
    }

    Object.assign(resumeDrawerPanelElement.style, {
        position: 'absolute',
        top: '0',
        right: '0',
        width: '100vw',
        height: '100vh',
        background: '#fff',
        overflowY: 'auto',
        padding: 'clamp(1rem, 2vw, 2rem)',
        transform: 'translateX(100%)',
        transition: 'transform 0.5s ease',
        zIndex: '2001',
    });

    if (!resumeDrawerCloseButton) {
        resumeDrawerCloseButton = document.createElement('button');
        resumeDrawerCloseButton.type = 'button';
        resumeDrawerCloseButton.setAttribute('aria-label', 'Close resume');

        const icon = document.createElement('span');
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '✕';
        resumeDrawerCloseButton.appendChild(icon);

        Object.assign(resumeDrawerCloseButton.style, {
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

        const setRestState = () => {
            resumeDrawerCloseButton.style.background = 'rgba(0, 0, 0, 0.05)';
            resumeDrawerCloseButton.style.transform = 'scale(1)';
        };

        const setActiveState = () => {
            resumeDrawerCloseButton.style.background = 'rgba(0, 0, 0, 0.1)';
            resumeDrawerCloseButton.style.transform = 'scale(1.05)';
        };

        resumeDrawerCloseButton.addEventListener('mouseenter', setActiveState);
        resumeDrawerCloseButton.addEventListener('mouseleave', setRestState);
        resumeDrawerCloseButton.addEventListener('focus', setActiveState);
        resumeDrawerCloseButton.addEventListener('blur', setRestState);
        resumeDrawerCloseButton.addEventListener('click', () => closeResumeDrawer());
        setRestState();
    }

    if (!resumeDrawerCloseButton.isConnected) {
        resumeDrawerPanelElement.appendChild(resumeDrawerCloseButton);
    }

    if (!resumeDrawerStatusElement) {
        resumeDrawerStatusElement = document.createElement('p');
        Object.assign(resumeDrawerStatusElement.style, {
            padding: '2rem',
            textAlign: 'center',
            fontSize: '1rem',
            color: '#2E2520',
            display: 'none',
        });
    }

    if (!resumeDrawerStatusElement.isConnected) {
        resumeDrawerPanelElement.appendChild(resumeDrawerStatusElement);
    }

    if (!resumeDrawerShadowHost) {
        resumeDrawerShadowHost = document.createElement('div');
        resumeDrawerShadowHost.style.minHeight = '100%';
        resumeDrawerShadowHost.style.display = 'block';
        resumeDrawerShadowHost.style.width = '100%';
        resumeDrawerShadowRoot = resumeDrawerShadowHost.attachShadow({ mode: 'open' });
    }

    if (!resumeDrawerShadowHost.isConnected) {
        resumeDrawerPanelElement.appendChild(resumeDrawerShadowHost);
    }

    if (!resumeDrawerShadowRoot && resumeDrawerShadowHost) {
        resumeDrawerShadowRoot = resumeDrawerShadowHost.attachShadow({ mode: 'open' });
    }

    if (resumeDrawerCloseButton && resumeDrawerCloseButton.isConnected) {
        resumeDrawerPanelElement.insertBefore(resumeDrawerCloseButton, resumeDrawerPanelElement.firstChild);
    }

    if (resumeDrawerOverlayElement) {
        resumeDrawerOverlayElement.addEventListener('click', () => closeResumeDrawer());
    }

    resumeDrawerElement.removeAttribute('hidden');

    document.addEventListener('keydown', handleResumeDrawerKeydown);
    resumeDrawerInitialized = true;
}

async function loadResumeDrawerContent() {
    if (resumeDrawerContentLoaded || !resumeDrawerPanelElement) {
        return;
    }

    if (resumeDrawerLoadingPromise) {
        return resumeDrawerLoadingPromise;
    }

    const showLoading = () => {
        if (resumeDrawerStatusElement) {
            resumeDrawerStatusElement.textContent = 'Loading resume…';
            resumeDrawerStatusElement.style.display = 'block';
        }

        if (resumeDrawerShadowRoot) {
            resumeDrawerShadowRoot.innerHTML = '';
        }

        if (resumeDrawerCloseButton && !resumeDrawerCloseButton.isConnected) {
            resumeDrawerPanelElement.insertBefore(resumeDrawerCloseButton, resumeDrawerPanelElement.firstChild);
        }
    };

    resumeDrawerLoadingPromise = (async () => {
        showLoading();

        const response = await fetch(RESUME_DRAWER_PATH, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load resume drawer content (${response.status})`);
        }

        const text = await response.text();
        resumeDrawerDocumentHTML = text;
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        if (!resumeDrawerExternalStylesLoaded && doc.head) {
            const documentHead = document.head || document.getElementsByTagName('head')[0];
            doc.head.querySelectorAll('link[rel="stylesheet"]').forEach(linkNode => {
                const href = linkNode.getAttribute('href');
                if (!href) {
                    return;
                }
                if (!documentHead.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
                    documentHead.appendChild(linkNode.cloneNode(true));
                }
            });
            resumeDrawerExternalStylesLoaded = true;
        }

        if (resumeDrawerStatusElement) {
            resumeDrawerStatusElement.style.display = 'none';
        }

        if (resumeDrawerShadowRoot) {
            resumeDrawerShadowRoot.innerHTML = '';

            if (doc.head) {
                doc.head.querySelectorAll('link[rel="stylesheet"]').forEach(linkNode => {
                    resumeDrawerShadowRoot.appendChild(linkNode.cloneNode(true));
                });

                doc.head.querySelectorAll('style').forEach(styleNode => {
                    resumeDrawerShadowRoot.appendChild(styleNode.cloneNode(true));
                });
            }

            if (doc.body) {
                resumeDrawerShadowRoot.appendChild(doc.body.cloneNode(true));
            } else {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = text;
                resumeDrawerShadowRoot.appendChild(wrapper);
            }
        }

        if (resumeDrawerPanelElement) {
            resumeDrawerPanelElement.scrollTop = 0;
        }

        setupResumeDownloadButton();
        resumeDrawerContentLoaded = true;
    })().catch(error => {
        console.error('Failed to load resume drawer content:', error);
        if (resumeDrawerShadowRoot) {
            resumeDrawerShadowRoot.innerHTML = '';
        }
        if (resumeDrawerStatusElement) {
            resumeDrawerStatusElement.textContent = 'Unable to load resume right now.';
            resumeDrawerStatusElement.style.display = 'block';
        }
    }).finally(() => {
        resumeDrawerLoadingPromise = null;
    });

    return resumeDrawerLoadingPromise;
}

function setupResumeDownloadButton() {
    if (!resumeDrawerShadowRoot) {
        return;
    }

    const downloadButton = resumeDrawerShadowRoot.querySelector('.download-btn');
    if (!downloadButton || downloadButton.__resumeDownloadAttached) {
        return;
    }

    downloadButton.removeAttribute('onclick');

    downloadButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        initiateResumePdfDownload();
    });

    downloadButton.__resumeDownloadAttached = true;
}

function initiateResumePdfDownload() {
    if (!resumeDrawerDocumentHTML) {
        window.print();
        return;
    }

    const iframe = document.createElement('iframe');
    iframe.title = 'Resume PDF preview';
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, {
        position: 'fixed',
        width: '0',
        height: '0',
        border: '0',
        top: '0',
        left: '0',
        visibility: 'hidden',
    });

    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    if (!frameWindow || !frameWindow.document) {
        document.body.removeChild(iframe);
        window.print();
        return;
    }

    let printTriggered = false;
    const cleanup = () => {
        setTimeout(() => {
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        }, 300);
    };

    const triggerPrint = () => {
        if (printTriggered) {
            return;
        }
        printTriggered = true;
        try {
            frameWindow.focus();
            frameWindow.print();
        } catch (error) {
            console.error('Unable to print resume document:', error);
            window.print();
        } finally {
            cleanup();
        }
    };

    iframe.addEventListener('load', triggerPrint, { once: true });

    try {
        frameWindow.document.open();
        frameWindow.document.write(resumeDrawerDocumentHTML);
        frameWindow.document.close();
    } catch (error) {
        console.error('Unable to prime resume print frame:', error);
        cleanup();
        window.print();
        return;
    }

    if (frameWindow.document.readyState === 'complete') {
        triggerPrint();
    }
}

async function openResumeDrawer(triggerElement) {
    if (!resumeDrawerInitialized) {
        initResumeDrawer();
    }

    if (!resumeDrawerElement) {
        return;
    }

    resumeDrawerTriggerElement = triggerElement || null;
    resumeDrawerFocusReturn = document.activeElement;

    const loadPromise = loadResumeDrawerContent() || Promise.resolve();

    resumeDrawerElement.setAttribute('aria-hidden', 'false');
    resumeDrawerElement.style.pointerEvents = 'auto';

    if (resumeDrawerPreviousBodyOverflow === null) {
        resumeDrawerPreviousBodyOverflow = document.body.style.overflow || '';
    }
    document.body.style.overflow = 'hidden';

    if (resumeDrawerOverlayElement) {
        resumeDrawerOverlayElement.style.pointerEvents = 'auto';
        resumeDrawerOverlayElement.style.opacity = '1';
    }

    resumeDrawerPanelElement.style.transform = 'translateX(0)';

    if (resumeDrawerTriggerElement && typeof resumeDrawerTriggerElement.setAttribute === 'function') {
        resumeDrawerTriggerElement.setAttribute('aria-expanded', 'true');
    }

    try {
        await loadPromise;
    } catch (error) {
        // load errors are logged inside loadResumeDrawerContent
    }

    if (resumeDrawerElement.getAttribute('aria-hidden') === 'false') {
        if (resumeDrawerCloseButton && typeof resumeDrawerCloseButton.focus === 'function') {
            resumeDrawerCloseButton.focus();
        } else if (resumeDrawerPanelElement && typeof resumeDrawerPanelElement.focus === 'function') {
            resumeDrawerPanelElement.focus({ preventScroll: true });
        }
    }
}

function closeResumeDrawer() {
    if (!resumeDrawerElement || resumeDrawerElement.getAttribute('aria-hidden') === 'true') {
        return;
    }

    resumeDrawerElement.setAttribute('aria-hidden', 'true');
    resumeDrawerElement.style.pointerEvents = 'none';

    if (resumeDrawerOverlayElement) {
        resumeDrawerOverlayElement.style.pointerEvents = 'none';
        resumeDrawerOverlayElement.style.opacity = '0';
    }

    resumeDrawerPanelElement.style.transform = 'translateX(100%)';

    if (resumeDrawerPanelElement) {
        resumeDrawerPanelElement.scrollTop = 0;
    }

    if (resumeDrawerPreviousBodyOverflow !== null) {
        document.body.style.overflow = resumeDrawerPreviousBodyOverflow;
        resumeDrawerPreviousBodyOverflow = null;
    }

    if (resumeDrawerTriggerElement && typeof resumeDrawerTriggerElement.setAttribute === 'function') {
        resumeDrawerTriggerElement.setAttribute('aria-expanded', 'false');
    }

    const focusTarget = resumeDrawerTriggerElement || resumeDrawerFocusReturn;
    if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus();
    }

    resumeDrawerTriggerElement = null;
    resumeDrawerFocusReturn = null;

    if (resumeDrawerStatusElement) {
        resumeDrawerStatusElement.style.display = 'none';
    }
}

