/**
 * StateManager.js
 * 
 * Centralized state management with Undo/Redo history stacks.
 * Uses immutable patterns to ensure state integrity.
 */

import { bus } from './EventBus.js';
import { Utils } from './Utils.js';

export class StateManager {
    constructor(initialState = {}) {
        this.state = Utils.deepClone(initialState);
        this.past = [];
        this.future = [];
        this.maxHistory = 50; // Limit history to prevent memory issues

        // Listen for internal state requests
        bus.on('requestState', () => {
            bus.emit('stateUpdated', this.state);
        });
    }

    /**
     * Get the current state.
     * @returns {Object} - A deep copy of the state.
     */
    getState() {
        return Utils.deepClone(this.state);
    }

    /**
     * Update the state.
     * @param {Object} partialState - The new state values to merge.
     * @param {string} actionDescription - Description for the undo history.
     */
    setState(partialState, actionDescription = 'State Update') {
        const timestamp = Date.now();

        // Push current state to past
        if (this.past.length >= this.maxHistory) {
            this.past.shift(); // Remove oldest
        }
        this.past.push({
            state: Utils.deepClone(this.state),
            description: actionDescription,
            timestamp
        });

        // Clear future on new action
        this.future = [];

        // Apply new state
        this.state = {
            ...this.state,
            ...Utils.deepClone(partialState)
        };

        this._emitUpdate();
    }

    /**
     * Undo the last action.
     */
    undo() {
        if (this.past.length === 0) return;

        const previous = this.past.pop();

        // Push current to future
        this.future.push({
            state: Utils.deepClone(this.state),
            description: previous.description, // Reusing description
            timestamp: Date.now()
        });

        // Restore past state
        this.state = previous.state;

        this._emitUpdate('undo');
    }

    /**
     * Redo the last undone action.
     */
    redo() {
        if (this.future.length === 0) return;

        const next = this.future.pop();

        // Push current to past
        this.past.push({
            state: Utils.deepClone(this.state),
            description: next.description,
            timestamp: Date.now()
        });

        // Restore future state
        this.state = next.state;

        this._emitUpdate('redo');
    }

    /**
     * Reset state to initial or empty.
     * @param {Object} newState 
     */
    reset(newState = {}) {
        this.state = Utils.deepClone(newState);
        this.past = [];
        this.future = [];
        this._emitUpdate('reset');
    }

    /**
     * Emit state update event.
     * @param {string} type - Type of update (update, undo, redo, reset).
     */
    _emitUpdate(type = 'update') {
        bus.emit('stateChanged', {
            state: this.getState(),
            canUndo: this.past.length > 0,
            canRedo: this.future.length > 0,
            type
        });
    }
}

// Global default state
export const defaultState = {
    video: {
        src: null,
        duration: 0,
        width: 0,
        height: 0,
        isPlaying: false,
        currentTime: 0,
        volume: 1,
        muted: false
    },
    crop: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        aspectRatio: null // null (free), 16/9, 1, etc.
    },
    filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        invert: 0
    },
    trim: {
        start: 0,
        end: 0
    },
    ui: {
        isProcessing: false,
        processingProgress: 0,
        currentPanel: 'crop' // crop, adjust, filter, export
    }
};

export const store = new StateManager(defaultState);
