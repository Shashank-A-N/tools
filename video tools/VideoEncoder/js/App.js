import { MP4Parser } from './MP4Parser.js';

export class App {
    constructor() {
        // Delay DOM lookup until init to ensure DOMContentLoaded
        this.dom = {};
        this.state = {
            file: null,
            format: 'webm',
            bitrateLevel: 3
        };

        // Auto-start
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // 1. Setup Global Error Handler
        window.onerror = (msg, url, line) => {
            const err = document.createElement('div');
            err.className = "fixed top-0 left-0 w-full bg-red-600 text-white p-2 z-[9999] text-xs font-mono";
            err.textContent = `APP ERROR: ${msg} @ line ${line}`;
            document.body.appendChild(err);
            console.error(msg);
        };

        try {
            // 2. Cache DOM Elements
            this.dom = {
                dropzone: document.getElementById('dropzone'),
                fileInput: document.getElementById('file-input'),
                uploadState: document.getElementById('upload-state'),
                previewState: document.getElementById('preview-state'),
                video: document.getElementById('video-preview'),
                btnProcess: document.getElementById('btn-process'),
                btnReset: document.getElementById('btn-reset'),
                formatBtns: document.querySelectorAll('.format-btn'),
                bitrateSlider: document.getElementById('bitrate-slider'),
                encodingOverlay: document.getElementById('encoding-overlay'),
                progressBar: document.getElementById('progress-bar'),
                progressText: document.getElementById('progress-text')
            };

            // 3. Safe Bind Helper
            const bind = (el, event, handler) => {
                if (el) {
                    el.addEventListener(event, handler);
                } else {
                    console.warn(`[App] Missing element for event '${event}'`);
                }
            };

            // 4. Bind Events
            if (this.dom.dropzone) {
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
                    this.dom.dropzone.addEventListener(e, (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                    });
                });
                bind(this.dom.dropzone, 'drop', (e) => this.handleFile(e.dataTransfer.files[0]));
            }

            bind(this.dom.fileInput, 'change', (e) => this.handleFile(e.target.files[0]));
            bind(this.dom.btnReset, 'click', () => this.reset(true));
            bind(this.dom.btnProcess, 'click', () => this.startEncoding());

            if (this.dom.formatBtns) {
                this.dom.formatBtns.forEach(btn => {
                    bind(btn, 'click', (e) => {
                        const format = e.target.dataset.format;
                        if (!this.checkCapability(format)) return;

                        this.dom.formatBtns.forEach(b => b.classList.remove('active', 'bg-orange-500/20', 'border-orange-500', 'text-orange-400'));
                        this.dom.formatBtns.forEach(b => b.classList.add('bg-slate-800', 'text-slate-400', 'border-transparent'));

                        e.target.classList.add('active', 'bg-orange-500/20', 'border-orange-500', 'text-orange-400');
                        e.target.classList.remove('bg-slate-800', 'text-slate-400', 'border-transparent');

                        this.state.format = format;
                    });
                });
            }

            // 5. Initial Checks
            this.checkCapability('mp4');

            // 6. Audio Context
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.audioSource = null;
            this.audioDest = this.audioCtx.createMediaStreamDestination();

