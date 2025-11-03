/**
 * ContentLoader Module
 * Encapsulates all content data fetching, parsing, and fallback logic
 * Single responsibility: manage portfolio data lifecycle
 */

const ContentLoader = (() => {
    /**
     * Load content data with appropriate fallbacks
     */
    const loadData = async () => {
        const isFileProtocol = typeof window !== 'undefined'
            && window.location
            && window.location.protocol === 'file:';

        if (isFileProtocol) {
            const fallback = await loadFallback();
            if (fallback) {
                return fallback;
            }

            throw new Error('Inline content data is unavailable while running via file:// protocol.');
        }

        try {
            return await fetchJson(Constants.CONTENT_PATH);
        } catch (primaryError) {
            console.warn('Primary content fetch failed, attempting fallbacks:', primaryError);

            const fallback = await loadFallback();
            if (fallback) {
                return fallback;
            }

            throw primaryError;
        }
    };

    /**
     * Load fallback content from inline data or XHR
     */
    const loadFallback = async () => {
        const inlineData = readInlineData();
        if (inlineData) {
            verifyInlineDataSync(inlineData);
            return inlineData;
        }

        if (window.location.protocol === 'file:') {
            try {
                return await loadViaXHR();
            } catch (xhrError) {
                console.warn('XHR fallback failed:', xhrError);
            }
        }

        return null;
    };

    /**
     * Fetch JSON from URL
     */
    const fetchJson = async (url) => {
        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`Failed to load content data (${response.status})`);
        }

        return response.json();
    };

    /**
     * Read inline content data from script tag
     */
    const readInlineData = () => {
        try {
            const inline = DOMUtils.byId(Constants.ELEMENTS.portfolioContentData);
            if (inline && inline.textContent) {
                return JSON.parse(inline.textContent);
            }
        } catch (error) {
            console.warn('Inline content data parse failed:', error);
        }
        return null;
    };

    /**
     * Load content via XHR (fallback for file:// protocol)
     */
    const loadViaXHR = () => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.overrideMimeType('application/json');
            xhr.open('GET', Constants.CONTENT_PATH, true);

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
    };

    /**
     * Verify inline content matches external source
     */
    const verifyInlineDataSync = (inlineData) => {
        if (!inlineData || window.location.protocol !== 'file:') {
            return;
        }

        (async () => {
            try {
                const externalData = await loadViaXHR();
                if (externalData && !dataPayloadsMatch(inlineData, externalData)) {
                    console.warn(
                        'Inline portfolio JSON differs from assets/data/content.json. ' +
                        'Update HTML to keep both sources in sync.'
                    );
                }
            } catch (error) {
                console.warn('Content sync check skipped (unable to read assets/data/content.json):', error);
            }
        })();
    };

    /**
     * Check if two data payloads match
     */
    const dataPayloadsMatch = (a, b) => {
        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return false;
        }
    };

    return {
        loadData,
        loadFallback,
        fetchJson,
        readInlineData,
        loadViaXHR,
        verifyInlineDataSync,
        dataPayloadsMatch,
    };
})();
