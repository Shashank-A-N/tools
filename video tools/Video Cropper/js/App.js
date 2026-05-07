/**
 * App.js
 * 
 * Main Application Controller.
 * Orchestrates all modules and manages the application lifecycle.
 */

import { bus } from './EventBus.js';
import { store } from './StateManager.js';
import { Utils } from './Utils.js';
import { VideoPlayer } from './VideoPlayer.js';
import { RenderLoop } from './RenderLoop.js';
import { Recorder } from './Recorder.js';
import { Cropper } from './Cropper.js';
import { Filters } from './Filters.js';
import { Metadata } from './Metadata.js';
import { LayoutManager } from './LayoutManager.js';
import { Controls } from './Controls.js';

export class App {
    constructor() {
        // Initialize Core Modules
        this.player = new VideoPlayer();
        this.renderLoop = new RenderLoop(this.player);
        this.recorder = new Recorder();
        this.cropper = new Cropper();
        this.filters = new Filters();

        // Initialize UI Managers
        this.layout = new LayoutManager();
        this.controls = new Controls();

        // State for Preview
        this.currentExportBlob = null;

        this.dom = {
            landingView: document.getElementById('landing-view'),
            editorView: document.getElementById('editor-view'),
            landingFileInput: document.getElementById('landing-fileInput'),

            stage: document.getElementById('stage'),
            overlay: document.getElementById('crop-overlay'),

            // Side panel file input
            fileInput: document.getElementById('fileInput'),

            inputs: {
                x: document.getElementById('input-x'),
                y: document.getElementById('input-y'),
                w: document.getElementById('input-w'),
                h: document.getElementById('input-h')
            },
            timeCurrent: document.getElementById('time-current'),
            timeTotal: document.getElementById('time-total'),
            timeline: document.getElementById('timeline'),
            btnExport: document.getElementById('btn-export'),
            btnPlay: document.getElementById('btn-play-pause'),
            recIndicator: document.getElementById('recordingIndicator'),
            placeholder: document.getElementById('placeholder-msg'),
            btnBackHome: document.getElementById('btn-back-home'),

            // Preview Modal
            previewModal: document.getElementById('preview-modal'),
            previewContent: document.getElementById('preview-content'),
            previewVideo: document.getElementById('preview-video'),
            btnClosePreview: document.getElementById('btn-close-preview'),
            btnDiscard: document.getElementById('btn-discard'),
            btnSaveDisk: document.getElementById('btn-save-disk')
        };

        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEventBus();

        // Append Canvas
        const canvas = this.renderLoop.getCanvas();
        // Remove object-fit: contain to ensure 1:1 mouse mapping
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100%';
        canvas.style.display = 'block';
        this.dom.stage.appendChild(canvas);

        // Resize observer to keep overlay synced
        this.resizeObserver = new ResizeObserver(() => this.updateOverlayDOM());
        this.resizeObserver.observe(canvas);

        // Start Layout Manager
        this.layout.init();

        console.log('Video Cropper App Initialized');
    }