            console.log("VideoEncoder initialized successfully.");

        } catch (e) {
            console.error("Initialization failed:", e);
            alert("App Init Failed: " + e.message);
        }
    }

    handleFile(file) {
        if (!file || !file.type.startsWith('video/')) return alert('Please select a valid video file.');

        this.state.file = file;
        const url = URL.createObjectURL(file);

        if (this.dom.video) {
            this.dom.video.src = url;
            this.dom.video.load();
        }

        this.dom.uploadState?.classList.add('hidden');
        this.dom.previewState?.classList.remove('hidden');

        if (this.dom.btnProcess) {
            this.dom.btnProcess.disabled = false;
            this.dom.btnProcess.classList.remove('bg-slate-800', 'text-slate-500');
            this.dom.btnProcess.classList.add('bg-orange-600', 'text-white');
        }
    }

    checkCapability(format) {
        let type = '';
        if (format === 'mp4') type = 'video/mp4;codecs=avc1';
        if (format === 'webm') type = 'video/webm;codecs=vp9';

        if (!MediaRecorder.isTypeSupported(type)) {
            if (format === 'mp4') {
                const btn = document.querySelector('[data-format="mp4"]');
                if (btn) {
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                    btn.title = "Browser does not support MP4 encoding directly.";
                }
            }
            return false;
        }
        return true;
    }

    reset(confirmAction = false) {
        if (confirmAction && this.state.file && !confirm("Discard current project?")) return;

        this.state.file = null;
        if (this.dom.video) {
            this.dom.video.pause();
            this.dom.video.src = '';
        }
        this.dom.uploadState?.classList.remove('hidden');
        this.dom.previewState?.classList.add('hidden');

        if (this.dom.btnProcess) {
            this.dom.btnProcess.disabled = true;
            this.dom.btnProcess.classList.add('bg-slate-800', 'text-slate-500');
            this.dom.btnProcess.classList.remove('bg-orange-600', 'text-white');
        }
    }

    async startEncoding() {
        this.dom.encodingOverlay?.classList.remove('hidden');

        // Resume Audio Context (browser policy)
        if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();

        // Connect Source Node ONLY ONCE
        if (!this.audioSource && this.dom.video) {
            try {
                this.audioSource = this.audioCtx.createMediaElementSource(this.dom.video);
                this.audioSource.connect(this.audioDest);
                this.audioSource.connect(this.audioCtx.destination);
            } catch (e) { console.warn("Audio connect failed", e); }
        }

        // Setup Canvas for Recoding (More robust than video.captureStream)
        const canvas = document.createElement('canvas');
        canvas.width = this.dom.video?.videoWidth || 1280;
        canvas.height = this.dom.video?.videoHeight || 720;
        const ctx = canvas.getContext('2d');

        // Stream from Canvas + Audio
        const canvasStream = canvas.captureStream(30); // Cap at 30fps for stability
        const audioTrack = this.audioDest.stream.getAudioTracks()[0];
        if (audioTrack) canvasStream.addTrack(audioTrack);

        let mimeType = 'video/webm;codecs=vp9';
        if (this.state.format === 'mp4') {
            if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
                mimeType = 'video/mp4;codecs=avc1';
            }
        }

        const options = {
            mimeType,
            videoBitsPerSecond: this.state.bitrateLevel * 2500000
        };

        let mediaRecorder;
        try {
            mediaRecorder = new MediaRecorder(canvasStream, options);
        } catch (e) {
            alert(`Recorder Init Error: ${e.message}\nTrying default settings...`);
            // Fallback to basic
            try { mediaRecorder = new MediaRecorder(canvasStream); }
            catch (e2) { alert("Fatal Error: " + e2.message); return; }
        }

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);

            // Auto Download
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `encoded.${this.state.format === 'mp4' ? 'mp4' : 'webm'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            this.dom.encodingOverlay?.classList.add('hidden');

            // Cleanup
            if (this.dom.video) this.dom.video.muted = false;
        };

        // Draw Loop
        let active = true;
        const draw = () => {
            if (!active) return;
            if (this.dom.video && !this.dom.video.paused && !this.dom.video.ended) {
                ctx.drawImage(this.dom.video, 0, 0);
            }
            requestAnimationFrame(draw);
        };

        // Start Logic
        if (this.dom.video) {
            this.dom.video.currentTime = 0;
            this.dom.video.muted = false; // Need audio for capture
            await this.dom.video.play();
            mediaRecorder.start();
            draw(); // Start drawing
        }

        // Progress & Stop Logic
        const checkInterval = setInterval(() => {
            if (!this.dom.video || this.dom.video.ended) {
                clearInterval(checkInterval);
                active = false;
                if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
            } else {
                const pct = (this.dom.video.currentTime / this.dom.video.duration) * 100;
                if (this.dom.progressBar) this.dom.progressBar.style.width = `${pct}%`;
                if (this.dom.progressText) this.dom.progressText.textContent = `${Math.round(pct)}%`;
            }
        }, 100);
    }
}

new App();
