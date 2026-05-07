/**
 * DocuMind AI Application UI & Logic
 */

let documentStore = {
    documents: [],
    activeDocumentIndex: -1
};

// UI Elements
const els = {
    tabs: document.querySelectorAll('.nav-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    uploadBtn: document.getElementById('header-upload-btn'),
    uploadModal: document.getElementById('upload-modal'),
    closeModalBtn: document.getElementById('close-modal'),
    doneModalBtn: document.getElementById('done-modal'),
    fileInput: document.getElementById('modal-file-input'),
    mainFileInput: document.getElementById('main-file-upload'),
    documentList: document.getElementById('document-list'),
    emptyState: document.getElementById('empty-docs-state'),
    viewerContent: document.getElementById('viewer-content'),
    viewerPlaceholder: document.getElementById('viewer-placeholder'),
    activeDocTitle: document.getElementById('active-doc-title'),
    mockDocContent: document.getElementById('mock-doc-content'),
    chatInput: document.getElementById('chat-input'),
    sendBtn: document.getElementById('send-btn'),
    chatMessages: document.getElementById('chat-messages'),
    suggestBtns: document.querySelectorAll('.suggest-btn')
};

// Toggle Tabs
els.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        els.tabs.forEach(t => t.classList.remove('active', 'text-indigo-400'));
        tab.classList.add('active');
        
        els.tabPanes.forEach(pane => pane.classList.add('hidden'));
        document.getElementById(`view-${tab.dataset.tab}`).classList.remove('hidden');
    });
});

// Modal Logic
function openModal() {
    els.uploadModal.classList.remove('hidden');
    // slight delay for transition
    setTimeout(() => {
        els.uploadModal.classList.remove('opacity-0', 'pointer-events-none');
        els.uploadModal.querySelector('#upload-modal-content').classList.remove('scale-95');
    }, 10);
}

function closeModal() {
    els.uploadModal.classList.add('opacity-0', 'pointer-events-none');
    els.uploadModal.querySelector('#upload-modal-content').classList.add('scale-95');
    setTimeout(() => els.uploadModal.classList.add('hidden'), 300);
}

els.uploadBtn.addEventListener('click', openModal);
els.closeModalBtn.addEventListener('click', closeModal);
els.doneModalBtn.addEventListener('click', closeModal);

// File Upload Handler Setup 
async function handleFiles(files) {
    if(!files || files.length === 0) return;
    
    for (const file of files) {
        if(file.type !== 'application/pdf') {
            alert('Only PDF supported in this beta.');
            continue;
        }

        // Add to UI as Loading
        const docId = Date.now().toString();
        const docEl = createDocSidebarItem(file.name, true, docId);
        els.documentList.appendChild(docEl);
        els.emptyState.classList.add('hidden');

        try {
            const parsed = await parsePDF(file);
            documentStore.documents.push({
                id: docId,
                name: file.name,
                text: parsed.text,
                pages: parsed.pages
            });
            
            // Update Loading to Ready
            updateDocSidebarItem(docId, false);
            selectDocument(documentStore.documents.length - 1);
        } catch (e) {
            console.error(e);
            alert("Failed to parse " + file.name + "\n" + e.message + "\n" + (e.name ? e.name : ""));
            docEl.remove();
        }
    }
}

els.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
els.mainFileInput.addEventListener('change', (e) => handleFiles(e.target.files));

// Sidebar Item
function createDocSidebarItem(name, isLoading, id) {
    const div = document.createElement('div');
    div.className = `flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border surface-dark mb-2 doc-item`;
    div.dataset.id = id;
    
    if(isLoading) {
        div.classList.add('bg-slate-800/20', 'border-slate-800');
        div.innerHTML = `
            <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-semibold text-slate-300 truncate">${name}</h4>
                <p class="text-[10px] text-slate-500 truncate">Parsing vectors...</p>
            </div>
        `;
    }
    
    return div;
}

function updateDocSidebarItem(id, isLoading) {
    const docEl = document.querySelector(`.doc-item[data-id="${id}"]`);
    if(docEl) {
        const docObj = documentStore.documents.find(d => d.id === id);
        
        docEl.className = `flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border surface-dark hover:bg-slate-800 mb-2 doc-item border-slate-700/50 bg-slate-900/30`;
        docEl.innerHTML = `
            <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                <i class="fas fa-file-pdf"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-semibold text-slate-300 text-dark truncate">${docObj.name}</h4>
                <p class="text-[10px] text-slate-500 text-muted truncate">${docObj.pages} Pages • Ready</p>
            </div>
        `;
        
        docEl.addEventListener('click', () => {
            const idx = documentStore.documents.findIndex(d => d.id === id);
            selectDocument(idx);
        });
    }
}

