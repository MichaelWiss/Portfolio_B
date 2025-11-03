/**
 * UIRenderer Module
 * Handles navigation, journey accordion, panels, and menu rendering.
 */

const UIRenderer = (() => {
    const normalizeWord = (word = '') => word.toLowerCase().replace(/[^a-z0-9]/g, '');

    const renderDocumentMeta = (site = {}) => {
        if (site.title) {
            document.title = site.title;
        }
    };

    const renderNavigation = (navigation = {}, site = {}) => {
        const navLogo = DOMUtils.byId(Constants.ELEMENTS.navLogo);
        const navLinks = DOMUtils.byId(Constants.ELEMENTS.navLinks);

        if (navLogo) {
            const fallbackTitle = site.title || document.title || '';
            navLogo.textContent = navigation.logo || fallbackTitle;
        }

        if (!navLinks) {
            return;
        }

        DOMUtils.clearChildren(navLinks);

        (navigation.links || []).forEach(link => {
            if (!link || !link.text) {
                return;
            }

            const anchor = DOMUtils.createElement('a', Constants.CLASSES.navLink, {
                href: link.href || '#',
                text: link.text,
            });

            const isResumeLink = normalizeWord(link.text) === 'resume'
                || (link.href && normalizeWord(link.href) === '#resume');

            if (isResumeLink) {
                DOMUtils.setData(anchor, Constants.DATA_ATTRIBUTES.resumeDrawer, 'true');
                DOMUtils.setAttribute(anchor, Constants.ARIA.role, 'button');
                DOMUtils.setAttribute(anchor, Constants.ARIA.controls, Constants.ELEMENTS.resumeDrawer);
                DOMUtils.setAttribute(anchor, Constants.ARIA.expanded, 'false');
            }

            DOMUtils.append(navLinks, anchor);
        });
    };

    const renderJourney = (journey = {}) => {
        const titleElement = DOMUtils.byId(Constants.ELEMENTS.journeyTitle);
        if (titleElement) {
            titleElement.textContent = journey.title || '';
        }

        const container = DOMUtils.byId(Constants.ELEMENTS.accordionContainer);
        if (!container) {
            return;
        }

        DOMUtils.clearChildren(container);

        (journey.items || []).forEach(item => {
            const accordionItem = createAccordionItem(item);
            DOMUtils.append(container, accordionItem);
        });
    };

    const createAccordionItem = item => {
        const accordionItem = DOMUtils.createElement('div', Constants.CLASSES.accordionItem);

        const header = DOMUtils.createElement('div', Constants.CLASSES.accordionHeader);
        const title = DOMUtils.createElement('div', 'accordion-title', { text: item?.title || '' });
        const icon = DOMUtils.createElement('div', 'accordion-icon', { text: '+' });

        DOMUtils.append(header, title);
        DOMUtils.append(header, icon);

        const content = DOMUtils.createElement('div', Constants.CLASSES.accordionContent);
        const body = DOMUtils.createElement('div', 'accordion-body', { text: item?.content || '' });
        DOMUtils.append(content, body);

        DOMUtils.append(accordionItem, header);
        DOMUtils.append(accordionItem, content);

        return accordionItem;
    };

    const renderPanels = (panels = []) => {
        const container = DOMUtils.byId(Constants.ELEMENTS.panelsSection);
        if (!container) {
            return;
        }

        DOMUtils.clearChildren(container);

        panels.forEach((panel, index) => {
            const elementId = panel?.id || `panel-${index + 1}`;
            const panelElement = DOMUtils.createElement('div', Constants.CLASSES.panel);
            panelElement.id = elementId;

            if (panel?.background) {
                DOMUtils.setInlineStyles(panelElement, { backgroundColor: panel.background });
            }

            if (panel?.theme === 'dark') {
                DOMUtils.addClass(panelElement, Constants.CLASSES.panelDark);
            }

            const number = DOMUtils.createElement('div', 'panel-number', {
                text: panel?.number || `0${index + 1}`,
            });
            const divider = DOMUtils.createElement('div', 'vertical-line');

            const content = DOMUtils.createElement('div', 'panel-content');
            const heading = DOMUtils.createElement('h1', 'panel-title', { text: panel?.title || '' });
            const description = DOMUtils.createElement('p', 'panel-description', { text: panel?.description || '' });

            DOMUtils.append(content, heading);
            DOMUtils.append(content, description);

            DOMUtils.append(panelElement, number);
            DOMUtils.append(panelElement, divider);
            DOMUtils.append(panelElement, content);

            DOMUtils.append(container, panelElement);
        });
    };

    const renderMenu = (menuItems = []) => {
        const container = DOMUtils.byId(Constants.ELEMENTS.menuContainer);
        if (!container) {
            return;
        }

        DOMUtils.clearChildren(container);

        menuItems.forEach((item, index) => {
            if (!item) {
                return;
            }

            const pageKey = item.id || `menu-item-${index}`;
            const menuItem = DOMUtils.createElement('div', Constants.CLASSES.menuItem);
            DOMUtils.addClass(menuItem, pageKey);
            DOMUtils.setData(menuItem, Constants.DATA_ATTRIBUTES.page, pageKey);

            if (item.background) {
                DOMUtils.setInlineStyles(menuItem, { backgroundColor: item.background });
            }

            const arrowIcon = createArrowIcon('menu-arrow');
            DOMUtils.append(menuItem, arrowIcon);

            const title = DOMUtils.createElement('span', '', { text: item.title || '' });
            DOMUtils.append(menuItem, title);

            const detailPage = DOMUtils.createElement('div', Constants.CLASSES.detailPage);
            DOMUtils.addClass(detailPage, pageKey);
            detailPage.id = `page-${pageKey}`;

            if (item.background) {
                DOMUtils.setInlineStyles(detailPage, { backgroundColor: item.background });
            }

            const detailContent = DOMUtils.createElement('div', Constants.CLASSES.detailContent);
            const closeButton = DOMUtils.createElement('button', Constants.CLASSES.closeBtn, { text: '✕ CLOSE' });
            DOMUtils.setData(closeButton, Constants.DATA_ATTRIBUTES.closePage, pageKey);

            const heading = DOMUtils.createElement('h1', '', { text: item.content?.title || item.title || '' });
            const paragraph = DOMUtils.createElement('p', '', { text: item.content?.text || '' });

            DOMUtils.append(detailContent, closeButton);
            DOMUtils.append(detailContent, heading);
            DOMUtils.append(detailContent, paragraph);

            DOMUtils.append(detailPage, detailContent);

            DOMUtils.append(container, menuItem);
            DOMUtils.append(container, detailPage);
        });
    };

    const createArrowIcon = (additionalClass = '') => {
        const svg = DOMUtils.createSVG('svg', {
            viewBox: '0 0 16 16',
            width: '24',
            height: '24',
            'aria-hidden': 'true',
            focusable: 'false',
        });

        DOMUtils.addClass(svg, Constants.CLASSES.arrowIcon);
        if (additionalClass) {
            DOMUtils.addClass(svg, additionalClass);
        }

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

    return {
        renderDocumentMeta,
        renderNavigation,
        renderJourney,
        renderPanels,
        renderMenu,
    };
})();

