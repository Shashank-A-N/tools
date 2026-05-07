/**
 * Video Decoder App.js
 * Stream Logic and Frame Analysis.
 */
import { MP4Parser } from './MP4Parser.js';

export class App {
    constructor() {
        this.dom = {
            fileInput: document.getElementById('file-input'),
            uploadOverlay: document.getElementById('upload-overlay'),
            video: document.getElementById('video-source'),
            hexView: document.getElementById('hex-view'),
            structureView: document.getElementById('structure-view'),
            canvas: document.getElementById('frame-canvas'),
            btnCapture: document.getElementById('btn-capture'),
            hist: document.getElementById('histogram'),
            meta: {
                codec: document.getElementById('meta-codec'),
                size: document.getElementById('meta-size'),
                res: document.getElementById('meta-res'),
                fps: document.getElementById('meta-fps')
            },
            // Reset Button
            btnReset: document.createElement('button')
        };

        // Add Reset Button to UI dynamically (or add to HTML)
        this.addResetButton();

        this.ctx = this.dom.canvas.getContext('2d');
        this.file = null;
        this.chunkSize = 4096; // 4KB chunks for hex view
        this.currentHexOffset = 0;

        this.init();
    }

    addResetButton() {
        const nav = document.querySelector('nav div:last-child');
        if (nav) {
            this.dom.btnReset.className = "text-slate-400 hover:text-white transition-colors ml-4 cursor-pointer";
            this.dom.btnReset.innerHTML = '<i class="fas fa-redo-alt"></i> NEW FILE';
            this.dom.btnReset.onclick = () => this.reset();
            nav.prepend(this.dom.btnReset); // Add before other buttons
        }
    }

    init() {
        // Global Error Handler
        window.onerror = (msg, url, line) => {
            const err = document.createElement('div');
            err.className = "fixed top-0 left-0 w-full bg-red-600 text-white p-2 z-[9999] text-xs font-mono";
            err.textContent = `ERR: ${msg} @ ${line}`;
            document.body.appendChild(err);
        };

        // Safe Bind
        const bind = (el, event, handler) => {
            if (el) el.addEventListener(event, handler);
            else console.warn(`[App] Missing element for: ${event}`);
        };

        bind(this.dom.fileInput, 'change', (e) => {
            console.log("[App] File Input Change Detected");
            this.handleFile(e.target.files[0]);
        });

        // Drag & Drop Support
        const dropzone = this.dom.uploadOverlay;
        if (dropzone) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            dropzone.addEventListener('dragenter', () => dropzone.classList.add('border-yellow-500', 'bg-slate-900/90'));
            dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-yellow-500', 'bg-slate-900/90'));

            dropzone.addEventListener('drop', (e) => {
                dropzone.classList.remove('border-yellow-500', 'bg-slate-900/90');
                const dt = e.dataTransfer;
                const files = dt.files;
                console.log("[App] File Dropped:", files[0]);
                this.handleFile(files[0]);
            });
        }

        // Frame Capture Loop (Low freq)
        if (this.dom.video) {
            this.dom.video.addEventListener('timeupdate', () => this.updateFrame());
        }

