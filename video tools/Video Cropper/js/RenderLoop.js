/**
 * RenderLoop.js
 * 
 * Manages the requestAnimationFrame loop.
 * Draws the current video frame to a canvas, applying filters and crop transformations.
 * This canvas is the visual output for the user and the source for the MediaRecorder.
 */

import { bus } from './EventBus.js';
import { store } from './StateManager.js';

export class RenderLoop {
    constructor(videoPlayer) {
        this.videoPlayer = videoPlayer;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false, willReadFrequently: true });
        this.isRunning = false;
        this._loop = this._loop.bind(this);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this._loop();
        }
    }

    stop() {
        this.isRunning = false;
    }

    /**
     * The main rendering loop.
     */
    _loop() {
        if (!this.isRunning) return;

        this._draw();
        requestAnimationFrame(this._loop);
    }

    /**
     * Draw the current frame with filters.
     */
    _draw() {
        const video = this.videoPlayer.getElement();

        // Don't draw if video isn't ready
        if (video.readyState < 2) return;

        // Sync canvas size to video size if changed
        if (this.canvas.width !== video.videoWidth || this.canvas.height !== video.videoHeight) {
            this.canvas.width = video.videoWidth;
            this.canvas.height = video.videoHeight;
        }

        const state = store.getState();
        const filters = state.filters || {};

        // Apply filters
        // Using CSS filter string for Canvas Context is the most performant way
        // formatting: "brightness(100%) contrast(100%) ..."
        const filterString = `
            brightness(${filters.brightness}%) 
            contrast(${filters.contrast}%) 
            saturate(${filters.saturation}%) 
            hue-rotate(${filters.hue}deg)
            blur(${filters.blur}px)
            grayscale(${filters.grayscale}%)
            sepia(${filters.sepia}%)
            invert(${filters.invert}%)
        `;

        this.ctx.filter = filterString.trim();

        // Draw the full frame
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

        // We do *not* draw the crop rectangle here inside the canvas data. 
        // The crop rectangle is a UI overlay ON TOP of this canvas.
        // However, if we were "previewing" the crop (showing only the cropped part), 
        // we would modify this. 
        // For the Editor Mode: We show full video.
        // For Export: We will use a *separate* render process or modify this one to draw only the cropped region.
    }

    /**
     * Get the canvas element.
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Get a specific cropped stream/blob (for export).
     * This might be moved to ExportModule, but helper can be here.
     */
    getStream(fps = 30) {
        return this.canvas.captureStream(fps);
    }
}
