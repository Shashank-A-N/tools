const fs = require('fs');
const path = require('path');

const templates = {
    pdf: `<a href="../pdf tools/index.html" class="group relative p-2.5 rounded-xl bg-slate-800/50 hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/50 transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden">
                <div class="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <i class="fas fa-file-pdf text-sm"></i>
                </div>
                <span class="text-[10px] font-semibold text-slate-300 group-hover:text-white relative z-10">PDF Tools</span>
            </a>`,
    image: `<a href="../image tools/index.html" class="group relative p-2.5 rounded-xl bg-slate-800/50 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/50 transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden">
                <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <i class="fas fa-image text-sm"></i>
                </div>
                <span class="text-[10px] font-semibold text-slate-300 group-hover:text-white relative z-10">Image Tools</span>
            </a>`,
    text: `<a href="../text tools/index.html" class="group relative p-2.5 rounded-xl bg-slate-800/50 hover:bg-emerald-600/20 border border-white/5 hover:border-emerald-500/50 transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden">
                <div class="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <i class="fas fa-font text-sm"></i>
                </div>
                <span class="text-[10px] font-semibold text-slate-300 group-hover:text-white relative z-10">Text Tools</span>
            </a>`,
    video: `<a href="../video tools/index.html" class="group relative p-2.5 rounded-xl bg-slate-800/50 hover:bg-red-600/20 border border-white/5 hover:border-red-500/50 transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden">
                <div class="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                    <i class="fas fa-video text-sm"></i>
                </div>
                <span class="text-[10px] font-semibold text-slate-300 group-hover:text-white relative z-10">Video Tools</span>
            </a>`,
    audio: `<a href="../audio tools/index.html" class="group relative p-2.5 rounded-xl bg-slate-800/50 hover:bg-amber-600/20 border border-white/5 hover:border-amber-500/50 transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden">
                <div class="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <i class="fas fa-music text-sm"></i>
                </div>
                <span class="text-[10px] font-semibold text-slate-300 group-hover:text-white relative z-10">Audio Tools</span>
            </a>`,
    dev: `<a href="../developer tools/index.html" class="group relative p-2.5 rounded-xl bg-slate-800/50 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/50 transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden">
                <div class="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <i class="fas fa-code text-sm"></i>
                </div>
                <span class="text-[10px] font-semibold text-slate-300 group-hover:text-white relative z-10">Dev Tools</span>
            </a>`
};

function buildMenuHTML(idStr, currentSuite) {
    let html = `
<!-- Enhanced Apps Menu Dropdown -->
<div id="${idStr}" class="nav-dropdown hidden absolute top-16 left-4 sm:top-20 z-[80] transform transition-all duration-300 origin-top-left">
    <div class="glass-effect rounded-2xl p-4 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-slate-900/95 w-[260px]">
        
        <div class="flex items-center justify-between mb-4 px-2">
            <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Utilities</h3>
            <span class="text-[9px] bg-accent-500/20 text-accent-300 px-2 py-0.5 rounded-full border border-accent-500/30">v3.0</span>
        </div>

        <div class="flex flex-col gap-3">
            <a href="../index.html" class="group relative p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 hover:border-slate-500/50 transition-all duration-300 flex items-center gap-3 overflow-hidden">
                <div class="absolute inset-0 bg-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                    <i class="fas fa-home text-sm"></i>
                </div>
                <span class="text-xs font-semibold text-slate-300 group-hover:text-white relative z-10">Tool Manager Home</span>
            </a>

            <div class="grid grid-cols-2 gap-3">
`;

    const keys = ['pdf', 'image', 'text', 'video', 'audio', 'dev'];
    for(let key of keys) {
        if(key !== currentSuite) {
            html += `                ${templates[key]}\n`;
        }
    }

    html += `            </div>
        </div>
    </div>
</div>
`;
    return html;
}

function replaceMenu(filePath, suiteName) {
    if(!fs.existsSync(filePath)) {
        console.log("File not found:", filePath);
        return;
    }
    let html = fs.readFileSync(filePath, 'utf-8');
    
    // Find <div id="apps-dropdown" or <div id="apps-menu"
    let idStr = "apps-dropdown";
    let startIndex = html.indexOf('<div id="apps-dropdown"');
    if(startIndex === -1) {
        startIndex = html.indexOf('<div id="apps-menu"');
        idStr = "apps-menu";
    }
    
    if(startIndex === -1) {
        console.log("Menu not found in", filePath);
        return;
    }
    
    // find matching closing div
    let openCount = 0;
    let i = startIndex;
    while(i < html.length) {
        if(html.substring(i, i+4) === "<div") {
            openCount++;
            i += 4;
        } else if (html.substring(i, i+5) === "</div") {
            openCount--;
            i += 5;
            if(openCount === 0) {
                // found end of main div
                let endIndex = html.indexOf(">", i) + 1;
                
                let repHTML = buildMenuHTML(idStr, suiteName);
                
                let newHTML = html.substring(0, startIndex) + repHTML + html.substring(endIndex);
                fs.writeFileSync(filePath, newHTML, 'utf-8');
                console.log("Updated", filePath);
                break;
            }
        } else {
            i++;
        }
    }
}

const basePath = __dirname;
replaceMenu(path.join(basePath, 'pdf tools', 'index.html'), 'pdf');
replaceMenu(path.join(basePath, 'image tools', 'index.html'), 'image');
replaceMenu(path.join(basePath, 'video tools', 'index.html'), 'video');
replaceMenu(path.join(basePath, 'audio tools', 'index.html'), 'audio');
replaceMenu(path.join(basePath, 'text tools', 'index.html'), 'text');
replaceMenu(path.join(basePath, 'developer tools', 'index.html'), 'dev');
