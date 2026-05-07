const fs = require('fs');
const path = require('path');

const updates = [
    { type: 'audio', path: 'audio tools/index.html' },
    { type: 'image', path: 'image tools/index.html' },
    { type: 'text', path: 'text tools/index.html' },
    { type: 'video', path: 'video tools/index.html' }
];

const basePath = process.argv[2];

updates.forEach(update => {
    const toolsArrayPath = path.join(basePath, update.type + ' tools', 'tools_array.js');
    const indexPath = path.join(basePath, update.path);

    if (!fs.existsSync(toolsArrayPath) || !fs.existsSync(indexPath)) {
        console.log(`Skipping ${update.type}, files not found.`);
        return;
    }

    const newTools = fs.readFileSync(toolsArrayPath, 'utf8');
    let htmlContent = fs.readFileSync(indexPath, 'utf8');

    // Regex to find the tools array block
    // Looking for: const tools = [ ... ];
    const regex = /const tools = \[\s*([\s\S]*?)\s*\];/;

    if (regex.test(htmlContent)) {
        // We replace with the new content. 
        // Note: tools_array.js contains "const tools = [...];" so we replace the whole match.
        const newContent = htmlContent.replace(regex, newTools.trim());
        fs.writeFileSync(indexPath, newContent, 'utf8');
        console.log(`Updated ${update.path}`);
    } else {
        console.log(`Could not find tools array in ${update.path}`);
    }
});
