/**
 * App.js
 * Main Controller for Video Filters (Batch Edition).
 */
import { bus } from './EventBus.js';
import { store } from './StateManager.js';
import { Utils } from './Utils.js';
import { FilterEngine } from './FilterEngine.js';
import { VideoPlayer } from './VideoPlayer.js';
import { RenderLoop } from './RenderLoop.js';
import { QueueUI } from './QueueUI.js';

export class App {
    constructor() {
        this.player = new VideoPlayer();
        this.renderLoop = new RenderLoop(this.player);
        this.queueUI = null;

        this.dom = {
            landingView: document.getElementById('landing-view'),
            editorView: document.getElementById('editor-view'),
            landingInput: document.getElementById('landing-fileInput'),
            stage: document.getElementById('stage-container'),

            // UI Panels
            presetsContainer: document.getElementById('presets-container'),
            controlsContainer: document.getElementById('controls-container'),
            queueContainer: document.getElementById('queue-list'),

            // Buttons
            btnExport: document.getElementById('btn-export'),
            btnExportAll: document.getElementById('btn-export-all'),
            btnAddFiles: document.getElementById('btn-add-files'),
            hiddenAddInput: document.getElementById('hidden-add-input'),
            btnApplyAll: document.getElementById('btn-apply-all'),
            btnReset: document.getElementById('btn-reset'),

            // Preview Modal
            previewModal: document.getElementById('preview-modal'),
            previewVideo: document.getElementById('preview-video'),
            btnSave: document.getElementById('btn-save-disk')
        };

        this.init();
    }

    init() {
        this.queueUI = new QueueUI(this.dom.queueContainer);
        this.setupDOM();
        this.setupStateListeners();
        this.renderLoopControls();

        // Mount Canvas
        const canvas = this.renderLoop.getCanvas();
        canvas.className = 'w-full h-full object-contain';
        this.dom.stage.appendChild(canvas);
        this.renderLoop.start();

        console.log('[ShadowFX] App Initialized (Batch Mode)');
    }

