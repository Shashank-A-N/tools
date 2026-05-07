const fs = require('fs');
const path = require('path');

const devToolsDir = path.join(__dirname, 'developer tools');
const indexPath = path.join(devToolsDir, 'index.html');
const workflowPath = path.join(devToolsDir, 'workflow', 'index.html');

if (!fs.existsSync(indexPath) || !fs.existsSync(workflowPath)) {
    console.error('Missing index.html or workflow/index.html');
    process.exit(1);
}

let indexContent = fs.readFileSync(indexPath, 'utf8');
let workflowContent = fs.readFileSync(workflowPath, 'utf8');

// Extract tools array from index.html
const toolsMatch = indexContent.match(/const\s+tools\s*=\s*(\[[\s\S]*?\]);/);
if (!toolsMatch) {
    console.error('Could not find tools array in index.html');
    process.exit(1);
}

let tools;
try {
    tools = eval(toolsMatch[1]);
} catch (e) {
    console.error('Failed to parse tools array', e);
    process.exit(1);
}

let toolUrls = {};
let allTools = {
    utility: [],
    convert: [],
    generator: [],
    analysis: []
};

let toolProps = {};
let toolIcons = {};

tools.forEach(t => {
    let title = t.title;
    // Map URLs relative to workflow folder
    let link = t.link;
    if (link && link.startsWith('./')) {
        link = '../' + link.substring(2);
    }
    toolUrls[title] = link;
    
    let cat = t.category || 'utility';
    if (!allTools[cat]) allTools[cat] = [];
    allTools[cat].push(title);
    
    // Default compatibility
    toolProps[title] = { compatible: [] };
    
    let iconMatch = t.icon.match(/fa-[a-z0-9-]+/);
    if (iconMatch) {
        // We can't use fontawesome SVG paths easily here if we don't know them, 
        // but we can map class to standard icon name if needed.
        // Actually, the workflow template uses SVG paths, so we will just provide a default path
        toolIcons[title] = 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
    }
});

const urlsStr = JSON.stringify(toolUrls, null, 4);
const allToolsStr = JSON.stringify(allTools, null, 4);
const propsStr = JSON.stringify(toolProps, null, 4);
const iconsStr = JSON.stringify(toolIcons, null, 4);

// Replace in workflowContent
workflowContent = workflowContent.replace(/const\s+toolUrls\s*=\s*\{[\s\S]*?\};/, `const toolUrls = ${urlsStr};`);
workflowContent = workflowContent.replace(/const\s+allTools\s*=\s*\{[\s\S]*?\};/, `const allTools = ${allToolsStr};`);
workflowContent = workflowContent.replace(/const\s+toolProps\s*=\s*\{[\s\S]*?\};/, `const toolProps = ${propsStr};`);
workflowContent = workflowContent.replace(/const\s+toolIcons\s*=\s*\{[\s\S]*?\};/, `const toolIcons = ${iconsStr};`);

// Also update localStorage keys for developer tools
workflowContent = workflowContent.replace(/shadowWorkflows_text/g, 'shadowWorkflows_developer');

// And rename title if needed
workflowContent = workflowContent.replace(/Text Tools/g, 'Developer Tools');

fs.writeFileSync(workflowPath, workflowContent, 'utf8');
console.log('Successfully generated developer tools workflow.');
