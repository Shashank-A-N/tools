const fs = require('fs');
const path = require('path');

const textWorkflowPath = path.join(__dirname, 'text tools', 'workflow', 'index.html');
const pdfWorkflowPath = path.join(__dirname, 'pdf tools', 'workflow', 'index.html');

let template = fs.readFileSync(textWorkflowPath, 'utf8');
let pdfOriginal = fs.readFileSync(pdfWorkflowPath, 'utf8');

// Extract config from pdfOriginal
const toolUrlsMatch = pdfOriginal.match(/const\s+toolUrls\s*=\s*\{[\s\S]*?\};/);
const allToolsMatch = pdfOriginal.match(/const\s+allTools\s*=\s*\{[\s\S]*?\};/);
const toolPropsMatch = pdfOriginal.match(/const\s+toolProps\s*=\s*\{[\s\S]*?\};/);
const toolIconsMatch = pdfOriginal.match(/const\s+toolIcons\s*=\s*\{[\s\S]*?\};/);

// Replace configs in template
template = template.replace(/const\s+toolUrls\s*=\s*\{[\s\S]*?\};/, toolUrlsMatch[0]);
template = template.replace(/const\s+allTools\s*=\s*\{[\s\S]*?\};/, allToolsMatch[0]);
template = template.replace(/const\s+toolProps\s*=\s*\{[\s\S]*?\};/, toolPropsMatch[0]);
template = template.replace(/const\s+toolIcons\s*=\s*\{[\s\S]*?\};/, toolIconsMatch[0]);

// Replace localStorage key
template = template.replace(/shadowWorkflows_text/g, 'shadowWorkflows_pdf');

// Replace openToolModal function to match PDF tools specific openToolModal logic (it uses compatible tools)
const openToolModalRegex = /function\s+openToolModal\(\)\s*\{[\s\S]*?function\s+closeToolModal\(\)/;
const pdfOpenToolModalMatch = pdfOriginal.match(openToolModalRegex);
if (pdfOpenToolModalMatch) {
    template = template.replace(openToolModalRegex, pdfOpenToolModalMatch[0]);
}

// Ensure MAX_STEPS is used
template = template.replace(/\/\/ --- DATA & CONFIG ---/, '// --- DATA & CONFIG ---\n            const MAX_STEPS = 4;');

// Replace hardcoded 10 with MAX_STEPS in updateAvailableTools
template = template.replace(/if \(workflowSteps\.length >= 10\)/g, 'if (workflowSteps.length >= MAX_STEPS)');
template = template.replace(/up to \$\{10\} tools/g, 'up to ${MAX_STEPS} tools');

// In PDF tools, updateAvailableTools also checks compatibleTools
const updateAvailableToolsRegex = /function\s+updateAvailableTools\(\)\s*\{[\s\S]*?function\s+renderPreview\(\)/;
const pdfUpdateAvailableToolsMatch = pdfOriginal.match(updateAvailableToolsRegex);
if (pdfUpdateAvailableToolsMatch) {
    template = template.replace(updateAvailableToolsRegex, pdfUpdateAvailableToolsMatch[0]);
}

fs.writeFileSync(pdfWorkflowPath, template, 'utf8');
console.log('PDF workflow upgraded successfully!');
