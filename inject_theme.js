/**
 * ShadowTools — Theme Injection Script
 * 
 * Injects shared/theme.css and shared/theme.js into every
 * tool HTML file that doesn't already include them.
 * 
 * Usage: node inject_theme.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SHARED_DIR = 'shared';

// Directories to scan (tool categories + root-level tool folders)
const TOOL_DIRS = [
    'audio tools',
    'image tools',
    'video tools',
    'text tools',
];

// Root-level tool folders (PDF tools that are in the root)
const ROOT_TOOL_DIRS = [
    'E-Sign-PDF', 'HEIC-Converter', 'Markdown to PDF Converter',
    'PDF-Flattener', 'PDF-Secret-Hider', 'Q&A_pdf', 'Secure-Drop',
    'ai-summery', 'all-to-html'
];

// Files to skip (hub pages already handled manually)
const SKIP_FILES = new Set([
    path.resolve(ROOT, 'index.html'),
    path.resolve(ROOT, 'pdf_tools.html'),
    path.resolve(ROOT, 'shadow.html'),
]);

// Also skip category hub index pages (already handled)
TOOL_DIRS.forEach(dir => {
    SKIP_FILES.add(path.resolve(ROOT, dir, 'index.html'));
});

let injectedCount = 0;
let skippedCount = 0;
let errorCount = 0;

function getRelativePathToShared(filePath) {
    const fileDir = path.dirname(filePath);
    const sharedPath = path.join(ROOT, SHARED_DIR);
    let rel = path.relative(fileDir, sharedPath).replace(/\\/g, '/');
    return rel;
}

function findHtmlFiles(dirPath) {
    const results = [];
    if (!fs.existsSync(dirPath)) return results;
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            // Skip node_modules, .git, shared, etc.
            if (['node_modules', '.git', 'shared', '.gemini'].includes(entry.name)) continue;
            results.push(...findHtmlFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

function injectTheme(filePath) {
    const resolvedPath = path.resolve(filePath);
    
    // Skip already-handled files
    if (SKIP_FILES.has(resolvedPath)) {
        console.log(`  SKIP (manual): ${path.relative(ROOT, filePath)}`);
        skippedCount++;
        return;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if already has theme.js
    if (content.includes('theme.js') || content.includes('theme.css')) {
        console.log(`  SKIP (has theme): ${path.relative(ROOT, filePath)}`);
        skippedCount++;
        return;
    }

    const relShared = getRelativePathToShared(filePath);
    
    const themeInject = `
    <!-- ShadowTools Unified Theme System -->
    <link rel="stylesheet" href="${relShared}/theme.css">
    <script src="${relShared}/theme.js"></script>`;

    // Strategy: inject right before </head>
    if (content.includes('</head>')) {
        content = content.replace('</head>', `${themeInject}\n</head>`);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✓ INJECTED: ${path.relative(ROOT, filePath)}`);
        injectedCount++;
    } else {
        console.log(`  ✗ ERROR (no </head>): ${path.relative(ROOT, filePath)}`);
        errorCount++;
    }
}

console.log('═══════════════════════════════════════════');
console.log('  ShadowTools — Theme Injection Script');
console.log('═══════════════════════════════════════════\n');

// Process tool category directories
for (const dir of TOOL_DIRS) {
    const fullDir = path.join(ROOT, dir);
    console.log(`\n📁 Scanning: ${dir}/`);
    const htmlFiles = findHtmlFiles(fullDir);
    for (const file of htmlFiles) {
        injectTheme(file);
    }
}

// Process root-level tool directories
console.log(`\n📁 Scanning: root-level tool folders`);
for (const dir of ROOT_TOOL_DIRS) {
    const fullDir = path.join(ROOT, dir);
    const htmlFiles = findHtmlFiles(fullDir);
    for (const file of htmlFiles) {
        injectTheme(file);
    }
}

console.log('\n═══════════════════════════════════════════');
console.log(`  ✓ Injected: ${injectedCount} files`);
console.log(`  ○ Skipped:  ${skippedCount} files`);
console.log(`  ✗ Errors:   ${errorCount} files`);
console.log('═══════════════════════════════════════════\n');