function selectDocument(index) {
    documentStore.activeDocumentIndex = index;
    const docObj = documentStore.documents[index];
    
    // UI states
    document.querySelectorAll('.doc-item').forEach(el => el.classList.remove('ring-1', 'ring-indigo-500', 'bg-slate-800'));
    const docEl = document.querySelector(`.doc-item[data-id="${docObj.id}"]`);
    if(docEl) docEl.classList.add('ring-1', 'ring-indigo-500', 'bg-slate-800');
    
    els.viewerPlaceholder.classList.add('hidden');
    els.viewerContent.classList.remove('hidden');
    els.viewerContent.classList.add('flex');
    
    els.activeDocTitle.textContent = docObj.name;
    document.getElementById('active-doc-meta').textContent = `${docObj.pages} Pages • Parsed with OCR`;
    
    // Simple render 
    els.mockDocContent.innerHTML = docObj.text.replace(/\n/g, '<br/>');
}

// Chat UI 
let isStreaming = false;

function generateId() { return Math.random().toString(36).substr(2, 9); }

function appendMessage(role, content, id = generateId()) {
    const isUser = role === 'user';
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex gap-3 ${isUser ? 'flex-row-reverse' : ''} mb-6 message-enter`;
    msgDiv.id = `msg-${id}`;
    
    const avatar = document.createElement('div');
    avatar.className = `flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${isUser ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20' : 'bg-slate-800 border border-slate-700/50 surface-dark text-amber-400'}`;
    avatar.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-brain"></i>';
    
    const textBubble = document.createElement('div');
    textBubble.className = `max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${isUser ? 'bg-indigo-600 text-white rounded-tr-sm border border-indigo-500' : 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-tl-sm prose prose-invert prose-slate surface-dark text-dark'}`;
    
    if(isUser) {
        textBubble.textContent = content;
    } else {
        textBubble.innerHTML = marked.parse(content);
        textBubble.classList.add('bot-msg-content');
    }
    
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(textBubble);
    els.chatMessages.appendChild(msgDiv);
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    
    return id;
}

function updateMessageContent(id, partialContent) {
    const msgDiv = document.getElementById(`msg-${id}`);
    if(msgDiv) {
        const textBubble = msgDiv.querySelector('.bot-msg-content');
        textBubble.innerHTML = marked.parse(partialContent);
        els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    }
}

async function handleSendMessage(msg) {
    const text = typeof msg === 'string' ? msg : els.chatInput.value.trim();
    if(!text || isStreaming) return;
    
    // Check if we have documents
    if(documentStore.documents.length === 0) {
        alert("Please upload a document to begin chatting!");
        els.tabs[0].click(); // navigate back to docs
        return;
    }

    els.chatInput.value = '';
    els.chatInput.style.height = '52px';
    
    // Clear suggested links container if it's there
    if(els.chatMessages.querySelectorAll('.suggest-btn').length > 0) {
        els.chatMessages.innerHTML = '';
    }

    appendMessage('user', text);
    isStreaming = true;
    els.sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    els.chatInput.disabled = true;

    const botMsgId = appendMessage('bot', '');
    let accumulatedText = "";
    
    // Build context from active document or all documents
    const context = documentStore.documents.map(d => d.text).join('\n\n');

    await generateResponseStream(text, context, (chunk) => {
        accumulatedText += chunk;
        updateMessageContent(botMsgId, accumulatedText);
    });

    isStreaming = false;
    els.sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    els.chatInput.disabled = false;
    els.chatInput.focus();
}

els.sendBtn.addEventListener('click', handleSendMessage);
els.chatInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

// Auto size textarea
els.chatInput.addEventListener('input', function() {
    this.style.height = '52px';
    this.style.height = (this.scrollHeight) + 'px';
});

// Suggested Buttons
els.suggestBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const query = btn.querySelector('p').textContent;
        handleSendMessage(query);
    });
});

/** Wait for theme injection overrides for Light/Dark fixes */
window.addEventListener('load', () => {
    const toggleBtn = document.getElementById('custom-theme-toggle');
    if(toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            // trigger the global toggle from Auth System
            if(typeof window.toggleTheme === 'function') {
                window.toggleTheme();
                const icon = toggleBtn.querySelector('i');
                if(document.body.classList.contains('light-mode')){
                    icon.className = 'fas fa-moon text-lg text-slate-500';
                } else {
                    icon.className = 'fas fa-sun text-lg text-amber-400';
                }
            }
        });
        
        // Initial setup
        if(document.body.classList.contains('light-mode')) {
            toggleBtn.querySelector('i').className = 'fas fa-moon text-lg text-slate-500';
        }
    }
});
