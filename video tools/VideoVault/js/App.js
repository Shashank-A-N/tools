/**
 * App.js
 * Main Controller for Video Vault (Mega Upgrade).
 */
import { VaultEngine } from './VaultEngine.js';

export class App {
    constructor() {
        this.engine = new VaultEngine();
        this.currentFolderId = 'root';
        this.folderStack = [{ id: 'root', name: 'ROOT' }]; // For breadcrumbs

        this.dom = {
            setupScreen: document.getElementById('setup-screen'),
            lockScreen: document.getElementById('lock-screen'),
            bioScanner: document.getElementById('bio-scanner'),
            vaultInterface: document.getElementById('vault-interface'),

            // Setup Inputs
            setupPass: document.getElementById('setup-password'),
            setupConfirm: document.getElementById('setup-confirm'),
            btnSetup: document.getElementById('btn-setup'),

            // Unlock Inputs
            passwordInput: document.getElementById('vault-password'),
            btnUnlock: document.getElementById('btn-unlock'),
            btnLock: document.getElementById('btn-lock'),

            grid: document.getElementById('vault-grid'),
            uploadInput: document.getElementById('upload-input'),
            emptyState: document.getElementById('empty-state'),
            loader: document.getElementById('global-loader'),
            loaderText: document.getElementById('loader-text'),
            breadcrumbs: document.getElementById('breadcrumbs'),
            breadcrumbsMobile: document.getElementById('breadcrumbs-mobile'),

            // Player
            playerModal: document.getElementById('player-modal'),
            video: document.getElementById('secure-video'),
            playerTitle: document.getElementById('player-title'),
            btnExport: document.getElementById('btn-export-decrypted'),

            // Notifications
            notifications: document.getElementById('notification-area')
        };

        this.init();
    }

