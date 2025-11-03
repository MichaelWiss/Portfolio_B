/**
 * ProjectsRenderer Module
 * Handles rendering of project marquee content and related helpers.
 */

const ProjectsRenderer = (() => {
    const render = (projects = [], { preloader, teardownMarquee } = {}) => {
        const marquee = DOMUtils.byId(Constants.ELEMENTS.projectsMarquee);
        const projectList = Array.isArray(projects) ? projects.filter(Boolean) : [];

        State.projects.currentData = projectList.slice();

        if (!marquee) {
            return;
        }

        if (typeof teardownMarquee === 'function') {
            teardownMarquee(marquee);
        }

        const container = marquee.parentElement;
        if (container) {
            DOMUtils.toggleClass(container, Constants.CLASSES.marqueeContainerGallery, State.projects.isMobileView);
        }

        DOMUtils.toggleClass(marquee, Constants.CLASSES.projectsGallery, State.projects.isMobileView);
        DOMUtils.toggleClass(marquee, Constants.CLASSES.marqueeDesktop, !State.projects.isMobileView);
        DOMUtils.removeClass(marquee, Constants.CLASSES.marqueeAnimated, Constants.CLASSES.marqueePaused);
        marquee.style.transform = '';

        DOMUtils.removeAttribute(marquee, Constants.DATA_ATTRIBUTES.mediaPreloaderInitialized);
        DOMUtils.clearChildren(marquee);

        preloadProjectPosters(projectList);

        const supportsWebM = typeof canPlayProjectWebM === 'function'
            ? canPlayProjectWebM()
            : true;
        State.projects.forceVideoPreviews = State.projects.isMobileView && supportsWebM;

        if (!projectList.length) {
            const placeholder = DOMUtils.createElement('div', Constants.CLASSES.grateCard);
            const title = DOMUtils.createElement('div', Constants.CLASSES.grateTitle, { text: 'Projects coming soon' });
            DOMUtils.append(placeholder, title);
            DOMUtils.append(marquee, placeholder);
            State.projects.forceVideoPreviews = false;
            return;
        }

        State.projects.posterRenderCount = 0;

        const itemsToRender = State.projects.isMobileView
            ? projectList
            : projectList.concat(projectList);

        itemsToRender.forEach(project => {
            const card = createProjectCard(project);
            if (card) {
                DOMUtils.append(marquee, card);
            }
        });

        State.projects.forceVideoPreviews = false;

        if (preloader && typeof preloader.init === 'function') {
            preloader.init(marquee);
        }
    };

    const buildVideoLookup = (projects = []) => {
        const lookup = {};

        projects.forEach(project => {
            const key = project?.modalType || project?.id;
            if (key && project?.video) {
                lookup[key] = project.video;
            }
        });

        State.ui.videoLookup = lookup;
    };

    const preloadProjectPosters = (projects = [], limit = Constants.MAX_EAGER_POSTER_IMAGES) => {
        if (!projects.length) {
            return;
        }

        const head = document.head || document.querySelector('head');
        if (!head) {
            return;
        }

        const seen = State.projects.preloadedPosters;
        let count = 0;

        projects.some(project => {
            const poster = project?.previewPoster;
            if (!poster || seen.has(poster)) {
                return false;
            }

            const link = DOMUtils.createElement('link');
            DOMUtils.setAttribute(link, 'rel', 'preload');
            DOMUtils.setAttribute(link, 'as', 'image');
            DOMUtils.setAttribute(link, 'href', poster);
            DOMUtils.setAttribute(link, 'fetchpriority', 'high');
            link.fetchPriority = 'high';

            head.appendChild(link);
            seen.add(poster);
            count += 1;

            return count >= limit;
        });
    };

    const createProjectCard = project => {
        if (!project) {
            return null;
        }

        const card = DOMUtils.createElement('div', Constants.CLASSES.grateCard);
        const modalKey = project.modalType || project.id;

        if (modalKey) {
            DOMUtils.setData(card, Constants.DATA_ATTRIBUTES.modalType, modalKey);
        }

        if (project.title) {
            DOMUtils.setData(card, Constants.DATA_ATTRIBUTES.modalTitle, project.title);
        }

        const label = DOMUtils.createElement('div', Constants.CLASSES.grateLabel, { text: project.label || '' });
        const title = DOMUtils.createElement('div', Constants.CLASSES.grateTitle, { text: project.title || 'Untitled' });

        DOMUtils.append(card, label);
        DOMUtils.append(card, title);

        title.appendChild(document.createTextNode(' '));
        const arrow = createArrowIcon();
        if (arrow) {
            DOMUtils.append(title, arrow);
        }

        const media = createProjectPreviewMedia(project);
        if (media) {
            DOMUtils.append(card, media);
        }

        return card;
    };

    const createArrowIcon = () => {
        const svg = DOMUtils.createSVG('svg', {
            viewBox: '0 0 16 16',
            width: '24',
            height: '24',
            'aria-hidden': 'true',
            focusable: 'false',
        });

        DOMUtils.addClass(svg, Constants.CLASSES.arrowIcon);

        const path = DOMUtils.createSVG('path', {
            d: 'M4 12 L12 4 M7 4 H12 V9',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '1.5',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
        });

        DOMUtils.append(svg, path);
        return svg;
    };

    const createProjectPreviewMedia = project => {
        const previewSrc = project?.previewMedia || project?.image || '';
        const altText = project?.alt || project?.title || 'Project preview';

        if (!previewSrc) {
            return createProjectPreviewPlaceholder(altText);
        }

        const isVideoAsset = Constants.VIDEO_PREVIEW_PATTERN.test(previewSrc);
        const useVideo = isVideoAsset
            && (State.projects.forceVideoPreviews || (typeof shouldUseVideoPreviews === 'function' && shouldUseVideoPreviews()));

        if (useVideo) {
            const video = DOMUtils.createElement('video', Constants.CLASSES.grateMedia, {
                autoplay: '',
                loop: '',
                muted: '',
                playsinline: '',
                preload: 'none',
            });

            DOMUtils.setAttribute(video, 'webkit-playsinline', '');
            DOMUtils.setAttribute(video, 'loading', 'lazy');
            DOMUtils.setAttribute(video, Constants.ARIA.role, 'img');
            DOMUtils.setAttribute(video, Constants.ARIA.label, altText);

            DOMUtils.setData(video, Constants.DATA_ATTRIBUTES.previewSrc, previewSrc);
            DOMUtils.setData(video, Constants.DATA_ATTRIBUTES.previewType, getVideoMimeType(previewSrc));
            DOMUtils.setData(video, Constants.DATA_ATTRIBUTES.deferLoad, 'true');

            video.disablePictureInPicture = true;
            video.disableRemotePlayback = true;

            const posterSrc = project?.previewPoster
                || (project?.image && !Constants.VIDEO_PREVIEW_PATTERN.test(project.image) ? project.image : '');

            if (posterSrc) {
                video.poster = posterSrc;
                DOMUtils.setData(video, Constants.DATA_ATTRIBUTES.posterSrc, posterSrc);
            }

            return video;
        }

        const imageSrc = project?.previewPoster || project?.image;
        if (imageSrc) {
            const eager = State.projects.posterRenderCount < Constants.MAX_EAGER_POSTER_IMAGES;
            State.projects.posterRenderCount += 1;
            return createProjectPreviewImage(imageSrc, altText, eager);
        }

        return createProjectPreviewPlaceholder(altText);
    };

    const createProjectPreviewImage = (src, altText, eager = false) => {
        const image = DOMUtils.createElement('img', Constants.CLASSES.grateMedia);
        image.src = src;
        image.alt = altText;
        image.decoding = 'async';
        image.width = 360;
        image.height = 480;

        if (eager) {
            image.loading = 'eager';
            image.fetchPriority = 'high';
        } else {
            image.loading = 'lazy';
            image.fetchPriority = 'low';
        }

        return image;
    };

    const createProjectPreviewPlaceholder = altText => {
        return DOMUtils.createElement('div', `${Constants.CLASSES.grateMedia} ${Constants.CLASSES.grateMediaPlaceholder}`, {
            text: altText,
        });
    };

    const getVideoMimeType = src => {
        if (!src) {
            return Constants.MIME_TYPES.mp4;
        }

        if (src.endsWith('.webm')) {
            return Constants.MIME_TYPES.webm;
        }

        if (src.endsWith('.ogv')) {
            return Constants.MIME_TYPES.ogg;
        }

        return Constants.MIME_TYPES.mp4;
    };

    return {
        render,
        buildVideoLookup,
    };
})();

