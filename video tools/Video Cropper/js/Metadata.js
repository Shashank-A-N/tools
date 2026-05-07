/**
 * Metadata.js
 * 
 * Extracts and formats metadata for the UI.
 */

import { Utils } from './Utils.js';

export const Metadata = {
    /**
     * Extract full metadata from a video file.
     * @param {File} file 
     * @returns {Object}
     */
    extract(file) {
        return {
            name: file.name,
            size: Utils.formatBytes(file.size),
            type: file.type,
            lastModified: new Date(file.lastModified).toLocaleString(),
            extension: Utils.getFileExtension(file.name)
        };
    }
};
