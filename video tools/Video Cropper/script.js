/**
 * Video Cropper Entry Point
 */
import { App } from './js/App.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    console.log("App Initialized globally as window.app");
});
