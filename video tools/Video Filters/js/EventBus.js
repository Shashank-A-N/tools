/**
 * EventBus.js
 * Simple Pub/Sub.
 */
export const bus = {
    events: {},
    on(event, callback) {
        if (!this.events[event]) this.events[event] = new Set();
        this.events[event].add(callback);
    },
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event].delete(callback);
    },
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(cb => cb(data));
    }
};
