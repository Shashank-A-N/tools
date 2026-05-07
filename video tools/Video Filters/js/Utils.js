/**
 * Utils.js
 * Helper functions for Video Filters.
 */

export const Utils = {
    clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    },

    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(m)}:${pad(s)}`;
    },

    debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    downloadBlob(blob, filename) {
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (e) {
            console.error('Download failed:', e);
            alert('Download failed.');
        }
    }
};
