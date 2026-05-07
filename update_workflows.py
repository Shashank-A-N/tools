import os
import re

folders = ['image tools', 'video tools', 'audio tools', 'text tools', 'pdf tools']
base_path = r'c:\Users\shash\OneDrive\Desktop\web_tech_projects\file manager'

dark_mode_styles = """
    <style id="shadow-dark-fix">
        /* Dark Mode overrides for workflow UI */
        .dark body {
            background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a) !important;
            color: #f8fafc !important;
        }
        .dark .bg-white\/90 {
            background-color: rgba(30, 41, 59, 0.9) !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .dark .text-gray-900, .dark .text-gray-800, .dark .text-gray-700 {
            color: #f8fafc !important;
        }
        .dark .text-gray-600, .dark .text-gray-500 {
            color: #cbd5e1 !important;
        }
        .dark .bg-blue-50 {
            background-color: rgba(30, 58, 138, 0.3) !important;
            border-color: rgba(30, 58, 138, 0.5) !important;
        }
        .dark .bg-white {
            background-color: #1e293b !important;
            border-color: #334155 !important;
        }
        .dark .border-gray-300, .dark .border-gray-200 {
            border-color: #334155 !important;
        }
        .dark input, .dark select, .dark button#tool-select-btn {
            background-color: #0f172a !important;
            color: #f8fafc !important;
            border-color: #334155 !important;
        }
        .dark .bg-gray-50 {
            background-color: #0f172a !important;
        }
        .dark .border-b, .dark .border-t {
            border-color: #334155 !important;
        }
        .dark .bg-gray-200 {
            background-color: #334155 !important;
            color: #f8fafc !important;
        }
        .dark .bg-gray-100 {
            background-color: #0f172a !important;
            color: #94a3b8 !important;
        }
        .dark .hover\:bg-gray-50:hover {
            background-color: #334155 !important;
        }
        .dark .step-item::before {
            background-color: #334155 !important;
        }
        /* Modals */
        .dark #tool-modal .bg-white, .dark .modal-content {
            background-color: #1e293b !important;
            border-color: #334155 !important;
        }
        .dark .sticky.bg-white {
            background-color: #1e293b !important;
        }
        .dark .sticky.bg-gray-50, .dark .bg-gray-50.sticky {
            background-color: #0f172a !important;
        }
        
        /* Dynamic tool items */
        .dark .tool-item {
            border-color: #334155 !important;
            color: #f8fafc !important;
            background-color: #1e293b;
        }
        .dark .tool-item.cursor-not-allowed {
            background-color: #0f172a !important;
            color: #64748b !important;
        }
        .dark .tool-item.hover\:bg-blue-50:hover {
            background-color: rgba(30, 58, 138, 0.4) !important;
            border-color: #3b82f6 !important;
        }
        
        /* Text gradients */
        .dark h1.bg-gradient-to-r, .dark h2.bg-gradient-to-r {
            background-image: linear-gradient(to right, #f8fafc, #94a3b8) !important;
            -webkit-text-fill-color: transparent;
        }
        
        /* Badges */
        .dark .bg-blue-100 { background-color: rgba(30, 58, 138, 0.4) !important; color: #93c5fd !important; }
        .dark .bg-green-100 { background-color: rgba(20, 83, 45, 0.4) !important; color: #86efac !important; }
        .dark .bg-yellow-100 { background-color: rgba(113, 63, 18, 0.4) !important; color: #fde047 !important; }
    </style>
</head>"""

premium_btn_regex = re.compile(
    r'<button\s+class="bg-gradient-to-r\s+from-amber-300[^>]*Upgrade\s+to\s+Premium[^>]*>.*?Upgrade\s+to\s+Premium\s*</span>\s*</button>',
    re.DOTALL | re.IGNORECASE
)

for folder in folders:
    file_path = os.path.join(base_path, folder, 'workflow', 'index.html')
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}")
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove "Upgrade to Premium" button
    content = premium_btn_regex.sub('', content)
    
    # Remove any existing shadow-dark-fix to avoid duplicates
    content = re.sub(r'<style id="shadow-dark-fix">.*?</style>', '', content, flags=re.DOTALL)
    
    # Inject dark mode styles right before </head>
    if '<style id="shadow-dark-fix">' not in content:
        content = content.replace('</head>', dark_mode_styles)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Updated {file_path}")