    init() {
        // Lifecycle Check
        if (!localStorage.getItem('vault_configured')) {
            this.showSetup();
        } else {
            this.showLogin();
        }

        // Setup Event
        this.dom.btnSetup.addEventListener('click', () => this.configureVault());

        // Unlock Event
        this.dom.btnUnlock.addEventListener('click', () => this.unlock());
        this.dom.passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.unlock();
        });

        // Lock Event
        this.dom.btnLock.addEventListener('click', () => {
            // Add "Reset" button to internal UI logic if needed, or just reload
            if (confirm("Lock Vault?")) location.reload();
        });

        // Upload Event
        this.dom.uploadInput.addEventListener('change', (e) => this.handleUpload(e));

        // Expose app to window
        window.app = this;
    }

    showSetup() {
        this.dom.setupScreen.classList.remove('hidden');
        this.dom.lockScreen.classList.add('hidden');
    }

    showLogin() {
        this.dom.setupScreen.classList.add('hidden');
        this.dom.lockScreen.classList.remove('hidden');
    }

    async configureVault() {
        const p1 = this.dom.setupPass.value;
        const p2 = this.dom.setupConfirm.value;

        if (!p1 || p1.length < 4) return this.notify("Password too weak (min 4 chars)", "error");
        if (p1 !== p2) return this.notify("Passwords do not match", "error");

        try {
            this.toggleLoader(true, "INITIALIZING ENCRYPTION...");
            // Initialize Engine (creates Salt)
            localStorage.setItem('vault_configured', 'true');
            await this.engine.unlock(p1); // This will create the salt if missing

            // Success
            this.notify("Vault Configured Successfully!", "success");
            setTimeout(() => {
                this.toggleLoader(false);
                this.startSession(false);
            }, 1000);
        } catch (e) {
            console.error(e);
            this.notify("Setup Failed: " + e.message, "error");
            this.toggleLoader(false);
        }
    }

    resetVault() {
        const input = prompt("TYPE 'DELETE' TO CONFIRM FACTORY RESET.\nALL DATA WILL BE LOST.");
        if (input === 'DELETE') {
            localStorage.clear(); // Wipes config and salt
            indexedDB.deleteDatabase('ShadowVaultDB'); // Wipes data
            alert("Vault Reset. Reloading...");
            location.reload();
        }
    }

    notify(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i> <span>${msg}</span>`;
        this.dom.notifications.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    toggleLoader(show, text = 'PROCESSING...') {
        if (!this.dom.loader) {
            console.warn("Loader element not found");
            return;
        }
        this.dom.loader.classList.toggle('hidden', !show);
        if (this.dom.loaderText) this.dom.loaderText.textContent = text;
    }

    // --- Biometrics & Security ---
    triggerBiometric() {
        this.dom.bioScanner.classList.remove('hidden');
        this.notify('INITIATING RETINA SCAN...', 'info');

        setTimeout(() => {
            this.dom.bioScanner.classList.add('hidden');
            // Mock Success (still requires password for real encryption key derivation)
            // In a real biometric app, the key would be released from Secure Enclave.
            // Here we just autofill a demo key or prompt for it.
            this.notify('IDENTITY CONFIRMED. ENTER KEY.', 'success');
            this.dom.passwordInput.focus();
        }, 3000);
    }

    triggerDecoyHint() {
        alert("Hint: Use '1234' for Guest Mode (Decoy).");
    }

    async unlock() {
        const password = this.dom.passwordInput.value;
        if (!password) return this.notify('Enter master key', 'error');

        // Decoy Mode Check
        if (password === '1234') {
            this.startSession(true); // Decoy session
            return;
        }

        try {
            await this.engine.unlock(password);
            this.startSession(false);
        } catch (e) {
            console.error(e);
            this.notify('Unlock Failed: ' + e.message, 'error');
        }
    }

    startSession(isDecoy) {
        // Transition UI
        this.dom.lockScreen.style.opacity = '0';
        this.dom.lockScreen.style.pointerEvents = 'none';
        this.dom.vaultInterface.classList.remove('opacity-0', 'pointer-events-none');

        if (isDecoy) {
            this.dom.grid.innerHTML = '';
            this.dom.emptyState.classList.remove('hidden');
            this.dom.emptyState.innerHTML = `
                <i class="fas fa-folder-open text-6xl mb-4 opacity-20"></i>
                <p class="font-orbitron tracking-widest">GUEST VAULT</p>
                <p class="text-xs mt-2 text-slate-600">Read-only access granted.</p>
            `;
            this.notify('Guest Access Granted', 'info');
            // Disable actions
            this.dom.uploadInput.disabled = true;
        } else {
            this.refreshGrid();
            this.notify('Vault Decrypted Successfully', 'success');
        }
    }

    // --- VFS & Grid ---

    async refreshGrid() {
        this.dom.grid.innerHTML = '';
        this.updateBreadcrumbs();

        try {
            const items = await this.engine.getContents(this.currentFolderId);

            if (items.length === 0) {
                this.dom.emptyState.classList.remove('hidden');
            } else {
                this.dom.emptyState.classList.add('hidden');
                items.forEach(item => {
                    this.dom.grid.appendChild(this.createCard(item));
                });
            }
            this.updateStats(items);
        } catch (e) {
            console.error(e);
            this.notify("Failed to load contents", "error");
        }
    }

    updateBreadcrumbs() {
        // Desktop
        this.dom.breadcrumbs.innerHTML = this.folderStack.map((folder, index) => {
            const isLast = index === this.folderStack.length - 1;
            return `
                <div class="flex items-center">
                    <span class="${isLast ? 'text-white font-bold' : 'cursor-pointer hover:text-white transition-colors'}" 
                          onclick="${!isLast ? `app.navigateToIndex(${index})` : ''}">
                        ${folder.name}
                    </span>
                    ${!isLast ? '<i class="fas fa-chevron-right text-[10px] mx-2 text-slate-600"></i>' : ''}
                </div>
            `;
        }).join('');

        // Mobile (Simplified)
        this.dom.breadcrumbsMobile.innerHTML = this.folderStack.map((folder, index) => {
            return `<span class="bg-white/5 px-2 py-1 rounded cursor-pointer whitespace-nowrap" onclick="app.navigateToIndex(${index})">${folder.name}</span>`;
        }).join('<i class="fas fa-chevron-right text-[8px] mx-1 text-slate-600"></i>');
    }

    navigateToIndex(index) {
        this.folderStack = this.folderStack.slice(0, index + 1);
        this.currentFolderId = this.folderStack[this.folderStack.length - 1].id;
        this.refreshGrid();
    }

    navigateHome() {
        this.navigateToIndex(0);
    }

    async createFolder() {
        const name = prompt("Enter folder name:");
        if (name) {
            await this.engine.createFolder(name, this.currentFolderId);
            this.refreshGrid();
        }
    }

    openFolder(folder) {
        this.currentFolderId = folder.id;
        this.folderStack.push({ id: folder.id, name: folder.name });
        this.refreshGrid();
    }

    createCard(item) {
        const div = document.createElement('div');
        div.className = 'vault-item bg-slate-900 border border-white/10 p-4 rounded-xl flex flex-col gap-3 group relative overflow-hidden h-40';

        // Folder Icon vs Video Thumbnail
        const iconHtml = item.isFolder
            ? `<i class="fas fa-folder text-4xl text-yellow-500/80 group-hover:text-yellow-400 transition-colors"></i>`
            : `<i class="fas fa-file-video text-4xl text-slate-700 group-hover:text-red-500 transition-colors"></i>`;

        div.innerHTML = `
            <div class="flex-1 flex items-center justify-center relative">
                ${iconHtml}
                ${!item.isFolder ? `
                <button class="btn-play absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fas fa-play-circle text-5xl text-white drop-shadow-lg scale-90 group-hover:scale-100 transition-transform"></i>
                </button>` : ''}
            </div>
            
            <div class="flex justify-between items-end border-t border-white/5 pt-2">
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-slate-200 truncate text-xs font-mono" title="${item.name}">${item.name}</h4>
                    <p class="text-[10px] text-slate-500 font-mono">${item.isFolder ? 'FOLDER' : (item.size / 1024 / 1024).toFixed(1) + ' MB'}</p>
                </div>
                <button class="btn-delete text-slate-600 hover:text-red-500 transition-colors p-1" title="Delete">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </div>
        `;

        if (item.isFolder) {
            div.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-delete')) this.openFolder(item);
            });
        } else {
            div.querySelector('.btn-play').addEventListener('click', () => this.playFile(item));
        }

        // Delete Handler
        div.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Permanently delete "${item.name}"?`)) {
                this.deleteItem(item.id);
            }
        });

        return div;
    }

    async handleUpload(e) {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        this.toggleLoader(true, `ENCRYPTING ${files.length} FILES...`);
        let successCount = 0;

        for (const file of files) {
            try {
                await this.engine.encryptFile(file, this.currentFolderId);
                successCount++;
            } catch (err) {
                console.error(err);
                this.notify(`Failed: ${file.name}`, 'error');
            }
        }

        if (successCount > 0) this.notify(`Encrypted ${successCount} files securely.`, 'success');

        this.dom.uploadInput.value = '';
        this.toggleLoader(false);
        this.refreshGrid();
    }

    async playFile(fileMeta) {
        this.toggleLoader(true, 'DECRYPTING STREAM...');

        try {
            const blob = await this.engine.decryptFile(fileMeta.id);
            const url = URL.createObjectURL(blob);

            this.dom.video.src = url;
            this.dom.playerTitle.textContent = fileMeta.name;
            this.dom.playerModal.classList.remove('hidden');
            this.dom.video.play();

            this.dom.btnExport.onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = `decrypted_${fileMeta.name}`;
                a.click();
            };

        } catch (e) {
            this.notify('Decryption Error: ' + e.message, 'error');
        } finally {
            this.toggleLoader(false);
        }
    }

    async deleteItem(id) {
        try {
            await this.engine.deleteItem(id);
            this.notify('Item deleted', 'info');
            this.refreshGrid();
        } catch (e) {
            this.notify('Delete failed', 'error');
        }
    }

    updateStats(items) {
        // Simple mock stats for the current view
        const totalSize = items.reduce((acc, item) => acc + (item.size || 0), 0);
        document.getElementById('storage-status').textContent = `ENCRYPTED STORAGE: ${(totalSize / 1024 / 1024).toFixed(2)} MB USED (Current Folder)`;
    }
}
