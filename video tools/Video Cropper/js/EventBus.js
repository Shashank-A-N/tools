/**
 * EventBus.js
 * 
 * A robust Publish/Subscribe event bus for decoupled communication between modules.
 * Supports namespaced events, one-time listeners, and debug logging.
 */

export class EventBus {
    constructor(debug = false) {
        this.listeners = new Map();
        this.debug = debug;
    }

    /**
     * Subscribe to an event.
     * @param {string} event - The event name.
     * @param {Function} callback - The callback function.
     * @returns {Function} - Unsubscribe function.
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        if (this.debug) {
            console.log(`[EventBus] Subscribed to "${event}"`);
        }

        // Return unsubscribe function for convenience
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event once.
     * @param {string} event - The event name.
     * @param {Function} callback - The callback function.
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event - The event name.
     * @param {Function} callback - The callback to remove.
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Emit an event to all subscribers.
     * @param {string} event - The event name.
     * @param {*} data - Data to pass to callbacks.
     */
    emit(event, data = null) {
        if (this.debug) {
            console.groupCollapsed(`[EventBus] Emitting "${event}"`);
            console.log('Data:', data);
            console.groupEnd();
        }

        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[EventBus] Error in listener for "${event}":`, error);
                }
            });
        }
    }

    /**
     * Clear all listeners.
     */
    clear() {
        this.listeners.clear();
    }
}

// Export a singleton instance for global use, but also export the class for testing/isolation.
export const bus = new EventBus();
