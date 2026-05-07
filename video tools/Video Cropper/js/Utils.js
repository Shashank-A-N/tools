/**
 * Utils.js
 * 
 * Collection of helper functions for the Video Cropper application.
 * content: Math helpers, Time formatting, DOM utilities, Optimization.
 */

export const Utils = {

    /**
     * Clamp a value between a min and max.
     * @param {number} val - Value to clamp.
     * @param {number} min - Minimum value.
     * @param {number} max - Maximum value.
     * @returns {number} - Clamped value.
     */
    clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    },

    /**
     * Linear interpolation between two values.
     * @param {number} start - Start value.
     * @param {number} end - End value.
     * @param {number} amt - Amount to interpolate (0-1).
     * @returns {number} - Interpolated value.
     */
    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    },

    /**
     * Format seconds into HH:MM:SS or MM:SS.
     * @param {number} seconds - Time in seconds.
     * @returns {string} - Formatted time string.
     */
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return "00:00";

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);

        const pad = (num) => num.toString().padStart(2, '0');

        if (h > 0) {
            return `${pad(h)}:${pad(m)}:${pad(s)}`;
        }
        return `${pad(m)}:${pad(s)}`;
    },

    /**
     * Format bytes into human-readable string.
     * @param {number} bytes - Size in bytes.
     * @param {number} decimals - Number of decimal places.
     * @returns {string} - Formatted size (e.g., "1.5 MB").
     */
    formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    /**
     * Generate a UUID v4.
     * @returns {string} - UUID string.
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Deep clone an object.
     * @param {Object} obj - Object to clone.
     * @returns {Object} - Cloned object.
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Debounce a function.
     * @param {Function} func - Function to debounce.
     * @param {number} wait - Wait time in ms.
     * @returns {Function} - Debounced function.
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
     * Throttle a function.
     * @param {Function} func - Function to throttle.
     * @param {number} limit - Limit in ms.
     * @returns {Function} - Throttled function.
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },

    /**
     * Download a Blob as a file.
     * @param {Blob} blob - The blob to download.
     * @param {string} filename - The filename.
     */
    downloadBlob(blob, filename) {
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            a.target = '_blank'; // Compatibility helpful for some extensions
            document.body.appendChild(a);

            // Programmatic click
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            a.dispatchEvent(clickEvent);

            // Cleanup
            setTimeout(() => {
                // Check if still in DOM
                if (document.body.contains(a)) {
                    document.body.removeChild(a);
                }
                URL.revokeObjectURL(url);
            }, 100);
        } catch (e) {
            console.error('Download failed:', e);
            alert('Download failed. Please check if a download manager extension is blocking it.');
        }
    },

    /**
     * Get file extension from filename.
     * @param {string} filename 
     * @returns {string} - Extension (e.g., "mp4").
     */
    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    },

    /**
     * Log to visual debugger.
     * @param {string} msg 
     */
    log(msg) {
        console.log(`[ShadowCrop] ${msg}`);
    }
};
