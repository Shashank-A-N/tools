/**
 * FilterEngine.js
 * Manages filter definitions, presets, and CSS generation.
 */

export const FilterEngine = {

    getDefaults() {
        return {
            brightness: 100, // %
            contrast: 100,   // %
            saturate: 100,   // %
            hueRotate: 0,    // deg
            grayscale: 0,    // %
            sepia: 0,        // %
            invert: 0,       // %
            blur: 0          // px
        };
    },

    getPresets() {
        return {
            normal: { ...this.getDefaults() },
            grayscale: { ...this.getDefaults(), grayscale: 100 },
            sepia: { ...this.getDefaults(), sepia: 100 },
            vintage: { ...this.getDefaults(), sepia: 50, contrast: 120, brightness: 90, saturate: 85 },
            noir: { ...this.getDefaults(), grayscale: 100, contrast: 150, brightness: 90 },
            dramatic: { ...this.getDefaults(), contrast: 140, saturate: 120 },
            cyberpunk: { ...this.getDefaults(), contrast: 120, saturate: 150, hueRotate: 20 },
            alien: { ...this.getDefaults(), hueRotate: 90, contrast: 120 },
            nightvision: { ...this.getDefaults(), sepia: 0, hueRotate: 100, saturate: 50, brightness: 120, contrast: 110 }
        };
    },

    /**
     * Generates a CSS filter string from the filter state object.
     * @param {Object} filters 
     * @returns {string} CSS filter string
     */
    buildFilterString(filters) {
        if (!filters) {
            console.warn('[FilterEngine] Filters object is missing', filters);
            return 'none';
        }
        return `
            brightness(${filters.brightness}%) 
            contrast(${filters.contrast}%) 
            saturate(${filters.saturate}%) 
            hue-rotate(${filters.hueRotate}deg) 
            grayscale(${filters.grayscale}%) 
            sepia(${filters.sepia}%) 
            invert(${filters.invert}%) 
            blur(${filters.blur}px)
        `.trim();
    }
};
