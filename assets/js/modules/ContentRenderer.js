/**
 * ContentRenderer Module
 * Coordinates domain renderers to populate portfolio content.
 */

const ContentRenderer = (() => {
    const applyContent = (data = {}, { preloader, marqueeManager } = {}) => {
        const site = data.site || {};
        const navigation = data.navigation || {};
        const projects = Array.isArray(data.projects) ? data.projects : [];
        const journey = data.journey || {};
        const panels = Array.isArray(data.panels) ? data.panels : [];
        const menu = Array.isArray(data.menu) ? data.menu : [];

        const teardown = marqueeManager
            ? marqueeManager.teardownProjectsMarquee.bind(marqueeManager)
            : undefined;

        UIRenderer.renderDocumentMeta(site);
        UIRenderer.renderNavigation(navigation, site);
        HeroRenderer.render(site);
        ProjectsRenderer.render(projects, { preloader, teardownMarquee: teardown });
        UIRenderer.renderJourney(journey);
        UIRenderer.renderPanels(panels);
        UIRenderer.renderMenu(menu);
        ProjectsRenderer.buildVideoLookup(projects);

        if (marqueeManager) {
            marqueeManager.refreshStaticMarquees();
            marqueeManager.refreshProjectsMarquee();
        }
    };

    const displayContentError = error => {
        const heroElement = DOMUtils.byId(Constants.ELEMENTS.hero);
        const navLinks = DOMUtils.byId(Constants.ELEMENTS.navLinks);

        if (heroElement) {
            const needsServer = typeof window !== 'undefined' && window.location.protocol === 'file:';
            heroElement.textContent = needsServer
                ? 'Unable to load portfolio content. If you opened this file directly, try using a local server (e.g. `npx serve`).'
                : 'Unable to load portfolio content. Please try refreshing the page.';
            DOMUtils.removeClass(heroElement, Constants.CLASSES.gradientText);
        }

        if (navLinks) {
            DOMUtils.clearChildren(navLinks);
        }
    };

    return {
        applyContent,
        displayContentError,
    };
})();
