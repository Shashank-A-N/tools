/**
 * Recorder.js
 * 
 * Handles format negotiation, stream capture, and the MediaRecorder lifecycle.
 * Ensures high bitrate and correct MIME types.
 */

import { bus } from './EventBus.js';
import { Utils } from './Utils.js';

export class Recorder {
    constructor() {
        this.mediaRecorder = null;
        this.chunks = [];
        this.isRecording = false;
        this.options = {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 8000000 // 8 Mbps high quality
        };
    }

    /**
     * Start recording a stream.
     * @param {MediaStream} stream - The stream to record.
     */
    start(stream) {
        if (!stream) {
            console.error('No stream provided to Recorder');
            return;
        }

        this.chunks = [];

        // Browser compatibility check
        if (!MediaRecorder.isTypeSupported(this.options.mimeType)) {
            console.warn(`Type ${this.options.mimeType} not supported, falling back to default.`);
            delete this.options.mimeType; // Browser default
        }

        try {
            this.mediaRecorder = new MediaRecorder(stream, this.options);
        } catch (e) {
            console.error('MediaRecorder initialization failed:', e);
            bus.emit('error', 'Failed to initialize recording.');
            return;
        }

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                this.chunks.push(e.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this._finalize();
        };

        this.mediaRecorder.onerror = (e) => {
            console.error('MediaRecorder error:', e);
            bus.emit('error', 'Recording error occurred.');
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        bus.emit('recordingStarted');
    }

    /**
     * Stop recording.
     */
    stop() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
        }
    }

    /**
     * Finalize the recording and trigger download.
     */
    _finalize() {
        const mimeType = this.mediaRecorder.mimeType || 'video/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        const size = Utils.formatBytes(blob.size);

        console.log(`Recording finished. Size: ${size}, Type: ${mimeType}`);

        bus.emit('recordingFinished', { blob, size, mimeType });
    }

    /**
     * Static helper to check supported types.
     */
    static getSupportedTypes() {
        const types = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm;codecs=h264',
            'video/mp4'
        ];
        return types.filter(type => MediaRecorder.isTypeSupported(type));
    }
}
