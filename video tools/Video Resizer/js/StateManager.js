/**
 * StateManager.js
 * Centralized state for Video Resizer.
 */
import { bus } from './EventBus.js';

class StateManager {
    constructor() {
        this.state = {
            video: {
                src: null,
                duration: 0,
                originalWidth: 0,
                originalHeight: 0,
                isPlaying: false
            },
            resize: {
                targetWidth: 1920,
                targetHeight: 1080,
                maintainAspectRatio: true,
                aspectRatio: 16 / 9
            },
            isProcessing: false
        };
    }

    getState() {
        return this.state;
    }

    setState(newState, triggerSource = 'Unknown') {
        const oldState = JSON.stringify(this.state);

        // Deep merge logic (simplified for this app)
        this.state = {
            ...this.state,
            ...newState,
            video: { ...this.state.video, ...newState.video },
            resize: { ...this.state.resize, ...newState.resize }
        };

        const hasChanged = oldState !== JSON.stringify(this.state);
        if (hasChanged) {
            bus.emit('stateChanged', { state: this.state, source: triggerSource });
        }
    }
}

export const store = new StateManager();