        bind(this.dom.btnCapture, 'click', () => this.downloadFrame());
    }

    reset() {
        if (confirm("Load new file?")) location.reload();
    }

    async handleFile(file) {
        if (!file) return;
        this.file = file;

        // 1. UI Setup
        this.dom.uploadOverlay.classList.add('hidden');
        const url = URL.createObjectURL(file);
        this.dom.video.src = url;

        // 2. Metadata Extraction (Basic)
        this.dom.meta.size.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        this.dom.meta.codec.textContent = file.type || 'Unknown';

        // Wait for metadata
        this.dom.video.onloadedmetadata = () => {
            this.dom.meta.res.textContent = `${this.dom.video.videoWidth}x${this.dom.video.videoHeight}`;
            this.dom.canvas.width = this.dom.video.videoWidth;
            this.dom.canvas.height = this.dom.video.videoHeight;
            this.updateFrame();
        };

        // 3. Parser Analysis
        console.log("[App] Starting Structure Analysis...");
        await this.analyzeStructure(); // Await this to see if it blocks

        // 4. Hex Dump (First Chunk)
        console.log("[App] Starting Hex Dump...");
        try {
            await this.loadHexChunk(0);
            console.log("[App] Hex Dump Initialized.");
        } catch (e) {
            console.error("[App] Hex Dump Trigger Failed:", e);
        }
    }

    async analyzeStructure() {
        this.dom.structureView.innerHTML = '<div class="text-center mt-20 text-blue-400 animate-pulse">Parsing Atoms...</div>';

        try {
            const parser = new MP4Parser(this.file);
            const boxes = await parser.parse();
            this.renderStructure(boxes);
        } catch (e) {
            console.warn(e);
            const isSigError = e.message.includes("Signature");
            this.dom.structureView.innerHTML = `
                <div class="text-slate-500 p-4 text-center text-xs font-mono border border-white/5 rounded mt-4">
                    <i class="fas fa-exclamation-triangle text-orange-500 text-2xl mb-2"></i><br>
                    ${isSigError ? 'Structure View Unavailable' : 'Parsing Error'}<br>
                    <span class="opacity-50">${e.message}</span>
                </div>
            `;
        }
    }

    renderStructure(boxes, depth = 0) {
        if (depth === 0) this.dom.structureView.innerHTML = '';

        const ul = document.createElement('ul');
        ul.className = depth === 0 ? 'space-y-1' : 'pl-4 border-l border-white/10 mt-1 space-y-1';

        boxes.forEach(box => {
            const li = document.createElement('li');
            const isContainer = box.children && box.children.length > 0;

            li.innerHTML = `
                <div class="hover:bg-white/5 p-1 rounded cursor-pointer flex justify-between group">
                    <span class="text-blue-300 font-bold">
                        ${isContainer ? '<i class="fas fa-folder-open text-[10px] mr-1 opacity-50"></i>' : '<i class="fas fa-cube text-[10px] mr-1 opacity-50"></i>'}
                        ${box.type}
                    </span>
                    <span class="text-slate-600 group-hover:text-slate-400">${box.size.toLocaleString()} B</span>
                </div>
            `;

            if (isContainer) {
                const childContainer = this.renderStructure(box.children, depth + 1);
                childContainer.classList.add('hidden'); // Collapse by default? Or Open? Let's open logic later.
                li.appendChild(childContainer);

                // Toggle
                li.querySelector('div').onclick = (e) => {
                    e.stopPropagation();
                    childContainer.classList.toggle('hidden');
                };
            }

            ul.appendChild(li);
        });

        if (depth === 0) this.dom.structureView.appendChild(ul);
        return ul;
    }

    async loadHexChunk(offset) {
        console.log(`[App] Loading Hex Chunk @ ${offset}`);
        if (!this.dom.hexView) {
            console.error("[App] Hex View DOM element missing!");
            return;
        }

        try {
            const end = Math.min(offset + this.chunkSize, this.file.size);
            const buffer = await this.file.slice(offset, end).arrayBuffer();

            this.renderHex(buffer, offset);
        } catch (e) {
            console.error("[App] Hex Load Failed:", e);
        }
    }

    renderHex(buffer, startOffset) {
        const view = new Uint8Array(buffer);
        let html = '';
        for (let i = 0; i < view.length; i += 16) {
            const offset = (startOffset + i).toString(16).padStart(8, '0').toUpperCase(); // 8 chars for large files
            const bytes = Array.from(view.slice(i, i + 16))
                .map(b => b.toString(16).padStart(2, '0').toUpperCase())
                .join(' ');
            const ascii = Array.from(view.slice(i, i + 16))
                .map(b => (b > 31 && b < 127) ? String.fromCharCode(b) : '.')
                .join('');

            html += `<div class="hover:bg-white/10 cursor-pointer flex gap-4 text-[10px] md:text-xs">
                <span class="text-slate-500 select-none">${offset}</span>
                <span class="text-blue-400 font-mono">${bytes.padEnd(47, ' ')}</span>
                <span class="text-slate-600 border-l border-white/5 pl-2 select-none">${ascii}</span>
            </div>`;
        }

        // Pagination Controls
        html += `
            <div class="flex justify-between mt-4 border-t border-white/10 pt-2 bg-slate-900 sticky bottom-0 p-2">
                <button ${startOffset === 0 ? 'disabled' : ''} class="text-blue-400 disabled:opacity-50" onclick="app.loadHexChunk(${Math.max(0, startOffset - this.chunkSize)})">
                    <i class="fas fa-chevron-left"></i> Prev
                </button>
                <span class="text-slate-500">${startOffset} - ${startOffset + view.length}</span>
                <button ${startOffset + view.length >= this.file.size ? 'disabled' : ''} class="text-blue-400 disabled:opacity-50" onclick="app.loadHexChunk(${startOffset + this.chunkSize})">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        this.dom.hexView.innerHTML = html;
    }

    updateFrame() {
        this.ctx.drawImage(this.dom.video, 0, 0, this.dom.canvas.width, this.dom.canvas.height);
        this.updateHistogram();
    }

    updateHistogram() {
        // ... (Existing Histogram Logic) ...
        const w = this.dom.canvas.width;
        const h = this.dom.canvas.height;
        try {
            const frame = this.ctx.getImageData(w / 2, h / 2, 1, 1).data;
            const columns = this.dom.hist.children;
            if (columns.length >= 3) {
                columns[0].style.height = `${(frame[0] / 255) * 100}%`;
                columns[1].style.height = `${(frame[1] / 255) * 100}%`;
                columns[2].style.height = `${(frame[2] / 255) * 100}%`;
            }
        } catch (e) { }
    }

    downloadFrame() {
        const link = document.createElement('a');
        link.download = `frame_${this.dom.video.currentTime.toFixed(2)}.png`;
        link.href = this.dom.canvas.toDataURL();
        link.click();
    }
}


