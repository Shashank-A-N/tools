/**
 * MP4Parser.js
 * A lightweight recursive parser for MP4/MOV atom structure.
 */

export class MP4Parser {
    constructor(file) {
        this.file = file;
        this.structure = [];
    }

    async checkSignature() {
        // Read first 8 bytes
        const buffer = await this.slice(0, 8);
        const view = new DataView(buffer);
        const size = view.getUint32(0);
        const type = new TextDecoder().decode(buffer.slice(4, 8));

        // Debug
        console.log(`[MP4Parser] Detected Unit 1: Size=${size}, Type=${type}`);

        // Valid Root Atoms
        const valid = ['ftyp', 'moov', 'mdat', 'free', 'wide', 'skip', 'uuid', 'pnot'];

        // Check 1: Exact Match
        if (valid.includes(type)) return true;

        // Check 2: 'ftyp' with vendor specific (e.g. M4V, QT)
        // Usually safe if size is reasonable and type is alphanumeric
        if (/^[a-z0-9]{4}$/i.test(type) && size < 1000000) {
            console.warn(`[MP4Parser] Non-standard root '${type}', attempting parse...`);
            return true;
        }

        return { mismatch: true, found: type, bytes: new Uint8Array(buffer) };
    }

    async parse() {
        const sig = await this.checkSignature();
        if (sig.mismatch) {
            // Hex of found bytes 4-8
            const hex = Array.from(sig.bytes.slice(4, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
            throw new Error(`File Signature Mismatch. Expected [ftyp/moov], Found: "${sig.found}" (Hex: ${hex}). Parsing skipped to prevent crash.`);
        }
        this.structure = await this.readBoxes(0, this.file.size);
        return this.structure;
    }

    async readBoxes(start, end) {
        const boxes = [];
        let offset = start;

        while (offset < end) {
            // Read Size (4 bytes) and Type (4 bytes)
            if (offset + 8 > end) break; // EOF

            const headerBuffer = await this.slice(offset, offset + 8);
            const view = new DataView(headerBuffer);

            let size = view.getUint32(0);
            const type = new TextDecoder().decode(headerBuffer.slice(4, 8));

            let headerSize = 8;

            if (size === 1) {
                // Extended size (8 bytes)
                const extSizeBuffer = await this.slice(offset + 8, offset + 16);
                const extView = new DataView(extSizeBuffer);
                // JS Max Safe Int is 2^53, so we might lose precision on massive 64-bit ints, 
                // but for structure viewing it's "okay" to grab the lower 32 bits if upper is 0.
                size = Number(extView.getBigUint64(0));
                headerSize = 16;
            }

            if (size === 0) {
                // Box extends to end of file
                size = end - offset;
            }

            const box = {
                type,
                format: type.replace(/[^\w]/g, '.'), // Sanitize
                start: offset,
                size,
                children: []
            };

            // Container Boxes (recursive)
            const containers = ['moov', 'trak', 'mdia', 'minf', 'dinf', 'stbl', 'mvex', 'udta'];

            if (containers.includes(type)) {
                box.children = await this.readBoxes(offset + headerSize, offset + size);
            }

            boxes.push(box);
            offset += size;
        }
        return boxes;
    }

    async slice(start, end) {
        return await this.file.slice(start, end).arrayBuffer();
    }
}
