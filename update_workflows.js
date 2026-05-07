const fs = require('fs');
const path = require('path');

const folders = ['image tools', 'video tools', 'audio tools', 'text tools', 'pdf tools', 'developer tools'];
const basePath = __dirname;

const darkModeStyles = `
    <style id="shadow-dark-fix">
        /* Dark Mode overrides for workflow UI */
        .dark body {
            background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a) !important;
            color: #f8fafc !important;
        }
        .dark .bg-white\\/90 {
            background-color: rgba(30, 41, 59, 0.95) !important;
            border-color: rgba(255, 255, 255, 0.2) !important;
        }
        .dark .text-gray-900, .dark .text-gray-800, .dark .text-gray-700, .dark .text-gray-600, .dark .text-gray-500, .dark .text-gray-400 {
            color: #f8fafc !important;
        }
        .dark svg.text-gray-500, .dark svg.text-gray-400, .dark svg {
            color: #f8fafc !important;
        }
        .dark .bg-blue-50 {
            background-color: rgba(30, 58, 138, 0.5) !important;
            border-color: rgba(59, 130, 246, 0.5) !important;
        }
        .dark .bg-white {
            background-color: #1e293b !important;
            border-color: #475569 !important;
        }
        .dark .border-gray-300, .dark .border-gray-200 {
            border-color: #475569 !important;
        }
        .dark input, .dark select, .dark button#tool-select-btn {
            background-color: #0f172a !important;
            color: #f8fafc !important;
            border-color: #475569 !important;
        }
        .dark .bg-gray-50 {
            background-color: #0f172a !important;
        }
        .dark .border-b, .dark .border-t {
            border-color: #475569 !important;
        }
        .dark .bg-gray-200 {
            background-color: #334155 !important;
            color: #f8fafc !important;
        }
        .dark .bg-gray-100 {
            background-color: #0f172a !important;
            color: #cbd5e1 !important;
        }
        .dark .hover\\:bg-gray-50:hover {
            background-color: #334155 !important;
        }
        .dark .step-item::before {
            background-color: #475569 !important;
        }
        /* Modals */
        .dark #tool-modal .bg-white, .dark .modal-content {
            background-color: #1e293b !important;
            border: 1px solid #475569 !important;
        }
        .dark .sticky.bg-white {
            background-color: #1e293b !important;
        }
        .dark .sticky.bg-gray-50, .dark .bg-gray-50.sticky {
            background-color: #0f172a !important;
        }
        
        /* Dynamic tool items */
        .dark .tool-item {
            border-color: #475569 !important;
            color: #f8fafc !important;
            background-color: #1e293b !important;
        }
        .dark .tool-item.cursor-not-allowed {
            background-color: #0f172a !important;
            color: #94a3b8 !important;
        }
        .dark .tool-item.hover\\:bg-blue-50:hover {
            background-color: rgba(30, 58, 138, 0.6) !important;
            border-color: #60a5fa !important;
        }
        
        /* Text gradients */
        .dark h1.bg-gradient-to-r, .dark h2.bg-gradient-to-r, .dark span.bg-gradient-to-r {
            background-image: linear-gradient(to right, #ffffff, #cbd5e1) !important;
            -webkit-text-fill-color: transparent;
        }
        
        /* Badges */
        .dark .bg-blue-100 { background-color: rgba(59, 130, 246, 0.2) !important; color: #93c5fd !important; }
        .dark .bg-green-100 { background-color: rgba(34, 197, 94, 0.2) !important; color: #86efac !important; }
        .dark .bg-yellow-100 { background-color: rgba(234, 179, 8, 0.2) !important; color: #fde047 !important; }
        
        /* Buttons */
        .dark button.bg-white {
            background-color: #1e293b !important;
            color: #f8fafc !important;
            border-color: #475569 !important;
        }
        .dark button.bg-white:hover {
            background-color: #334155 !important;
        }
    </style>
</head>`;

const premiumBtnRegex = /<button\s+class="bg-gradient-to-r\s+from-amber-300[^>]*>[\s\S]*?Upgrade\s+to\s+Premium\s*<\/span>\s*<\/button>/gi;

folders.forEach(folder => {
    const filePath = path.join(basePath, folder, 'workflow', 'index.html');
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove "Upgrade to Premium" button
    content = content.replace(premiumBtnRegex, '');
    
    // Remove any existing shadow-dark-fix to avoid duplicates
    content = content.replace(/<style id="shadow-dark-fix">[\s\S]*?<\/style>/g, '');
    
    // Inject dark mode styles right before </head>
    if (!content.includes('<style id="shadow-dark-fix">')) {
        content = content.replace('</head>', darkModeStyles);
    }
        
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
});
