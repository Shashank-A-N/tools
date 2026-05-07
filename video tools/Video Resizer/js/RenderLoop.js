/**
 * RenderLoop.js
 * Draws video frame to canvas.
 */
import { store } from './StateManager.js';

export class RenderLoop {
    constructor(videoPlayer) {
        this.player = videoPlayer;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimize for video
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
        if (video.readyState < 2) return; // Not enough data

        // Set canvas size to TARGET resolution (Resizing happens here!)
        const state = store.getState();
        const { targetWidth, targetHeight } = state.resize;

        // Resize canvas if needed
        if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
            this.canvas.width = targetWidth;
            this.canvas.height = targetHeight;
        }

        // Draw Video Scaled
        // For now, simple stretch to fill. Later we can add 'fit' modes.
        this.ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    }
}
