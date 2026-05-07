/**
 * Controls.js
 * 
 * Abstracts the UI controls logic.
 * Binds sliders, buttons, and handles their specific interactions (like double-click to reset).
 */

import { bus } from './EventBus.js';

export class Controls {
    constructor() {
        this.bindSliders();
        this.bindPresets();
        this.bindAspectButtons();
    }

    bindSliders() {
        document.querySelectorAll('input[type=range][data-filter]').forEach(slider => {
            // Double click to reset to default
            slider.addEventListener('dblclick', () => {
                const key = slider.dataset.filter;
                // Defaults
                let def = 0;
                if (['brightness', 'contrast', 'saturation'].includes(key)) def = 100;

                slider.value = def;
                slider.dispatchEvent(new Event('input')); // Trigger update
            });
        });
    }

    bindPresets() {
        // Logic handled in App.js largely, but could be moved here for cleaner separation
    }

    bindAspectButtons() {
        // Logic handled in App.js
    }
}