    setupDOM() {
        // Upload (Landing)
        this.dom.landingInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Add Files (Sidebar)
        this.dom.btnAddFiles.addEventListener('click', () => this.dom.hiddenAddInput.click());
        this.dom.hiddenAddInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag & Drop (Global)
        document.body.addEventListener('dragover', (e) => e.preventDefault());
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) this.handleFileSelect({ target: { files: e.dataTransfer.files } });
        });

        this.dom.btnReset.addEventListener('click', () => store.resetFilters());
        this.dom.btnApplyAll.addEventListener('click', () => {
            store.applyFiltersToAll();
            alert('Filters copied to all videos in queue!');
        });

        this.dom.btnExport.addEventListener('click', () => this.handleExportSingle());
        this.dom.btnExportAll.addEventListener('click', () => this.handleBatchExport());

        this.renderPresets();
    }

    renderPresets() {
        const presets = FilterEngine.getPresets();
        this.dom.presetsContainer.innerHTML = '';

        Object.keys(presets).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'flex-shrink-0 w-24 h-24 rounded-xl bg-black/50 border border-white/10 overflow-hidden relative group transition-all hover:scale-105';
            btn.onclick = () => {
                store.updateActiveFilters(presets[key]);
            };
            btn.innerHTML = `
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <span class="font-orbitron text-xs font-bold tracking-widest drop-shadow-md capitalize">${key}</span>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            `;
            this.dom.presetsContainer.appendChild(btn);
        });
    }

    renderLoopControls() {
        // ... (Same as before, but updates via store.updateActiveFilters)
        const defaults = FilterEngine.getDefaults();
        const config = {
            brightness: { min: 0, max: 200, label: 'Brightness' },
            contrast: { min: 0, max: 200, label: 'Contrast' },
            saturate: { min: 0, max: 200, label: 'Saturation' },
            hueRotate: { min: 0, max: 360, label: 'Hue', suffix: 'deg' },
            blur: { min: 0, max: 20, label: 'Blur', suffix: 'px' },
            grayscale: { min: 0, max: 100, label: 'Grayscale' },
            sepia: { min: 0, max: 100, label: 'Sepia' },
            invert: { min: 0, max: 100, label: 'Invert' },
        };

        this.dom.controlsContainer.innerHTML = '';

        Object.keys(defaults).forEach(key => {
            const cfg = config[key];
            if (!cfg) return;

            const div = document.createElement('div');
            div.className = 'space-y-1';
            div.innerHTML = `
                <div class="flex justify-between text-xs text-slate-400 uppercase tracking-wider">
                    <label>${cfg.label}</label>
                    <span id="val-${key}" class="text-fuchsia-400 font-mono">${defaults[key]}${cfg.suffix || '%'}</span>
                </div>
                <input type="range" data-filter="${key}" 
                    min="${cfg.min}" max="${cfg.max}" value="${defaults[key]}" 
                    class="w-full accent-fuchsia-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer">
            `;

            const input = div.querySelector('input');
            input.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                document.getElementById(`val-${key}`).textContent = val + (cfg.suffix || '%');
                store.updateActiveFilters({ [key]: val });
            });

            this.dom.controlsContainer.appendChild(div);
        });
    }

    setupStateListeners() {
        bus.on('cmd:loadActiveVideo', (item) => {
            if (!item) return;
            this.player.loadVideo(item.file);
            setTimeout(() => bus.emit('cmd:play'), 200);
        });

        bus.on('cmd:clearStage', () => {
            // Clear canvas, hide video, etc.
            // For now we just leave the last frame or black
        });

        bus.on('videoLoaded', (video) => {
            const active = store.getActiveVideo();
            if (active) {
                store.updateVideoMetadata(active.id, {
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight
                });
            }
        });

        bus.on('stateChanged', ({ state }) => {
            const active = store.getActiveVideo();
            if (!active) return;

            // Sync sliders
            Object.keys(active.filters).forEach(key => {
                const input = document.querySelector(`input[data-filter="${key}"]`);
                if (input && document.activeElement !== input) {
                    input.value = active.filters[key];
                    const cfg = { suffix: (key === 'blur' ? 'px' : (key === 'hueRotate' ? 'deg' : '%')) };
                    const label = document.getElementById(`val-${key}`);
                    if (label) label.textContent = active.filters[key] + cfg.suffix;
                }
            });
        });
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // UI Transition
        this.dom.landingView.classList.add('opacity-0');
        setTimeout(() => {
            this.dom.landingView.style.display = 'none';
            this.dom.editorView.classList.remove('opacity-0', 'pointer-events-none');
        }, 500);

        store.addVideos(files);
    }

    // Export Single (Active)
    async handleExportSingle() {
        const active = store.getActiveVideo();
        if (!active) return;

        const btn = this.dom.btnExport;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> RENDERING...';

        try {
            await this.processVideo(active, true); // true = show preview
        } catch (e) {
            console.error("Export failed:", e);
            alert("Export failed: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    // Batch Export
    async handleBatchExport() {
        const state = store.getState();
        const playlist = state.playlist;

        if (playlist.length === 0) return;

        this.dom.btnExportAll.disabled = true;
        this.dom.btnExportAll.innerText = 'PROCESSING...';

        for (let i = 0; i < playlist.length; i++) {
            const item = playlist[i];

            // Select it so it shows on stage (visual feedback)
            store.selectVideo(i);

            // Wait for load
            await new Promise(r => setTimeout(r, 500));

            // Process (without preview, auto download)
            await this.processVideo(item, false);

            // Mark as done (visual feedback in queue)
            // item.status = 'done' (handled in processVideo or here)
        }

        this.dom.btnExportAll.disabled = false;
        this.dom.btnExportAll.innerText = 'EXPORT ALL';
        alert('Batch Processing Complete!');
    }

    async processVideo(item, showPreview) {
        // Pause playback
        bus.emit('cmd:pause');
        const video = this.player.getElement();

        // Setup Recorder
        const canvas = this.renderLoop.getCanvas();
        const stream = canvas.captureStream(30);
        const chunks = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 });

        recorder.ondataavailable = e => chunks.push(e.data);

        // Promise wrapper for the recording process
        return new Promise((resolve) => {
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });

                if (showPreview) {
                    const url = URL.createObjectURL(blob);
                    this.dom.previewVideo.src = url;
                    this.dom.previewModal.classList.remove('hidden');
                    this.dom.btnSave.onclick = () => {
                        Utils.downloadBlob(blob, `filtered_${item.name}.webm`);
                        this.dom.previewModal.classList.add('hidden');
                    };
                } else {
                    // Auto download for batch
                    Utils.downloadBlob(blob, `filtered_${item.name}.webm`);
                }
                resolve();
            };

            // Play and Record
            video.currentTime = 0;
            const onEnded = () => {
                recorder.stop();
                video.removeEventListener('ended', onEnded);
            };
            video.addEventListener('ended', onEnded);

            recorder.start();
            video.play().catch(e => {
                console.error("Auto-play failed:", e);
                recorder.stop();
                resolve(); // Exit promise
                alert("Could not play video for recording. Interaction required?");
            });
        });
    }
}
