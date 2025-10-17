// Portfolio B - Dynamic Content Initialization

const CONTENT_PATH = 'assets/data/content.json';
const SVG_NS = 'http://www.w3.org/2000/svg';
const SPARKLE_PATHS = [
    'M22.625 2c0 15.834-8.557 30-20.625 30c12.068 0 20.625 14.167 20.625 30c0-15.833 8.557-30 20.625-30c-12.068 0-20.625-14.166-20.625-30',
    'M47 32c0 7.918-4.277 15-10.313 15C42.723 47 47 54.084 47 62c0-7.916 4.277-15 10.313-15C51.277 47 47 39.918 47 32z',
    'M51.688 2c0 7.917-4.277 15-10.313 15c6.035 0 10.313 7.084 10.313 15c0-7.916 4.277-15 10.313-15c-6.036 0-10.313-7.083-10.313-15',
];
let sparkleGradientCounter = 0;

let videoLookup = {};
let currentVideo = null;
let currentModalResizeHandler = null;
let currentModalElements = null;

console.log('JavaScript file loaded');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded fired');

    try {
        const data = await loadContentData();
        applyContent(data);

        initEventDelegation();
        initNavigation();
       initAccordion();

        requestAnimationFrame(() => {
            initMenu();
            initMarqueeAnimations();
            console.log('Menu and marquees initialized');
        });

        console.log('Portfolio app initialized successfully');
    } catch (error) {
        console.error('App initialization error:', error);
        displayContentError(error);
    }
});

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
        navLinks.appendChild(anchor);
    });
}

