/**
 * App.js
 * Main Controller for Video Resizer.
 */
import { bus } from './EventBus.js';
import { store } from './StateManager.js';
import { Utils } from './Utils.js';
import { VideoPlayer } from './VideoPlayer.js';
import { RenderLoop } from './RenderLoop.js';

export class App {
    constructor() {
        this.player = new VideoPlayer();
        this.renderLoop = new RenderLoop(this.player);

        this.dom = {
            landingView: document.getElementById('landing-view'),
            editorView: document.getElementById('editor-view'),
            landingInput: document.getElementById('landing-fileInput'),
            stage: document.getElementById('stage-container'),

            // Sidebar Inputs
            widthInput: document.getElementById('input-width'),
            heightInput: document.getElementById('input-height'),
            ratioLock: document.getElementById('ratio-lock'),

            // Buttons
            btnExport: document.getElementById('btn-export'),
            btnBackHome: document.getElementById('btn-back-home'),

            // Preview
            previewModal: document.getElementById('preview-modal'),
            previewVideo: document.getElementById('preview-video'),
            btnClosePreview: document.getElementById('btn-close-preview'),
            btnSave: document.getElementById('btn-save-disk')
        };

        this.init();
    }

    init() {
        this.setupDOM();
        this.setupStateListeners();

        // mount canvas
        const canvas = this.renderLoop.getCanvas();
        canvas.className = 'w-full h-full object-contain';
        this.dom.stage.appendChild(canvas);

        this.renderLoop.start();

        console.log('[ShadowResize] App Initialized');
    }

    setupDOM() {
        // Upload
        this.dom.landingInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag & Drop
        const landing = this.dom.landingView;
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            landing.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        landing.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length) this.handleFileSelect({ target: { files: [files[0]] } });
        });

        // Toggle Ratio Lock
        this.dom.ratioLock.addEventListener('click', () => {
            const current = store.state.resize.maintainAspectRatio;
            store.setState({ resize: { ...store.state.resize, maintainAspectRatio: !current } });
        });

        // Dimension Inputs
        const updateDims = Utils.debounce(() => {
            const w = parseInt(this.dom.dom.widthInput.value) || 0;
            const h = parseInt(this.dom.dom.heightInput.value) || 0;

            if (w && h) {
                // If locked, we might need to adjust one based on the other
                // But for now, let's just update state
                store.setState({ resize: { ...store.state.resize, targetWidth: w, targetHeight: h } });
            }
        }, 300);

        this.dom.widthInput.addEventListener('input', (e) => {
            const state = store.getState();
            const w = parseInt(e.target.value) || 0;
            let h = state.resize.targetHeight;

            if (state.resize.maintainAspectRatio) {
                h = Math.round(w / state.resize.aspectRatio);
                this.dom.heightInput.value = h;
            }

            store.setState({ resize: { ...state.resize, targetWidth: w, targetHeight: h } });
        });

        this.dom.heightInput.addEventListener('input', (e) => {
            const state = store.getState();
            const h = parseInt(e.target.value) || 0;
            let w = state.resize.targetWidth;

            if (state.resize.maintainAspectRatio) {
                w = Math.round(h * state.resize.aspectRatio);
                this.dom.widthInput.value = w;
            }

            store.setState({ resize: { ...state.resize, targetWidth: w, targetHeight: h } });
        });

        // Export
        this.dom.btnExport.addEventListener('click', () => this.handleExport());
    }

    setupStateListeners() {
        bus.on('videoLoaded', (video) => {
            // Set initial dimensions
            const w = video.videoWidth;
            const h = video.videoHeight;
            const ratio = w / h;

            store.setState({
                resize: {
                    targetWidth: w,
                    targetHeight: h,
                    aspectRatio: ratio,
                    maintainAspectRatio: true
                }
            });

            // Update UI inputs
            this.dom.widthInput.value = w;
            this.dom.heightInput.value = h;
        });

        bus.on('stateChanged', ({ state }) => {
            const btn = this.dom.ratioLock;
            if (state.resize.maintainAspectRatio) {
                btn.classList.add('text-blue-500', 'bg-blue-500/20');
                btn.classList.remove('text-slate-500');
            } else {
                btn.classList.remove('text-blue-500', 'bg-blue-500/20');
                btn.classList.add('text-slate-500');
            }
        });
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // UI Transistion
        this.dom.landingView.classList.add('opacity-0');
        setTimeout(() => {
            this.dom.landingView.style.display = 'none';
            this.dom.editorView.classList.remove('opacity-0', 'pointer-events-none');
        }, 500);

        bus.emit('cmd:loadVideo', file);
        this.dom.btnExport.disabled = false;

        // Auto-play
        setTimeout(() => bus.emit('cmd:play'), 500);
    }

    async handleExport() {
        const state = store.getState();
        if (!state.video.src) return;

        this.dom.btnExport.disabled = true;
        this.dom.btnExport.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> PROCESSING...';

        bus.emit('cmd:pause');
        const video = this.player.getElement();
        video.currentTime = 0; // Rewind

        // Create Recorder
        const canvas = this.renderLoop.getCanvas();
        const stream = canvas.captureStream(30); // 30 FPS constant
        const chunks = [];

        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

        recorder.ondataavailable = e => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });

            // Show Preview
            const url = URL.createObjectURL(blob);
            this.dom.previewVideo.src = url;
            this.dom.previewModal.classList.remove('hidden');

            // Setup Download
            this.dom.btnSave.onclick = () => {
                Utils.downloadBlob(blob, `resized_${state.resize.targetWidth}x${state.resize.targetHeight}.webm`);
                this.dom.previewModal.classList.add('hidden');
            };

            // Reset UI
            this.dom.btnExport.disabled = false;
            this.dom.btnExport.innerHTML = '<i class="fas fa-download"></i> EXPORT';
        };

        recorder.start();
        bus.emit('cmd:play');

        // Wait for end
        video.onended = () => {
            recorder.stop();
            video.onended = null; // Cleanup
        };
    }
}
