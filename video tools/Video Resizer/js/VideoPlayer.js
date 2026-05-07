/**
 * VideoPlayer.js
 * Handles video loading and playback.
 */
import { bus } from './EventBus.js';
import { store } from './StateManager.js';

export class VideoPlayer {
    constructor() {
        this.video = document.createElement('video');
        this.video.crossOrigin = 'anonymous';
        this.video.preload = 'auto';
        this.video.muted = false; // Muted for preview? Maybe.
        this.video.volume = 1;

        this._bindEvents();
        this._setupBusListeners();
    }

    _bindEvents() {
        this.video.addEventListener('loadedmetadata', () => {
            store.setState({
                video: {
                    ...store.state.video,
                    duration: this.video.duration,
                    originalWidth: this.video.videoWidth,
                    originalHeight: this.video.videoHeight
                }
            }, 'Video Loaded Metadata');
            bus.emit('videoLoaded', this.video);
        });

        this.video.addEventListener('timeupdate', () => {
            // Bus emission for UI time updates
            if (!this.video.paused) {
                bus.emit('timeUpdate', this.video.currentTime);
            }
        });

        this.video.addEventListener('play', () => bus.emit('playbackStatus', 'playing'));
        this.video.addEventListener('pause', () => bus.emit('playbackStatus', 'paused'));
        this.video.addEventListener('ended', () => bus.emit('playbackStatus', 'ended'));
        this.video.addEventListener('error', (e) => {
            console.error("Video Error:", e);
            alert("Error loading video.");
        });
    }

    _setupBusListeners() {
        bus.on('cmd:loadVideo', (file) => this.loadVideo(file));
        bus.on('cmd:play', () => this.play());
        bus.on('cmd:pause', () => this.pause());
        bus.on('cmd:togglePlay', () => this.togglePlay());
        bus.on('cmd:seek', (time) => {
            if (isFinite(time)) this.video.currentTime = time;
        });
    }

    async loadVideo(file) {
        if (this.video.src) URL.revokeObjectURL(this.video.src);
        const url = URL.createObjectURL(file);
        this.video.src = url;
        store.setState({ video: { ...store.state.video, src: url } });
        this.video.load();
    }

    play() { this.video.play().catch(console.error); }
    pause() { this.video.pause(); }
    togglePlay() { this.video.paused ? this.play() : this.pause(); }

    getElement() { return this.video; }
}