function renderBlueMarquee(site) {
    const marquee = document.getElementById('nameMarquee');

    if (!marquee) {
        return;
    }

    marquee.innerHTML = '';

    const label = (site.title || 'Michael Wiss').toUpperCase();
    const repeated = `${Array(8).fill(label).join(' • ')} • `;

    for (let i = 0; i < 2; i += 1) {
        const textBlock = document.createElement('div');
        textBlock.className = 'blue-marquee-text';
        textBlock.textContent = repeated;
        marquee.appendChild(textBlock);
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

function renderProjects(projects = []) {
    const marquee = document.getElementById('projectsMarquee');

    if (!marquee) {
        return;
    }

    marquee.innerHTML = '';

    if (!projects.length) {
        const placeholder = document.createElement('div');
        placeholder.className = 'grate-card';
        placeholder.innerHTML = '<div class="grate-title">Projects coming soon</div>';
        marquee.appendChild(placeholder);
        return;
    }

    const loopingProjects = [...projects, ...projects];
    loopingProjects.forEach(project => {
        marquee.appendChild(createProjectCard(project));
    });
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'grate-card';

    const modalKey = project.modalType || project.id;
    if (modalKey) {
        card.dataset.modalType = modalKey;
    }
    if (project.title) {
        card.dataset.modalTitle = project.title;
    }

    const label = document.createElement('div');
    label.className = 'grate-label';
    label.textContent = project.label || '';

    const title = document.createElement('div');
    title.className = 'grate-title';
    title.textContent = project.title || 'Untitled';

    title.appendChild(document.createTextNode(' '));

    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '↗';
    title.appendChild(arrow);

    const image = document.createElement('img');
    image.className = 'grate-image';
    image.src = project.image || '';
    image.alt = project.alt || project.title || 'Project preview';
    image.loading = 'lazy';

    card.appendChild(label);
    card.appendChild(title);
    card.appendChild(image);

    return card;
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

function openModal(title, type) {
    try {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const videoContainer = document.getElementById('videoContainer');
        const modalContent = modal ? modal.querySelector('.modal-content') : null;
        const modalBody = modal ? modal.querySelector('.modal-body') : null;
        const modalHeader = modal ? modal.querySelector('.modal-header') : null;

        if (!modal || !modalTitle || !videoContainer || !modalContent || !modalBody) {
            console.error('Modal elements not found');
            return;
        }

        if (currentModalResizeHandler) {
            window.removeEventListener('resize', currentModalResizeHandler);
            currentModalResizeHandler = null;
        }

        resetModalSizing(currentModalElements);

        currentModalElements = {
            modalContent,
            modalBody,
            modalHeader,
            videoContainer,
        };

        modalTitle.textContent = title || 'Project';

        const videoPath = videoLookup[type];

        videoContainer.innerHTML = '';

        if (!videoPath) {
            const placeholder = document.createElement('div');
            placeholder.className = 'video-placeholder';
            placeholder.textContent = 'Project video coming soon.';
            videoContainer.appendChild(placeholder);
            currentVideo = null;
            currentModalResizeHandler = null;
        } else {
            const video = document.createElement('video');
            video.controls = true;
            video.autoplay = true;
            video.playsInline = true;

            const mp4Source = document.createElement('source');
            mp4Source.src = videoPath;
            mp4Source.type = 'video/mp4';

            const movSource = document.createElement('source');
            movSource.src = videoPath;
            movSource.type = 'video/quicktime';

            video.appendChild(mp4Source);
            video.appendChild(movSource);

            videoContainer.appendChild(video);
            currentVideo = video;

            const handleMetadata = () => {
                requestAnimationFrame(() => {
                    if (!currentModalElements) {
                        return;
                    }

                    sizeModalToVideo(video, currentModalElements);
                    if (currentModalResizeHandler) {
                        window.removeEventListener('resize', currentModalResizeHandler);
                    }
                    currentModalResizeHandler = () => sizeModalToVideo(video, currentModalElements);
                    window.addEventListener('resize', currentModalResizeHandler);
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

            video.addEventListener('error', () => {
                if (currentModalResizeHandler) {
                    window.removeEventListener('resize', currentModalResizeHandler);
                    currentModalResizeHandler = null;
                }

                resetModalSizing(currentModalElements);
                videoContainer.innerHTML = '';
                const placeholder = document.createElement('div');
                placeholder.className = 'video-placeholder';
                placeholder.textContent = 'Unable to play this video.';
                videoContainer.appendChild(placeholder);
                currentVideo = null;
            }, { once: true });
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error opening modal:', error);
    }
}

function closeModal() {
    try {
        const modal = document.getElementById('modal');
        const videoContainer = document.getElementById('videoContainer');

        if (currentVideo) {
            currentVideo.pause();
            currentVideo = null;
        }

        if (currentModalResizeHandler) {
            window.removeEventListener('resize', currentModalResizeHandler);
            currentModalResizeHandler = null;
        }

        resetModalSizing(currentModalElements);
        currentModalElements = null;

        if (modal) {
            modal.classList.remove('active');
        }

        document.body.style.overflow = 'auto';

        setTimeout(() => {
            if (videoContainer) {
                videoContainer.innerHTML = '';
                const placeholder = document.createElement('div');
                placeholder.className = 'video-placeholder';
                placeholder.textContent = 'Project video will appear here.';
                videoContainer.appendChild(placeholder);
            }
        }, 300);
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

function initEventDelegation() {
    document.addEventListener('click', event => {
        try {
            const grateCard = event.target.closest('.grate-card');
            if (grateCard) {
                const modalType = grateCard.dataset.modalType;
                const modalTitle = grateCard.dataset.modalTitle;
                if (modalType) {
                    openModal(modalTitle, modalType);
                }
                return;
            }

            const closeBtn = event.target.closest('.close-btn');
            if (closeBtn) {
                const pageName = closeBtn.dataset.closePage;
                if (pageName) {
                    closePage(pageName);
                }
                return;
            }

            if (event.target.matches('#closeModalBtn') || event.target.closest('.close-modal-btn')) {
                closeModal();
                return;
            }

            if (event.target.matches('#modal')) {
                closeModal();
            }
        } catch (error) {
            console.error('Error handling click event:', error);
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            try {
                closeModal();
            } catch (error) {
                console.error('Error closing modal with escape key:', error);
            }
        }
    });
}

function initNavigation() {
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

function initAccordion() {
    try {
        const accordionHeaders = document.querySelectorAll('.accordion-header');

        accordionHeaders.forEach(header => {
            header.addEventListener('click', function onAccordionClick() {
                const item = this.parentElement;
                const isActive = item.classList.contains('active');

                document.querySelectorAll('.accordion-item').forEach(accordionItem => {
                    accordionItem.classList.remove('active');
                });

                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    } catch (error) {
        console.error('Error initializing accordion:', error);
    }
}

function initMenu() {
    try {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function onMenuClick() {
                const pageId = this.getAttribute('data-page');
                const detailPage = document.getElementById(`page-${pageId}`);

                if (!detailPage) {
                    console.warn(`Detail page not found: ${pageId}`);
                    return;
                }

                document.querySelectorAll('.detail-page').forEach(page => {
                    page.classList.remove('active');
                });
                document.querySelectorAll('.menu-item').forEach(menuItem => {
                    menuItem.classList.remove('active');
                });

                this.classList.add('active');
                detailPage.classList.add('active');
            });
        });
    } catch (error) {
        console.error('Error initializing menu:', error);
    }
}

function closePage(pageId) {
    try {
        const detailPage = document.getElementById(`page-${pageId}`);
        const menuItem = document.querySelector(`[data-page="${pageId}"]`);

        if (detailPage) {
            detailPage.classList.remove('active');
        }

        if (menuItem) {
            menuItem.classList.remove('active');
        }
    } catch (error) {
        console.error('Error closing page:', error);
    }
}

function initMarqueeAnimations() {
    const THANK_YOU_DURATION = 78000;
    let nameMarqueeInstance = null;

    const startNameMarquee = speed => {
        if (nameMarqueeInstance && typeof nameMarqueeInstance.destroy === 'function') {
            nameMarqueeInstance.destroy();
        }

        const config = {
            marqueeId: 'nameMarquee',
            direction: 'left',
            pauseOnHover: false,
        };

        if (speed && speed > 0) {
            config.pixelsPerSecond = speed;
        } else {
            config.duration = THANK_YOU_DURATION;
        }

        nameMarqueeInstance = initSeamlessMarquee(config);
    };

    const thankYouMarqueeInstance = initSeamlessMarquee({
        marqueeId: 'thankYouMarquee',
        duration: THANK_YOU_DURATION,
        direction: 'left',
        pauseOnHover: false,
        onReady: ({ speed }) => {
            startNameMarquee(speed);
        },
    });

    if (!thankYouMarqueeInstance) {
        startNameMarquee();
    }

    initSeamlessMarquee({
        marqueeId: 'projectsMarquee',
        duration: 120000,
        direction: 'right',
        pauseOnHover: true,
        startAt: -1,
    });
}

function initSeamlessMarquee({
    marqueeId,
    duration = 30000,
    pixelsPerSecond,
    direction = 'left',
    pauseOnHover = false,
    startAt,
    onReady,
} = {}) {
    if (!marqueeId) {
        return null;
    }

    const marquee = document.getElementById(marqueeId);
    if (!marquee || !marquee.children.length) {
        return null;
    }

    const container = marquee.parentElement;
    if (!container) {
        return null;
    }

    const directionMultiplier = direction === 'right' ? 1 : -1;
    const offsetFactor = typeof startAt === 'number' ? startAt : (directionMultiplier === 1 ? -1 : 0);

    if (marquee.children.length < 2) {
        marquee.innerHTML += marquee.innerHTML;
    }

    const state = {
        animationFrameId: null,
        halfWidth: 0,
        speed: typeof pixelsPerSecond === 'number' && pixelsPerSecond > 0 ? pixelsPerSecond : null,
        position: 0,
        lastTime: null,
        isPaused: false,
    };

    const normalizePosition = () => {
        if (!state.halfWidth) {
            return;
        }

        const limit = state.halfWidth;

        if (directionMultiplier === -1) {
            while (state.position <= -limit) {
                state.position += limit;
            }
            while (state.position > 0) {
                state.position -= limit;
            }
        } else {
            while (state.position >= 0) {
                state.position -= limit;
            }
            while (state.position < -limit) {
                state.position += limit;
            }
        }
    };

    const measure = () => {
        state.halfWidth = marquee.scrollWidth / 2;

        if (!state.halfWidth) {
            return false;
        }

        if (!state.speed) {
            state.speed = state.halfWidth / (duration / 1000);
        }

        state.position = offsetFactor * state.halfWidth;
        normalizePosition();
        marquee.style.transform = `translate3d(${state.position}px, 0, 0)`;

        if (typeof onReady === 'function') {
            onReady({
                speed: state.speed,
                halfWidth: state.halfWidth,
            });
        }

        return true;
    };

    const step = time => {
        if (state.isPaused) {
            state.animationFrameId = requestAnimationFrame(step);
            return;
        }

        if (state.lastTime === null) {
            state.lastTime = time;
            state.animationFrameId = requestAnimationFrame(step);
            return;
        }

        if (!state.halfWidth || !state.speed) {
            state.animationFrameId = requestAnimationFrame(step);
            return;
        }

        const delta = (time - state.lastTime) / 1000;
        state.lastTime = time;

        state.position += directionMultiplier * state.speed * delta;
        normalizePosition();

        marquee.style.transform = `translate3d(${state.position}px, 0, 0)`;
        state.animationFrameId = requestAnimationFrame(step);
    };

    const start = () => {
        if (!measure()) {
            requestAnimationFrame(start);
            return;
        }

        if (state.animationFrameId !== null) {
            cancelAnimationFrame(state.animationFrameId);
        }

        state.lastTime = null;
        state.animationFrameId = requestAnimationFrame(step);
    };

    const readyPromise = document.fonts && typeof document.fonts.ready === 'object'
        ? document.fonts.ready.catch(() => {})
        : Promise.resolve();

    readyPromise.then(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(start);
        });
    });

    let resizeObserver;
    let resizeHandler;

    if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
            state.halfWidth = 0;
            start();
        });
        resizeObserver.observe(container);
    } else {
        resizeHandler = () => {
            state.halfWidth = 0;
            start();
        };
        window.addEventListener('resize', resizeHandler);
    }

    let onMouseEnter;
    let onMouseLeave;

    if (pauseOnHover) {
        onMouseEnter = () => {
            state.isPaused = true;
        };

        onMouseLeave = () => {
            state.isPaused = false;
            state.lastTime = null;
        };

        container.addEventListener('mouseenter', onMouseEnter);
        container.addEventListener('mouseleave', onMouseLeave);
    }

    const destroy = () => {
        if (state.animationFrameId !== null) {
            cancelAnimationFrame(state.animationFrameId);
        }

        if (resizeObserver) {
            resizeObserver.disconnect();
        } else if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
        }

        if (pauseOnHover) {
            container.removeEventListener('mouseenter', onMouseEnter);
            container.removeEventListener('mouseleave', onMouseLeave);
        }
    };

    return {
        destroy,
        getPixelsPerSecond: () => state.speed || 0,
        getHalfWidth: () => state.halfWidth,
    };
}
