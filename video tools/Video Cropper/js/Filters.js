/**
 * Filters.js
 * 
 * Manages filter presets and application logic.
 */

import { store } from './StateManager.js';
import { bus } from './EventBus.js';

export class Filters {
    constructor() {
        this.presets = {
            'normal': { brightness: 100, contrast: 100, saturation: 100, hue: 0, grayscale: 0, sepia: 0, invert: 0, blur: 0 },
            'cinematic': { brightness: 90, contrast: 120, saturation: 110, hue: 0, grayscale: 0, sepia: 20, invert: 0, blur: 0 },
            'noir': { brightness: 110, contrast: 130, saturation: 0, hue: 0, grayscale: 100, sepia: 0, invert: 0, blur: 0 },
            'vintage': { brightness: 100, contrast: 90, saturation: 80, hue: 0, grayscale: 0, sepia: 80, invert: 0, blur: 0 },
            'cyberpunk': { brightness: 110, contrast: 120, saturation: 150, hue: 15, grayscale: 0, sepia: 0, invert: 0, blur: 0 }
        };

        this._setupBusListeners();
    }

    _setupBusListeners() {
        bus.on('cmd:applyPreset', (name) => this.applyPreset(name));
        bus.on('cmd:updateFilter', (data) => this.updateFilter(data));
        bus.on('cmd:resetFilters', () => this.applyPreset('normal'));
    }

    /**
     * Apply a named preset.
     * @param {string} name 
     */
    applyPreset(name) {
        const preset = this.presets[name];
        if (preset) {
            store.setState({
                filters: { ...preset }
            }, `Apply Preset: ${name}`);
        }
    }

    /**
     * Update a specific filter value.
     * @param {Object} data - { key: 'brightness', value: 150 }
     */
    updateFilter({ key, value }) {
        const currentFilters = store.getState().filters;
        store.setState({
            filters: {
                ...currentFilters,
                [key]: value
            }
        }, `Filter: ${key}`);
    }
}
