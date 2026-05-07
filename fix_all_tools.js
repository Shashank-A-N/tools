/**
 * ShadowTools — Complete Integration Script
 * 
 * Fixes three issues across ALL tool HTML files:
 * 1. Injects auth.css + auth.js (if missing)
 * 2. Adds a visible theme toggle button in the nav/header (if missing)
 * 3. Adds light-mode text-fix CSS to prevent invisible white text
 * 
 * Usage: node fix_all_tools.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// Directories to scan
const TOOL_DIRS = ['audio tools', 'image tools', 'video tools', 'text tools'];

// Root-level tool folders
const ROOT_TOOL_DIRS = [
    'E-Sign-PDF', 'HEIC-Converter', 'Markdown to PDF Converter',
    'PDF-Flattener', 'PDF-Secret-Hider', 'Q&A_pdf', 'Secure-Drop',
    'ai-summery', 'all-to-html'
];

// Files to skip
const SKIP_FILES = new Set([
    path.resolve(ROOT, 'index.html'),
    path.resolve(ROOT, 'pdf_tools.html'),
    path.resolve(ROOT, 'shadow.html'),
]);
TOOL_DIRS.forEach(dir => {
    SKIP_FILES.add(path.resolve(ROOT, dir, 'index.html'));
});

let stats = { auth: 0, toggle: 0, lightfix: 0, skipped: 0, errors: 0 };

function getRelPath(filePath, targetDir) {
    const fileDir = path.dirname(filePath);
    return path.relative(fileDir, path.join(ROOT, targetDir)).replace(/\\/g, '/');
}

function findHtmlFiles(dirPath) {
    const results = [];
    if (!fs.existsSync(dirPath)) return results;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            if (['node_modules', '.git', 'shared', '.gemini'].includes(entry.name)) continue;
            results.push(...findHtmlFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

// ========================================
// LIGHT-MODE FIX CSS (injected inline)
// ========================================
const LIGHT_FIX_CSS = `
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
    </style>`;

// ========================================
// THEME TOGGLE BUTTON HTML
// ========================================
const TOGGLE_BTN = `<button onclick="toggleTheme()" class="theme-toggle-btn" style="position:fixed;top:12px;right:12px;z-index:9999;width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;transition:all .3s;backdrop-filter:blur(8px);" title="Toggle Theme" aria-label="Toggle Theme"><i id="theme-icon" class="fas fa-moon"></i></button>`;

// Style for the fixed toggle in light mode
const TOGGLE_LIGHT_STYLE = `
    <style id="shadow-toggle-light">
        .light-mode .theme-toggle-btn {
            background: rgba(0,0,0,0.05) !important;
            border-color: rgba(0,0,0,0.1) !important;
            color: #f59e0b !important;
        }
    </style>`;

function processFile(filePath) {
    const resolvedPath = path.resolve(filePath);
    if (SKIP_FILES.has(resolvedPath)) {
        stats.skipped++;
        return;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    const relShared = getRelPath(filePath, 'shared');
    let modified = false;

    // 1. INJECT AUTH (if missing)
    if (!content.includes('auth.js') && !content.includes('auth.css')) {
        const authInject = `\n    <!-- ShadowTools Auth System -->\n    <link rel="stylesheet" href="${relShared}/auth.css">\n    <script src="${relShared}/auth.js" defer></script>`;

        if (content.includes('</head>')) {
            content = content.replace('</head>', `${authInject}\n</head>`);
            stats.auth++;
            modified = true;
        }
    }

    // 2. ADD AUTH UI CONTAINER (if missing)
    if (!content.includes('shadow-auth-ui')) {
        // Try to find nav or header to insert into
        // Insert right after <body> as a fixed-position element
        if (content.includes('<body')) {
            const bodyMatch = content.match(/<body[^>]*>/);
            if (bodyMatch) {
                const authContainer = `\n    <!-- ShadowTools Auth Widget -->\n    <div id="shadow-auth-ui" style="position:fixed;top:12px;right:60px;z-index:9998;"></div>`;
                content = content.replace(bodyMatch[0], bodyMatch[0] + authContainer);
                modified = true;
            }
        }
    }

    // 3. ADD LIGHT-MODE CSS FIX (if missing)
    if (!content.includes('shadow-light-fix')) {
        if (content.includes('</head>')) {
            content = content.replace('</head>', `${LIGHT_FIX_CSS}\n</head>`);
            stats.lightfix++;
            modified = true;
        }
    }

    // 4. ADD THEME TOGGLE BUTTON (if missing and no existing toggle)
    const hasToggle = content.includes('toggleTheme()') || 
                      content.includes('theme-toggle') ||
                      content.includes('theme-icon');
    
    if (!hasToggle) {
        if (content.includes('<body')) {
            const bodyMatch = content.match(/<body[^>]*>/);
            if (bodyMatch) {
                content = content.replace(bodyMatch[0], bodyMatch[0] + '\n    ' + TOGGLE_BTN);
                // Also add the light-mode style for the toggle
                if (!content.includes('shadow-toggle-light')) {
                    content = content.replace('</head>', `${TOGGLE_LIGHT_STYLE}\n</head>`);
                }
                stats.toggle++;
                modified = true;
            }
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✓ ${path.relative(ROOT, filePath)}`);
    } else {
        console.log(`  ○ ${path.relative(ROOT, filePath)} (no changes needed)`);
    }
}

console.log('═══════════════════════════════════════════');
console.log('  ShadowTools — Complete Integration Fix');
console.log('═══════════════════════════════════════════\n');

// Process tool category directories
for (const dir of TOOL_DIRS) {
    const fullDir = path.join(ROOT, dir);
    console.log(`\n📁 ${dir}/`);
    const htmlFiles = findHtmlFiles(fullDir);
    for (const file of htmlFiles) {
        processFile(file);
    }
}

// Process root-level tool directories
console.log(`\n📁 root-level tools/`);
for (const dir of ROOT_TOOL_DIRS) {
    const fullDir = path.join(ROOT, dir);
    const htmlFiles = findHtmlFiles(fullDir);
    for (const file of htmlFiles) {
        processFile(file);
    }
}

console.log('\n═══════════════════════════════════════════');
console.log(`  Auth injected:     ${stats.auth} files`);
console.log(`  Toggle added:      ${stats.toggle} files`);
console.log(`  Light-fix added:   ${stats.lightfix} files`);
console.log(`  Skipped:           ${stats.skipped} files`);
console.log('═══════════════════════════════════════════\n');