    setupDOM() {
        // Drag over landing area
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dom.landingView.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        this.dom.landingView.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                this.handleFileSelect({ target: { files: [file] } });
            }
        });

        // Landing Page File Input
        this.dom.landingFileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Editor Panel File Input
        this.dom.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Back to Home
        if (this.dom.btnBackHome) {
            this.dom.btnBackHome.addEventListener('click', () => {
                this.dom.editorView.classList.remove('opacity-100', 'pointer-events-auto');
                this.dom.editorView.classList.add('opacity-0', 'pointer-events-none');
                setTimeout(() => {
                    this.dom.landingView.style.display = 'flex';
                    setTimeout(() => this.dom.landingView.classList.remove('opacity-0'), 50);
                }, 500);
            });
        }

        // Timeline
        this.dom.timeline.addEventListener('input', (e) => {
            const pct = e.target.value;
            const duration = store.getState().video.duration;
            const time = (pct / 100) * duration;
            bus.emit('cmd:seek', time);
        });

        // Play/Pause
        this.dom.btnPlay.addEventListener('click', () => bus.emit('cmd:togglePlay'));

        // Export (Managed by inline onclick in HTML for safety, but we can keep listener too)
        this.dom.btnExport.addEventListener('click', () => this.handleExport());

        // Bind manual crop inputs
        const updateCropFromInput = Utils.debounce(() => {
            const x = parseFloat(this.dom.inputs.x.value) || 0;
            const y = parseFloat(this.dom.inputs.y.value) || 0;
            const w = parseFloat(this.dom.inputs.w.value) || 100;
            const h = parseFloat(this.dom.inputs.h.value) || 100;
            bus.emit('cmd:updateCrop', { x, y, width: w, height: h });
        }, 300);

        Object.values(this.dom.inputs).forEach(input => {
            input.addEventListener('input', updateCropFromInput);
        });

        // Aspect Ratios
        document.querySelectorAll('[data-ratio]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const r = parseFloat(e.target.dataset.ratio);
                bus.emit('cmd:setRatio', r);
            });
        });

        // Filters (Sliders)
        document.querySelectorAll('[data-filter]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const key = e.target.dataset.filter;
                const value = e.target.value;
                document.getElementById(`val-${key}`).textContent = value + (key === 'hue' ? '°' : '%');
                bus.emit('cmd:updateFilter', { key, value });
            });
        });

        // Presets
        document.getElementById('preset-select').addEventListener('change', (e) => {
            bus.emit('cmd:applyPreset', e.target.value);
        });

        // Undo/Redo
        document.getElementById('btn-undo').addEventListener('click', () => store.undo());
        document.getElementById('btn-redo').addEventListener('click', () => store.redo());

        // Crop Handles (Drag Logic)
        this.setupCropInteractions();

        // Preview Modal Handlers
        this.setupPreviewInteractions();
    }

    setupPreviewInteractions() {
        const closePreview = () => {
            this.dom.previewModal.classList.add('opacity-0');
            this.dom.previewContent.classList.add('scale-95');
            setTimeout(() => {
                this.dom.previewModal.classList.add('hidden');
                this.dom.previewVideo.src = '';
                this.currentExportBlob = null;
            }, 300);
        };

        this.dom.btnClosePreview.addEventListener('click', closePreview);
        this.dom.btnDiscard.addEventListener('click', closePreview);

        this.dom.btnSaveDisk.addEventListener('click', () => {
            if (this.currentExportBlob) {
                Utils.downloadBlob(this.currentExportBlob, 'cropped_video.webm');
                closePreview();
            }
        });
    }

    handleFileSelect(e) {
        try {
            console.log("File selection triggered");
            const file = e.target.files[0];
            if (file) {
                console.log(`File selected: ${file.name}`);

                // 1. Transition UI IMMEDIATELY
                this.dom.landingView.classList.add('opacity-0');
                setTimeout(() => {
                    this.dom.landingView.style.display = 'none';
                    this.dom.editorView.classList.remove('opacity-0', 'pointer-events-none');
                    this.dom.editorView.classList.add('opacity-100', 'pointer-events-auto');
                    // Force redraw
                }, 500);

                // 2. Enable Export Button EARLY
                this.dom.btnExport.disabled = false;
                console.log("Export button enabled");

                // 3. Load Video
                bus.emit('cmd:loadVideo', file);

                // 4. Update UI helpers
                if (this.dom.placeholder) this.dom.placeholder.classList.add('hidden');
                this.dom.overlay.classList.remove('hidden');

                // 5. Update Metadata (Safe Call)
                try {
                    this.updateMetadata(file);
                } catch (metaError) {
                    console.warn("Metadata extraction failed:", metaError);
                }

                // 6. Reset Filters
                bus.emit('cmd:resetFilters');

                // 7. Auto set crop to full
                setTimeout(() => {
                    const state = store.getState().video;
                    bus.emit('cmd:updateCrop', { x: 0, y: 0, width: state.width, height: state.height });
                    this.renderLoop.start();
                }, 500);
            }
        } catch (error) {
            console.error("Critical error in handleFileSelect:", error);
            alert("Failed to load video: " + error.message);
        }
    }

    setupCropInteractions() {
        let isDragging = false;
        let isResizing = false;
        let currentHandle = null;
        let startX, startY;

        const overlay = this.dom.overlay;

        // Overlay Move (Drag the box itself)
        overlay.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('crop-handle')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
        });

        // Handle Resize
        document.querySelectorAll('.crop-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // Don't trigger move
                isResizing = true;
                currentHandle = e.target.dataset.handle;
                startX = e.clientX;
                startY = e.clientY;
            });
        });

        // Global Mouse Move/Up
        window.addEventListener('mousemove', (e) => {
            if (!isDragging && !isResizing) return;

            const state = store.getState().video;
            const canvas = this.renderLoop.getCanvas();
            const rect = canvas.getBoundingClientRect();

            const scaleX = state.width / rect.width;
            const scaleY = state.height / rect.height;

            const dx = (e.clientX - startX) * scaleX;
            const dy = (e.clientY - startY) * scaleY;

            if (isDragging) {
                this.cropper.move(dx, dy);
            } else if (isResizing) {
                this.cropper.resize(currentHandle, dx, dy);
            }

            startX = e.clientX;
            startY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            isResizing = false;
            currentHandle = null;
        });
    }

    setupEventBus() {
        // Update UI when state changes
        bus.on('stateChanged', (data) => {
            this.updateUI(data.state);
            // Handle Undo/Redo button states
            document.getElementById('btn-undo').disabled = !data.canUndo;
            document.getElementById('btn-redo').disabled = !data.canRedo;
        });

        bus.on('timeUpdate', (time) => {
            this.dom.timeCurrent.textContent = Utils.formatTime(time);
            const duration = store.getState().video.duration;
            if (duration > 0) {
                this.dom.timeline.value = (time / duration) * 100;
            }
        });

        bus.on('videoLoaded', () => {
            const state = store.getState().video;
            this.dom.timeTotal.textContent = Utils.formatTime(state.duration);
            this.renderLoop.start();
        });

        bus.on('recordingFinished', (data) => {
            // Update UI State
            this.dom.recIndicator.classList.remove('active');
            this.dom.btnExport.textContent = 'EXPORT';
            this.dom.btnExport.disabled = false;

            // Show Preview Modal
            this.currentExportBlob = data.blob;
            const videoUrl = URL.createObjectURL(data.blob);
            this.dom.previewVideo.src = videoUrl;
            this.dom.previewVideo.play();

            this.dom.previewModal.classList.remove('hidden');
            setTimeout(() => {
                this.dom.previewModal.classList.remove('opacity-0');
                this.dom.previewContent.classList.remove('scale-95');
                this.dom.previewContent.classList.add('scale-100');
            }, 10);
        });
    }

    updateUI(state) {
        // Update Inputs
        this.dom.inputs.x.value = state.crop.x;
        this.dom.inputs.y.value = state.crop.y;
        this.dom.inputs.w.value = state.crop.width;
        this.dom.inputs.h.value = state.crop.height;

        // Update Filters UI using store state (in case of Undo)
        Object.keys(state.filters).forEach(key => {
            const slider = document.querySelector(`[data-filter="${key}"]`);
            if (slider && document.activeElement !== slider) {
                slider.value = state.filters[key];
                const display = document.getElementById(`val-${key}`);
                if (display) display.textContent = state.filters[key] + (key === 'hue' ? '°' : '%');
            }
        });

        // Update Overlay Visuals
        this.updateOverlayDOM();
    }

    updateOverlayDOM() {
        const state = store.getState().video;
        const crop = store.getState().crop;
        const canvas = this.renderLoop.getCanvas();

        if (!state.width || !state.height || !crop.width) return;

        const rect = canvas.getBoundingClientRect();

        const scaleX = rect.width / state.width;
        const scaleY = rect.height / state.height;

        const stageRect = this.dom.stage.getBoundingClientRect();
        const offsetX = rect.left - stageRect.left;
        const offsetY = rect.top - stageRect.top;

        this.dom.overlay.style.left = `${offsetX + (crop.x * scaleX)}px`;
        this.dom.overlay.style.top = `${offsetY + (crop.y * scaleY)}px`;
        this.dom.overlay.style.width = `${crop.width * scaleX}px`;
        this.dom.overlay.style.height = `${crop.height * scaleY}px`;
    }

    updateMetadata(file) {
        const meta = Metadata.extract(file);
        document.getElementById('meta-size').textContent = meta.size;
        document.getElementById('meta-dur').textContent = '...';
        // Resolution updates when video loads
        setTimeout(() => {
            const state = store.getState().video;
            document.getElementById('meta-res').textContent = `${state.width}x${state.height}`;
            document.getElementById('meta-dur').textContent = Utils.formatTime(state.duration);
        }, 500);
    }

    async handleExport() {
        try {
            Utils.log("handleExport Called");
            const state = store.getState();
            if (!state.video.src) {
                Utils.log("Export Aborted: state.video.src is missing");
                alert("Internal Error: Video source not found in state.");
                return;
            }

            Utils.log('Starting Export Sequence...');
            this.dom.btnExport.disabled = true;
            this.dom.btnExport.textContent = 'RENDERING...';
            this.dom.recIndicator.classList.add('active');
            this.dom.overlay.classList.add('hidden');

            bus.emit('cmd:pause');

            const canvas = this.renderLoop.getCanvas();
            const ctx = this.renderLoop.ctx;
            const crop = state.crop;

            // Capture stream from CURRENT canvas (it will be resized)
            const stream = canvas.captureStream(30);

            if (!stream) {
                throw new Error("Failed to capture canvas stream.");
            }

            // Add Audio
            const videoEl = this.player.getElement();
            // Try different capture methods for broader compatibility
            let vidStream;
            try {
                if (videoEl.captureStream) {
                    vidStream = videoEl.captureStream();
                } else if (videoEl.mozCaptureStream) {
                    vidStream = videoEl.mozCaptureStream();
                }

                if (vidStream) {
                    const audTracks = vidStream.getAudioTracks();
                    if (audTracks.length > 0) {
                        stream.addTrack(audTracks[0]);
                    }
                }
            } catch (e) {
                console.warn("Could not capture audio stream:", e);
                // Continue without audio rather than crashing
            }

            this.recorder.start(stream);

            // Stop preview loop
            this.renderLoop.stop();

            // Resize Canvas to Match CROP dimensions for high res output
            const originalWidth = canvas.width;
            const originalHeight = canvas.height;

            canvas.width = crop.width;
            canvas.height = crop.height;

            // Mute video during export to avoid noise
            const wasMuted = videoEl.muted;
            videoEl.muted = true;

            const renderExportFrame = () => {
                if (!this.recorder.isRecording) return;

                // Apply Filters (Reuse logic or keep this)
                const filters = store.getState().filters;
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
                ctx.filter = filterString.trim();

                const video = this.player.getElement();

                // Draw only the cropped region
                if (video.readyState >= 2) {
                    ctx.drawImage(
                        video,
                        crop.x, crop.y, crop.width, crop.height, // Source Rect
                        0, 0, crop.width, crop.height // Dest Rect (Full Canvas)
                    );
                }

                requestAnimationFrame(renderExportFrame);
            };

            renderExportFrame();

            // Rewind and Play
            bus.emit('cmd:seek', 0);

            // Wait for seek to complete
            await new Promise(resolve => {
                const onSeeked = () => {
                    videoEl.removeEventListener('seeked', onSeeked);
                    resolve();
                };
                videoEl.addEventListener('seeked', onSeeked);

                // Fallback in case seeked never fires (rare browser bug)
                setTimeout(() => {
                    videoEl.removeEventListener('seeked', onSeeked);
                    resolve();
                }, 1000);
            });

            bus.emit('cmd:play');

            const checkEnd = () => {
                // Check if playback ended OR if we stopped recording manually
                if (!this.recorder.isRecording) return;

                if (videoEl.ended || videoEl.currentTime >= videoEl.duration) {
                    this.recorder.stop();
                    videoEl.muted = wasMuted; // Restore mute state

                    // RESTORE STATE
                    this.dom.overlay.classList.remove('hidden');
                    // Reset canvas size isn't strictly necessary as RenderLoop handles it, 
                    // but good for cleanliness
                    canvas.width = originalWidth;
                    canvas.height = originalHeight;

                    this.renderLoop.start();
                } else {
                    requestAnimationFrame(checkEnd);
                }
            };
            requestAnimationFrame(checkEnd);

        } catch (error) {
            console.error("Export Critical Failure:", error);

            // EMERGENCY UI RESET
            this.dom.btnExport.disabled = false;
            this.dom.btnExport.textContent = 'EXPORT FAILED';
            this.dom.recIndicator.classList.remove('active');
            this.dom.overlay.classList.remove('hidden');

            // Restart loop if possible
            if (this.renderLoop && !this.renderLoop.isRunning) {
                this.renderLoop.start();
            }

            alert(`Export failed: ${error.message}\n\nTip: If you have a Video Downloader Extension enabled, please disable it or use Incognito Mode.`);
        }
    }
}
