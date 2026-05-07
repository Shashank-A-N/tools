/**
 * VideoPlayer.js
 * 
 * Wrapper around the HTMLVideoElement. 
 * Handles loading, playback control, and events.
 * Decouples the DOM video element from the rest of the app logic.
 */

import { bus } from './EventBus.js';
import { store } from './StateManager.js';

export class VideoPlayer {
    constructor() {
        this.video = document.createElement('video');
        this.video.crossOrigin = 'anonymous'; // Enable CORS if needed
        this.video.preload = 'auto';
        this.video.muted = false; // We might want to unmute for preview
        this.video.volume = 1;

        // Hide standard controls, we will build our own
        this.video.controls = false;

        this._bindEvents();
        this._setupBusListeners();
    }

    /**
     * Bind internal video events to the EventBus.
     */
    _bindEvents() {
        this.video.addEventListener('loadedmetadata', () => {
            store.setState({
                video: {
                    ...store.getState().video,
                    duration: this.video.duration,
                    width: this.video.videoWidth,
                    height: this.video.videoHeight
                }
            }, 'Video Loaded');
            bus.emit('videoLoaded', this.video);
        });

        this.video.addEventListener('timeupdate', () => {
            // Avoid spamming state updates for every frame, but maybe necessary for UI sliders
            // We can throttle this in the UI component if needed.
            // For now, let's just emit an event directly to avoid StateManager overhead for *every* frame
            bus.emit('timeUpdate', this.video.currentTime);
        });

        this.video.addEventListener('play', () => {
            store.setState({ video: { ...store.getState().video, isPlaying: true } });
            bus.emit('playbackStatus', 'playing');
        });

        this.video.addEventListener('pause', () => {
            store.setState({ video: { ...store.getState().video, isPlaying: false } });
            bus.emit('playbackStatus', 'paused');
        });

        this.video.addEventListener('ended', () => {
            store.setState({ video: { ...store.getState().video, isPlaying: false } });
            bus.emit('playbackStatus', 'ended');
        });

        this.video.addEventListener('error', (e) => {
            console.error('Video Error:', e);
            bus.emit('error', 'Failed to load video.');
        });
    }

    /**
     * Setup listeners for external commands via EventBus.
     */
    _setupBusListeners() {
        bus.on('cmd:loadVideo', (file) => this.loadVideo(file));
        bus.on('cmd:play', () => this.play());
        bus.on('cmd:pause', () => this.pause());
        bus.on('cmd:togglePlay', () => this.togglePlay());
        bus.on('cmd:seek', (time) => this.seek(time));
        bus.on('cmd:setVolume', (vol) => this.setVolume(vol));
    }

    /**
     * Load a video file.
     * @param {File} file 
     */
    async loadVideo(file) {
        if (this.video.src) {
            URL.revokeObjectURL(this.video.src);
        }
        const url = URL.createObjectURL(file);
        this.video.src = url;

        // Update State
        store.setState({
            video: {
                ...store.getState().video,
                src: url
            }
        }, 'Video Source Set');

        this.video.load();
    }

    play() {
        this.video.play().catch(e => console.error("Play failed:", e));
    }

    pause() {
        this.video.pause();
    }

    togglePlay() {
        if (this.video.paused) this.play();
        else this.pause();
    }

    seek(time) {
        if (isFinite(time)) {
            this.video.currentTime = time;
        }
    }

    setVolume(volume) {
        this.video.volume = Math.max(0, Math.min(1, volume));
        store.setState({ video: { ...store.getState().video, volume: this.video.volume } });
    }

    /**
     * Get the raw video element (for Canvas drawing).
     * @returns {HTMLVideoElement}
     */
    getElement() {
        return this.video;
    }
}
