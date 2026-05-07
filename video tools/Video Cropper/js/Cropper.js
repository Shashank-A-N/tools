/**
 * Cropper.js
 * 
 * Logic for the interactive crop overlay.
 * Handles resizing, movement, and aspect ratio constraints.
 * Does NOT handle the DOM directly (UI component does that), 
 * but calculates the logic.
 */

import { Utils } from './Utils.js';
import { store } from './StateManager.js';
import { bus } from './EventBus.js';

export class Cropper {
    constructor() {
        // Initial defaults
        this.containerW = 0;
        this.containerH = 0;

        this._setupBusListeners();
    }

    _setupBusListeners() {
        bus.on('cmd:updateCrop', (data) => this.setCrop(data));
        bus.on('cmd:setRatio', (ratio) => this.setRatio(ratio));
    }

    /**
     * Set the container dimensions (the video display area).
     * @param {number} width 
     * @param {number} height 
     */
    setContainerSize(width, height) {
        this.containerW = width;
        this.containerH = height;
    }

    /**
     * Set crop manually (from inputs).
     * @param {Object} data - { x, y, width, height }
     */
    setCrop({ x, y, width, height }) {
        const state = store.getState();
        const video = state.video;

        // Basic clamping
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (width > video.width) width = video.width;
        if (height > video.height) height = video.height;
        if (x + width > video.width) x = video.width - width;
        if (y + height > video.height) y = video.height - height;

        store.setState({
            crop: { ...state.crop, x, y, width, height }
        }, 'Manual Crop Update');
    }

    /**
     * Set crop based on a preset ratio.
     * @param {number} ratio - Width / Height (e.g., 16/9 = 1.777)
     */
    setRatio(ratio) {
        // Logic to calculate new crop box centered in the video
        const state = store.getState().video;
        if (!state.width || !state.height) return;

        let newW = state.width;
        let newH = state.width / ratio;

        if (newH > state.height) {
            newH = state.height;
            newW = state.height * ratio;
        }

        const newX = (state.width - newW) / 2;
        const newY = (state.height - newH) / 2;

        store.setState({
            crop: {
                x: Math.round(newX),
                y: Math.round(newY),
                width: Math.round(newW),
                height: Math.round(newH),
                aspectRatio: ratio
            }
        }, `Set Ratio ${ratio}`);
    }

    /**
     * Logic for dragging the crop box.
     * @param {number} dx - Delta X in pixels.
     * @param {number} dy - Delta Y in pixels.
     */
    move(dx, dy) {
        const state = store.getState();
        const crop = state.crop;
        const video = state.video;

        let newX = crop.x + dx;
        let newY = crop.y + dy;

        // Constrain to boundaries
        newX = Utils.clamp(newX, 0, video.width - crop.width);
        newY = Utils.clamp(newY, 0, video.height - crop.height);

        store.setState({
            crop: { ...crop, x: newX, y: newY }
        }, 'Move Crop');
    }

    /**
     * Logic for resizing the crop box.
     * @param {string} handle - 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
     * @param {number} dx 
     * @param {number} dy 
     */
    resize(handle, dx, dy) {
        const state = store.getState();
        let { x, y, width: w, height: h, aspectRatio } = state.crop;
        const video = state.video;

        // Min dimensions
        const minSize = 50;

        // Logic based on handle
        if (handle.includes('e')) {
            w += dx;
            if (aspectRatio) h = w / aspectRatio;
        }
        if (handle.includes('w')) {
            w -= dx;
            x += dx;
            if (aspectRatio) {
                // If aspect ratio locked, changing width changes height too.
                // But dragging Left ('w') means expanding left.
                // This is complex for Aspect Ratio + 'w' handle.
                // Simplified: recalculate height based on width, but center y? or fix top?
                // Standard behavior: fix opposite corner.
                h = w / aspectRatio;
            }
        }
        if (handle.includes('s')) {
            h += dy;
            if (aspectRatio) w = h * aspectRatio;
        }
        if (handle.includes('n')) {
            h -= dy;
            y += dy;
            if (aspectRatio) w = h * aspectRatio;
        }

        // Constraints
        if (w < minSize) w = minSize;
        if (h < minSize) h = minSize;

        // Boundary Checks (Right/Bottom)
        if (x + w > video.width) w = video.width - x;
        if (y + h > video.height) h = video.height - y;

        // Boundary Checks (Left/Top)
        if (x < 0) {
            w += x; // Reduce width by the amount we went past 0
            x = 0;
        }
        if (y < 0) {
            h += y;
            y = 0;
        }

        // Apply
        store.setState({
            crop: { ...state.crop, x, y, width: w, height: h }
        }, 'Resize Crop');
    }
}
