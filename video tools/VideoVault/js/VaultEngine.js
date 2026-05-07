/**
 * VaultEngine.js
 * Handles Encryption, Decryption, and IndexedDB Storage.
 */

const DB_NAME = 'ShadowVaultDB';
const STORE_NAME = 'encrypted_videos';
const DB_VERSION = 2; // Incremented for VFS

export class VaultEngine {
    constructor() {
        this.db = null;
        this.key = null; // CryptoKey
        this.currentDir = 'root'; // VFS Root
    }

    // --- Key Derivation ---
    async deriveKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );

        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false, // Key is non-extractable!
            ["encrypt", "decrypt"]
        );
    }

    // --- Database ---
    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const tx = event.target.transaction;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('parentId', 'parentId', { unique: false });
                } else {
                    // Upgrade: Add parentId index if missing
                    const store = tx.objectStore(STORE_NAME);
                    if (!store.indexNames.contains('parentId')) {
                        store.createIndex('parentId', 'parentId', { unique: false });
                    }
                    // Migrate old data to root
                    store.openCursor().onsuccess = (e) => {
                        const cursor = e.target.result;
                        if (cursor) {
                            const update = cursor.value;
                            if (!update.parentId) {
                                update.parentId = 'root';
                                cursor.update(update);
                            }
                            cursor.continue();
                        }
                    };
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    // --- Operations ---

    async unlock(password) {
        if (!this.db) await this.openDB();

        // In a real app, we'd verify the password against a stored hased validator.
        // Here, we just derive the key. If it's wrong, decryption will fail later (MAC error).
        // For UX, we'll assume a fixed salt for the "Vault" instance itself, 
        // or store a random salt in localStorage.

        let salt = localStorage.getItem('vault_salt');
        if (!salt) {
            salt = window.crypto.getRandomValues(new Uint8Array(16)).toString();
            // Actually, we need to store the salt as bytes. Text is easier for localStorage:
            localStorage.setItem('vault_salt', JSON.stringify(Array.from(window.crypto.getRandomValues(new Uint8Array(16)))));
            // Note: If salt is new, old data is effectively lost if we don't have the old salt. 
            // This is a simplification. Real implementation needs robust salt management.
        }

        const saltBytes = new Uint8Array(JSON.parse(localStorage.getItem('vault_salt')));
        this.key = await this.deriveKey(password, saltBytes);
        return true;
    }

    // Create Folder
    async createFolder(name, parentId = 'root') {
        const id = crypto.randomUUID();
        const record = {
            id,
            name,
            type: 'folder',
            size: 0,
            timestamp: Date.now(),
            parentId: parentId,
            isFolder: true
        };

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.add(record);
            req.onsuccess = () => resolve(record);
            req.onerror = () => reject(req.error);
        });
    }

    async encryptFile(file, parentId = 'root') {
        if (!this.key) throw new Error("Vault locked");

        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
        const fileBuffer = await file.arrayBuffer();

        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            this.key,
            fileBuffer
        );

        // ID construction
        const id = crypto.randomUUID();
        const record = {
            id,
            name: file.name,
            type: file.type,
            size: file.size, // Original size
            timestamp: Date.now(),
            iv: Array.from(iv), // Store IV with record
            data: encryptedContent, // The Encrypted Blob
            parentId: parentId,
            isFolder: false
        };

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.add(record);

            req.onsuccess = () => resolve(record);
            req.onerror = () => reject(req.error);
        });
    }

    async decryptFile(id) {
        if (!this.key) throw new Error("Vault locked");

        // 1. Fetch Record
        const record = await new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        if (!record) throw new Error("File not found");

        const iv = new Uint8Array(record.iv);

        try {
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                this.key,
                record.data
            );

            return new Blob([decryptedBuffer], { type: record.type });
        } catch (e) {
            console.error("Decryption failed:", e);
            throw new Error("Decryption failed. Wrong password?");
        }
    }

    async getContents(parentId = 'root') {
        if (!this.db) await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('parentId');
            const req = index.getAll(parentId);

            req.onsuccess = () => {
                // Map results to exclude heavy data
                const results = req.result.map(r => ({
                    id: r.id,
                    name: r.name,
                    type: r.type,
                    size: r.size,
                    timestamp: r.timestamp,
                    isFolder: r.isFolder || false
                }));
                // Sort: Folders first, then files
                results.sort((a, b) => {
                    if (a.isFolder && !b.isFolder) return -1;
                    if (!a.isFolder && b.isFolder) return 1;
                    return a.name.localeCompare(b.name);
                });
                resolve(results);
            };
            req.onerror = () => reject(req.error);
        });
    }

    async deleteItem(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            // In a real VFS we'd need recursive delete for folders. 
            // For now, let's just delete the item. 
            // Users will have to empty folders before deleting them to avoid orphans.
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
}
