const fs = require('fs');
const path = require('path');

const folders = ['image tools', 'video tools', 'audio tools', 'text tools', 'developer tools'];
const basePath = __dirname;

const categoryColors = {
    'utility': { color: 'text-blue-400', bg: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5' },
    'effect': { color: 'text-purple-400', bg: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5' },
    'convert': { color: 'text-amber-400', bg: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5' },
    'editing': { color: 'text-rose-400', bg: 'bg-gradient-to-br from-rose-500/20 to-rose-500/5' },
    'generator': { color: 'text-emerald-400', bg: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5' },
    'analysis': { color: 'text-cyan-400', bg: 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/5' },
    'security': { color: 'text-red-400', bg: 'bg-gradient-to-br from-red-500/20 to-red-500/5' }
};

const defaultColor = { color: 'text-indigo-400', bg: 'bg-gradient-to-br from-indigo-500/20 to-indigo-500/5' };

folders.forEach(folder => {
    const filePath = path.join(basePath, folder, 'index.html');
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${filePath}`);
        return;
    }
    
    let html = fs.readFileSync(filePath, 'utf8');
    
    // We need to replace "color" and "bg" properties inside the tools array.
    // We can do this with regex matching the tool objects in the array.
    
    // A regex to match a whole tool object: \{[^\}]*"category"\s*:\s*"([^"]+)"[^\}]*\}
    // Wait, regex for JSON-like structure is hard. Let's find the tools array block.
    
    const startStr = "const tools = [";
    const startIdx = html.indexOf(startStr);
    if (startIdx === -1) {
        console.log(`Tools array not found in ${folder}`);
        return;
    }
    
    let openBrackets = 0;
    let endIdx = -1;
    for (let i = startIdx + startStr.length - 1; i < html.length; i++) {
        if (html[i] === '[') openBrackets++;
        else if (html[i] === ']') {
            openBrackets--;
            if (openBrackets === 0) {
                endIdx = i;
                break;
            }
        }
    }
    
    if (endIdx === -1) {
        console.log(`Could not find end of tools array in ${folder}`);
        return;
    }
    
    const toolsStr = html.substring(startIdx, endIdx + 1);
    
    // Replace color and bg based on category
    // Each tool is an object. We can use a replacer function on the whole toolsStr
    // matching: { ... "category": "...", ... }
    // Actually, simpler: split by '{', then inside each block find 'category', replace 'color' and 'bg'.
    
    const updatedToolsStr = toolsStr.replace(/\{[^{}]+\}/g, (match) => {
        const catMatch = match.match(/"category"\s*:\s*"([^"]+)"/);
        if (!catMatch) return match;
        
        const category = catMatch[1].toLowerCase().trim();
        const colors = categoryColors[category] || defaultColor;
        
        let newMatch = match.replace(/"color"\s*:\s*"[^"]+"/, `"color": "${colors.color}"`);
        newMatch = newMatch.replace(/"bg"\s*:\s*"[^"]+"/, `"bg": "${colors.bg}"`);
        
        return newMatch;
    });
    
    html = html.substring(0, startIdx) + updatedToolsStr + html.substring(endIdx + 1);
    
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`Updated colors for ${folder}`);
});
