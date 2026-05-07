/**
 * QueueUI.js
 * Manages the playlist sidebar rendering.
 */
import { store } from './StateManager.js';
import { bus } from './EventBus.js';

export class QueueUI {
    constructor(container) {
        this.container = container;
        this.setupListeners();
    }

    setupListeners() {
        bus.on('stateChanged', ({ state }) => {
            this.render(state.playlist, state.activeIndex);
        });
    }

    render(playlist, activeIndex) {
        this.container.innerHTML = '';

        if (playlist.length === 0) {
            this.container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                    <i class="fas fa-film text-4xl mb-2"></i>
                    <span class="text-xs uppercase tracking-widest">Queue Empty</span>
                </div>
            `;
            return;
        }

        playlist.forEach((item, index) => {
            const isActive = index === activeIndex;
            const el = document.createElement('div');
            el.className = `
                group relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer
                ${isActive
                    ? 'bg-fuchsia-500/10 border-fuchsia-500/50 shadow-neon-sm'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}
            `;

            // Generate visual status or thumbnail placeholder
            // Ideally we'd capture a thumbnail, but for now use icon

            el.innerHTML = `
                <div class="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${isActive ? 'bg-fuchsia-500 text-white' : 'bg-slate-800 text-slate-400'}">
                    <i class="fas fa-play text-xs"></i>
                </div>
                
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}">${item.name}</div>
                    <div class="text-xs text-slate-500 flex items-center gap-2">
                        <span>${isActive ? 'Editing' : 'Queued'}</span>
                        ${item.status === 'done' ? '<i class="fas fa-check text-green-400"></i>' : ''}
                    </div>
                </div>

                <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="btn-remove p-2 hover:text-red-400 text-slate-500 transition-colors" title="Remove">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;

            // Clicks
            el.onclick = (e) => {
                if (e.target.closest('.btn-remove')) {
                    e.stopPropagation();
                    store.removeVideo(item.id);
                } else {
                    store.selectVideo(index);
                }
            };

            this.container.appendChild(el);
        });
    }
}
