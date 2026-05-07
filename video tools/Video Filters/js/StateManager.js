/**
 * StateManager.js
 * Centralized state for Video Filters (Batch Edition).
 */
import { bus } from './EventBus.js';
import { FilterEngine } from './FilterEngine.js';

class StateManager {
    constructor() {
        this.state = {
            playlist: [], // Array of { id, file, name, src, duration, width, height, filters, status }
            activeIndex: -1,
            isBatchProcessing: false,
            // Global UI state ?
        };
    }

    getState() {
        return this.state;
    }

    getActiveVideo() {
        if (this.state.activeIndex === -1 || !this.state.playlist.length) return null;
        return this.state.playlist[this.state.activeIndex];
    }

    setState(newState, source = 'Unknown') {
        const oldStateStr = JSON.stringify(this.state);
        this.state = { ...this.state, ...newState };

        if (oldStateStr !== JSON.stringify(this.state)) {
            bus.emit('stateChanged', { state: this.state, source });
        }
    }

    // --- Batch Actions ---

    addVideos(files) {
        const newItems = Array.from(files).map(file => ({
            id: crypto.randomUUID(),
            file: file,
            name: file.name,
            src: URL.createObjectURL(file), // Note: Might want to revoke these later
            duration: 0,
            width: 0,
            height: 0,
            filters: FilterEngine.getDefaults(),
            status: 'pending' // pending, processing, done, error
        }));

        const newList = [...this.state.playlist, ...newItems];
        // If it was empty, select the first one
        const newIndex = this.state.activeIndex === -1 ? 0 : this.state.activeIndex;

        this.setState({ playlist: newList, activeIndex: newIndex }, 'Files Added');

        // Trigger load for the active one if it was just added
        if (this.state.playlist.length === 0 && newItems.length > 0) {
            bus.emit('cmd:loadActiveVideo', newItems[0]);
        }
    }

    removeVideo(id) {
        const idx = this.state.playlist.findIndex(v => v.id === id);
        if (idx === -1) return;

        const item = this.state.playlist[idx];
        URL.revokeObjectURL(item.src); // Cleanup

        const newList = this.state.playlist.filter(v => v.id !== id);
        let newIndex = this.state.activeIndex;

        if (idx === this.state.activeIndex) {
            // We removed the active one, select the previous one or 0
            newIndex = Math.max(0, idx - 1);
            if (newList.length === 0) newIndex = -1;
        } else if (idx < this.state.activeIndex) {
            // We removed one before the active one, shift index down
            newIndex--;
        }

        this.setState({ playlist: newList, activeIndex: newIndex }, 'Video Removed');

        if (newIndex !== -1 && idx === this.state.activeIndex) {
            bus.emit('cmd:loadActiveVideo', newList[newIndex]);
        } else if (newList.length === 0) {
            bus.emit('cmd:clearStage');
        }
    }

    selectVideo(index) {
        if (index < 0 || index >= this.state.playlist.length) return;
        this.setState({ activeIndex: index }, 'Video Selected');
        bus.emit('cmd:loadActiveVideo', this.state.playlist[index]);
    }

    updateActiveFilters(filters) {
        const active = this.getActiveVideo();
        if (!active) return;

        const updatedList = [...this.state.playlist];
        updatedList[this.state.activeIndex] = {
            ...active,
            filters: { ...active.filters, ...filters }
        };

        this.setState({ playlist: updatedList }, 'Filters Updated');
    }

    applyFiltersToAll() {
        const active = this.getActiveVideo();
        if (!active) return;

        const filters = active.filters;
        const updatedList = this.state.playlist.map(v => ({
            ...v,
            filters: { ...filters }
        }));

        this.setState({ playlist: updatedList }, 'Applied to All');
    }

    updateVideoMetadata(id, meta) {
        const idx = this.state.playlist.findIndex(v => v.id === id);
        if (idx === -1) return;

        const updatedList = [...this.state.playlist];
        updatedList[idx] = { ...updatedList[idx], ...meta };
        this.setState({ playlist: updatedList }, 'Metadata Updated');
    }

    resetFilters() {
        const active = this.getActiveVideo();
        if (!active) return;

        const updatedList = [...this.state.playlist];
        updatedList[this.state.activeIndex] = {
            ...active,
            filters: FilterEngine.getDefaults()
        };
        this.setState({ playlist: updatedList }, 'Filters Reset');
    }
}

export const store = new StateManager();
