/**
 * Shadow Toolkit — Unified Theme System
 * 
 * This script handles dark/light theme toggling with:
 * - localStorage persistence (key: 'shadow-theme')
 * - Bridges legacy 'color-theme' key for Tailwind-based tools
 * - Cross-tab synchronization
 * - Flash-of-wrong-theme prevention (IIFE runs immediately)
 * - Toggles both '.light-mode' class AND Tailwind 'dark' class
 * - Icon updates (supports both Lucide and Font Awesome)
 */

// IIFE: Apply saved theme BEFORE DOM renders to prevent flash
(function () {
    const saved = localStorage.getItem('shadow-theme');
    // Also check legacy key for backwards compatibility
    const legacy = localStorage.getItem('color-theme');

    let isLight = false;

    if (saved === 'light' || (!saved && legacy === 'light')) {
        isLight = true;
    } else if (!saved && !legacy) {
        // Default: dark mode (no preference saved)
        isLight = false;
    }

    if (isLight) {
        document.documentElement.classList.add('light-mode');
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.remove('light-mode');
        document.documentElement.classList.add('dark');
    }

    // Sync both keys
    if (!saved && legacy) {
        localStorage.setItem('shadow-theme', legacy === 'light' ? 'light' : 'dark');
    }
})();

/**
 * Toggle between dark and light themes.
 * Updates localStorage, toggles CSS classes, and updates icons.
 */
function toggleTheme() {
    const isLight = document.documentElement.classList.toggle('light-mode');

    // Also toggle Tailwind 'dark' class for tools using dark: prefixes
    if (isLight) {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }

    // Persist in both keys for cross-compatibility
    localStorage.setItem('shadow-theme', isLight ? 'light' : 'dark');
    localStorage.setItem('color-theme', isLight ? 'light' : 'dark');

    updateThemeIcon(isLight);
}

/**
 * Update the theme toggle icon based on current mode.
 * Supports multiple icon elements (some pages have duplicates).
 * @param {boolean} isLight - Whether light mode is active
 */
function updateThemeIcon(isLight) {
    // Update all elements with id='theme-icon' (querySelectorAll for duplicate IDs)
    const icons = document.querySelectorAll('#theme-icon, [data-theme-icon]');
    icons.forEach(function(icon) {
        // Check if Lucide is available (main PDF page)
        if (typeof lucide !== 'undefined' && icon.hasAttribute('data-lucide')) {
            icon.setAttribute('data-lucide', isLight ? 'sun' : 'moon');
            lucide.createIcons();
        } else {
            // Font Awesome
            icon.className = isLight
                ? 'fas fa-sun text-amber-400 transition-transform duration-300'
                : 'fas fa-moon transition-transform duration-300';
        }
    });
}

// On DOMContentLoaded, ensure icon reflects current state
document.addEventListener('DOMContentLoaded', function () {
    const isLight = document.documentElement.classList.contains('light-mode');
    updateThemeIcon(isLight);
});

// Cross-tab sync: listen for theme changes in other tabs/windows
window.addEventListener('storage', function (e) {
    if (e.key === 'shadow-theme' || e.key === 'color-theme') {
        const shouldBeLight = e.newValue === 'light';
        document.documentElement.classList.toggle('light-mode', shouldBeLight);
        document.documentElement.classList.toggle('dark', !shouldBeLight);
        updateThemeIcon(shouldBeLight);

        // Keep both keys synced
        if (e.key === 'shadow-theme') {
            localStorage.setItem('color-theme', e.newValue);
        } else {
            localStorage.setItem('shadow-theme', e.newValue);
        }
    }
});
