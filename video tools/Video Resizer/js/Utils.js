/**
 * Utils.js
 * Helper functions for Video Resizer.
 */

export const Utils = {
    /**
     * Clamp a value between min and max.
     */
    clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    },

    /**
     * Format seconds into MM:SS.
     */
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(m)}:${pad(s)}`;
    },

    /**
     * Debounce a function.
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Clean log to console.
     */
    log(msg) {
        console.log(`[ShadowResize] ${msg}`);
    },

    /**
     * Calculate aspect ratio from width/height.
     */
    calculateAspectRatio(w, h) {
        if (!h) return 0;
        return w / h;
    },

    /**
     * Download a blob as a file.
     */
    downloadBlob(blob, filename) {
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;

            // Required for Firefox
            document.body.appendChild(a);

            // Standard click
            a.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (e) {
            console.error('Download failed:', e);
            alert('Download failed. Check extensions.');
        }
    }
};
