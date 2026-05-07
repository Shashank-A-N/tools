const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const targets = [
    path.join(rootDir, 'video tools'),
    path.join(rootDir, 'audio tools')
];

let processed = 0, skipped = 0, errors = 0;

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (stat.isFile() && file.toLowerCase() === 'index.html') {
            if (dir === targets[0] || dir === targets[1]) continue;
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        const relPathRaw = path.relative(path.dirname(filePath), rootDir);
        const relPath = relPathRaw.replace(/\\/g, '/');

        if (!content.includes('id="shadow-light-fix"')) {
            let styleInject = `
    <!-- ShadowTools Light Mode Text Fix -->
    <style id="shadow-light-fix">
        /* Prevent invisible white text in light mode */
        .light-mode h1, .light-mode h2, .light-mode h3, .light-mode h4, .light-mode h5, .light-mode h6 {
            color: #0f172a;
        }
        .light-mode p, .light-mode span, .light-mode label, .light-mode li, .light-mode td, .light-mode th {
            color: #334155;
        }
        .light-mode .text-white { color: #0f172a !important; }
        .light-mode .text-gray-100, .light-mode .text-gray-200, .light-mode .text-gray-300 {
            color: #334155 !important;
        }
        .light-mode .text-slate-100, .light-mode .text-slate-200, .light-mode .text-slate-300 {
            color: #334155 !important;
        }
        .light-mode .text-slate-400 { color: #64748b !important; }
        .light-mode .text-slate-500 { color: #64748b !important; }

        /* Background fixes */
        .light-mode body {
            background-color: #f8fafc !important;
            color: #0f172a !important;
        }
        .light-mode .bg-gray-900, .light-mode .bg-slate-900 {
            background-color: #f1f5f9 !important;
        }
        .light-mode .bg-gray-800, .light-mode .bg-slate-800 {
            background-color: #e2e8f0 !important;
        }
        .light-mode .bg-gray-950, .light-mode .bg-slate-950 {
            background-color: #f8fafc !important;
        }
        .light-mode .bg-black { background-color: #f8fafc !important; }
        .light-mode .bg-black\\/20, .light-mode .bg-black\\/40, .light-mode .bg-black\\/50 {
            background-color: rgba(0,0,0,0.04) !important;
        }

        /* Border fixes */
        .light-mode .border-white\\/5, .light-mode .border-white\\/10 {
            border-color: rgba(0,0,0,0.08) !important;
        }
        .light-mode .border-slate-700, .light-mode .border-slate-600, .light-mode .border-gray-700 {
            border-color: #e2e8f0 !important;
        }

        /* Glass effect fix */
        .light-mode .glass, .light-mode .glass-effect {
            background: rgba(255,255,255,0.85) !important;
            border-color: rgba(0,0,0,0.08) !important;
        }

        /* Input fixes */
        .light-mode input, .light-mode textarea, .light-mode select {
            color: #0f172a;
            background-color: #fff;
            border-color: #cbd5e1;
        }
        .light-mode input::placeholder, .light-mode textarea::placeholder {
            color: #94a3b8;
        }

        /* Button text fix */
        .light-mode button { color: inherit; }

        /* Code / mono text */
        .light-mode code, .light-mode pre, .light-mode .font-mono {
            color: #334155;
        }

        /* Accent colors stay vivid */
        .light-mode .text-blue-400, .light-mode .text-blue-500 { color: #2563eb !important; }
        .light-mode .text-purple-400, .light-mode .text-purple-500 { color: #7c3aed !important; }
        .light-mode .text-green-400, .light-mode .text-green-500 { color: #16a34a !important; }
        .light-mode .text-red-400, .light-mode .text-red-500 { color: #dc2626 !important; }
        .light-mode .text-yellow-400, .light-mode .text-amber-400 { color: #d97706 !important; }
        .light-mode .text-cyan-400 { color: #0891b2 !important; }
        .light-mode .text-pink-400, .light-mode .text-pink-500 { color: #db2777 !important; }
        .light-mode .text-orange-400 { color: #ea580c !important; }

        /* Shadow/glow reduction */
        .light-mode [class*="shadow-"] { 
            --tw-shadow-color: rgba(0,0,0,0.06);
        }

        /* Nav bar in light mode */
        .light-mode nav, .light-mode header {
            background: rgba(248,250,252,0.9) !important;
            border-color: rgba(0,0,0,0.06) !important;
        }
        .light-mode nav a, .light-mode header a { color: #334155; }
        .light-mode nav a:hover, .light-mode header a:hover { color: #0f172a; }

        /* Footer */
        .light-mode footer {
            background-color: #f1f5f9 !important;
            border-color: rgba(0,0,0,0.06) !important;
            color: #475569 !important;
        }

        /* Canvas/3D dimming */
        .light-mode canvas { opacity: 0.15; }
        .light-mode #bg-3d-container { opacity: 0.1 !important; }
        .light-mode .noise-overlay { opacity: 0 !important; }
    </style>

    <style id="shadow-toggle-light">
        .light-mode .theme-toggle-btn {
            background: rgba(0,0,0,0.05) !important;
            border-color: rgba(0,0,0,0.1) !important;
            color: #f59e0b !important;
        }
    </style>
</head>`;
            if (!content.includes('shared/theme.css')) {
                styleInject = `
    <!-- ShadowTools Unified Theme System -->
    <link rel="stylesheet" href="${relPath}/shared/theme.css">
    <script src="${relPath}/shared/theme.js"></script>

    <!-- ShadowTools Auth System -->
    <link rel="stylesheet" href="${relPath}/shared/auth.css">
    <script src="${relPath}/shared/auth.js" defer></script>
` + styleInject;
            }
            content = content.replace(/<\/head>/i, styleInject);
            modified = true;
        }

        if (content.match(/<button[^>]*onclick="toggleTheme\(\)"[^>]*>.*?<\/button>/is)) {
            content = content.replace(/<button[^>]*onclick="toggleTheme\(\)"[^>]*>.*?<\/button>/gis, '');
            modified = true;
        }

        if (!content.includes('id="shadow-auth-ui"')) {
            const bodyInject = `\n    <button onclick="toggleTheme()" class="theme-toggle-btn" style="position:fixed;top:12px;right:12px;z-index:9999;width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;transition:all .3s;backdrop-filter:blur(8px);" title="Toggle Theme" aria-label="Toggle Theme"><i id="theme-icon" class="fas fa-moon"></i></button>\n    <!-- ShadowTools Auth Widget -->\n    <div id="shadow-auth-ui" style="position:fixed;top:12px;right:60px;z-index:9998;"></div>`;
            content = content.replace(/(<body[^>]*>)/i, `$1${bodyInject}`);
            modified = true;
        } else if (!content.match(/<button[^>]*onclick="toggleTheme\(\)"[^>]*>.*?<\/button>/is)) {
            const toggleInject = `\n    <button onclick="toggleTheme()" class="theme-toggle-btn" style="position:fixed;top:12px;right:12px;z-index:9999;width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;transition:all .3s;backdrop-filter:blur(8px);" title="Toggle Theme" aria-label="Toggle Theme"><i id="theme-icon" class="fas fa-moon"></i></button>`;
            content = content.replace(/(<body[^>]*>)/i, `$1${toggleInject}`);
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
            processed++;
        } else {
            skipped++;
        }
    } catch (err) {
        console.error(`Error processing ${filePath}: ${err}`);
        errors++;
    }
}

for (const currentTarget of targets) {
    if (fs.existsSync(currentTarget)) {
        processDirectory(currentTarget);
    }
}

console.log(`\nComplete! Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);
