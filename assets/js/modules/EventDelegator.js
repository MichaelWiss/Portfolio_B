/**
 * EventDelegator Module
 * Centralizes high-level click and keyboard handlers.
 */

class EventDelegator {
    constructor({ modalManager }) {
        this.modalManager = modalManager;
        this.isInitialized = false;
        this.clickHandler = null;
        this.keydownHandler = null;
    }

    init() {
        if (this.isInitialized) {
            return;
        }

        this.clickHandler = event => this.handleDocumentClick(event);
        this.keydownHandler = event => this.handleKeydown(event);

        document.addEventListener('click', this.clickHandler);
        document.addEventListener('keydown', this.keydownHandler);

        this.isInitialized = true;
    }

    destroy() {
        if (!this.isInitialized) {
            return;
        }

        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }

        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
        }

        this.isInitialized = false;
    }

    handleDocumentClick(event) {
        const target = event.target;

        const projectCard = DOMUtils.closest(target, `.${Constants.CLASSES.grateCard}`);
        if (projectCard) {
            this.openProjectModal(projectCard);
            return;
        }

        const menuItem = DOMUtils.closest(target, `.${Constants.CLASSES.menuItem}`);
        if (menuItem) {
            this.activateMenuItem(menuItem);
            return;
        }

        const closeButton = DOMUtils.closest(target, `.${Constants.CLASSES.closeBtn}`);
        if (closeButton) {
            this.closeDetailPage(DOMUtils.getData(closeButton, Constants.DATA_ATTRIBUTES.closePage));
            return;
        }

        const accordionHeader = DOMUtils.closest(target, `.${Constants.CLASSES.accordionHeader}`);
        if (accordionHeader) {
            this.toggleAccordionItem(accordionHeader);
            return;
        }

        if (
            DOMUtils.matches(target, `#${Constants.ELEMENTS.closeModalBtn}`)
            || DOMUtils.closest(target, '.close-modal-btn')
        ) {
            this.modalManager.close();
            return;
        }

        if (DOMUtils.matches(target, `#${Constants.ELEMENTS.modal}`)) {
            this.modalManager.close();
        }
    }

    handleKeydown(event) {
        if (event.key === 'Escape') {
            try {
                this.modalManager.close();
            } catch (error) {
                console.error('Error closing modal on Escape:', error);
            }
        }
    }

    openProjectModal(projectCard) {
        const modalType = DOMUtils.getData(projectCard, Constants.DATA_ATTRIBUTES.modalType);
        if (!modalType) {
            return;
        }

        // On mobile, keep the gallery experience without opening the video modal.
        const isMobileView = typeof State !== 'undefined'
            && State.projects
            && State.projects.isMobileView;

        if (isMobileView) {
            return;
        }

        const modalTitle = DOMUtils.getData(projectCard, Constants.DATA_ATTRIBUTES.modalTitle);
        this.modalManager.open(modalTitle, modalType);
    }

    activateMenuItem(menuItem) {
        const pageId = DOMUtils.getData(menuItem, Constants.DATA_ATTRIBUTES.page);
        if (!pageId) {
            console.warn('Menu item missing data-page attribute');
            return;
        }

        DOMUtils.queryAll(`.${Constants.CLASSES.menuItem}`).forEach(item => {
            DOMUtils.removeClass(item, 'active');
        });

        DOMUtils.queryAll(`.${Constants.CLASSES.detailPage}`).forEach(page => {
            DOMUtils.removeClass(page, 'active');
        });

        DOMUtils.addClass(menuItem, 'active');

        const detailPage = DOMUtils.byId(`page-${pageId}`);
        if (detailPage) {
            DOMUtils.addClass(detailPage, 'active');
        } else {
            console.warn(`Detail page not found: ${pageId}`);
        }
    }

    closeDetailPage(pageId) {
        if (!pageId) {
            return;
        }

        const detailPage = DOMUtils.byId(`page-${pageId}`);
        if (detailPage) {
            DOMUtils.removeClass(detailPage, 'active');
        }

        const menuItem = DOMUtils.query(`.${Constants.CLASSES.menuItem}[data-${Constants.DATA_ATTRIBUTES.page}="${pageId}"]`);
        if (menuItem) {
            DOMUtils.removeClass(menuItem, 'active');
        }
    }

    toggleAccordionItem(header) {
        const item = DOMUtils.closest(header, `.${Constants.CLASSES.accordionItem}`);
        if (!item) {
            return;
        }

        const isActive = DOMUtils.hasClass(item, Constants.CLASSES.accordionActive);

        DOMUtils.queryAll(`.${Constants.CLASSES.accordionItem}`).forEach(accordionItem => {
            DOMUtils.removeClass(accordionItem, Constants.CLASSES.accordionActive);
        });

        if (!isActive) {
            DOMUtils.addClass(item, Constants.CLASSES.accordionActive);
        }
    }
}

