/**
 * RenderLoop.js
 * Draws video frame to canvas with filters applied.
 */
import { store } from './StateManager.js';
import { FilterEngine } from './FilterEngine.js';

export class RenderLoop {
    constructor(videoPlayer) {
        this.player = videoPlayer;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.isRunning = false;
        this.animationId = null;
    }

    getCanvas() {
        return this.canvas;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.loop();
    }

    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
    }

    loop() {
        if (!this.isRunning) return;
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    }

    draw() {
        const video = this.player.getElement();
        if (video.readyState < 2) return;

        const activeVideo = store.getActiveVideo();
        if (!activeVideo) return;

        // Sync canvas size
        if (this.canvas.width !== activeVideo.width || this.canvas.height !== activeVideo.height) {
            this.canvas.width = activeVideo.width || 1280;
            this.canvas.height = activeVideo.height || 720;
        }

        // Apply Filters
        const filterStr = FilterEngine.buildFilterString(activeVideo.filters);
        this.ctx.filter = filterStr;

        // Draw Frame
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
    }
}
