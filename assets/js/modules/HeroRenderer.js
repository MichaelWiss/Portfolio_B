/**
 * HeroRenderer Module
 * Handles hero text animation and marquee population.
 */

const HeroRenderer = (() => {
    const normalizeWord = (word = '') => word.toLowerCase().replace(/[^a-z0-9]/g, '');

    const renderHeroText = (heroText = '', sparkleWords = []) => {
        const heroElement = DOMUtils.byId(Constants.ELEMENTS.hero);
        if (!heroElement) {
            console.warn('Hero element not found');
            return;
        }

        DOMUtils.clearChildren(heroElement);

        if (!heroText) {
            heroElement.textContent = 'Content coming soon.';
            return;
        }

        const sparkleSet = new Set(
            sparkleWords
                .filter(Boolean)
                .map(normalizeWord)
        );

        const words = heroText.split(/\s+/).filter(Boolean);

        words.forEach((word, index) => {
            const normalized = normalizeWord(word);
            const animationDelay = `${index * 0.08}s`;

            const wordSpan = DOMUtils.createElement('span', 'word', { text: word });
            wordSpan.style.animationDelay = animationDelay;
            DOMUtils.append(heroElement, wordSpan);

            if (sparkleSet.has(normalized)) {
                const sparkleWrapper = DOMUtils.createElement('span', Constants.CLASSES.sparkle);
                const sparkleIcon = createSparkleIcon(animationDelay);
                DOMUtils.append(sparkleWrapper, sparkleIcon);
                DOMUtils.append(heroElement, sparkleWrapper);
            }

            heroElement.appendChild(document.createTextNode(' '));
        });
    };

    const renderNameMarquee = (siteTitle = '') => {
        const marquee = DOMUtils.byId(Constants.ELEMENTS.nameMarquee);
        if (!marquee) {
            return;
        }

        DOMUtils.clearChildren(marquee);

        const label = (siteTitle || 'Michael Wiss').toUpperCase();
        const repeated = `${Array(8).fill(label).join(' • ')} • `;

        for (let index = 0; index < 2; index += 1) {
            const textBlock = DOMUtils.createElement('div', 'blue-marquee-text', { text: repeated });
            DOMUtils.append(marquee, textBlock);
        }
    };

    const createSparkleIcon = (animationDelay = '0s') => {
        const svg = DOMUtils.createSVG('svg', {
            viewBox: '0 0 64 64',
            xmlns: Constants.SVG_NS,
        });

        DOMUtils.addClass(svg, Constants.CLASSES.sparkleIcon);
        svg.style.setProperty('--sparkle-offset', animationDelay);

        const gradientId = `sparkle-gradient-${State.ui.incrementSparkleGradient()}`;
        const defs = DOMUtils.createSVG('defs');
        const gradient = DOMUtils.createSVG('linearGradient', {
            id: gradientId,
            x1: '0%',
            y1: '0%',
            x2: '100%',
            y2: '100%',
        });

        const stopStart = DOMUtils.createSVG('stop', { offset: '0%' });
        DOMUtils.addClass(stopStart, Constants.CLASSES.sparkleGradientStop, Constants.CLASSES.sparkleGradientStopStart);
        stopStart.style.animationDelay = animationDelay;

        const stopEnd = DOMUtils.createSVG('stop', { offset: '100%' });
        DOMUtils.addClass(stopEnd, Constants.CLASSES.sparkleGradientStop, Constants.CLASSES.sparkleGradientStopEnd);
        stopEnd.style.animationDelay = animationDelay;

        DOMUtils.append(gradient, stopStart);
        DOMUtils.append(gradient, stopEnd);
        DOMUtils.append(defs, gradient);
        DOMUtils.append(svg, defs);

        Constants.SPARKLE_PATHS.forEach(pathData => {
            const path = DOMUtils.createSVG('path', {
                d: pathData,
                fill: `url(#${gradientId})`,
            });
            DOMUtils.append(svg, path);
        });

        return svg;
    };

    const render = (site = {}) => {
        const heroText = site.heroText || site.title || '';
        const sparkleWords = site.heroSparkleWords || [];
        renderHeroText(heroText, sparkleWords);
        renderNameMarquee(site.title);
    };

    return {
        render,
    };
})();
