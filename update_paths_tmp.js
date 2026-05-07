const fs = require('fs');
const path = require('path');

const pdfToolsDir = path.join(__dirname, 'pdf tools');

// 1. Update pdf tools/index.html
const indexFile = path.join(pdfToolsDir, 'index.html');
if (fs.existsSync(indexFile)) {
    let content = fs.readFileSync(indexFile, 'utf-8');
    
    const replacements = [
        ['href="styles.css"', 'href="../styles.css"'],
        ['href="shared/', 'href="../shared/'],
        ['src="shared/', 'src="../shared/'],
        ['href="image tools/', 'href="../image tools/'],
        ['href="text tools/', 'href="../text tools/'],
        ['href="video tools/', 'href="../video tools/'],
        ['href="audio tools/', 'href="../audio tools/'],
        ['src="logo-final.png"', 'src="../logo-final.png"'],
        ['href="manifest.json"', 'href="../manifest.json"'],
        ['href="/manifest.json"', 'href="../manifest.json"']
    ];
    
    replacements.forEach(([oldStr, newStr]) => {
        content = content.split(oldStr).join(newStr);
    });
    
    fs.writeFileSync(indexFile, content, 'utf-8');
}

// 2. Update sub-tools
function processDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            processDir(itemPath);
        } else if (item.endsWith('.html')) {
            let text = fs.readFileSync(itemPath, 'utf-8');
            text = text.split('href="../shared/').join('href="../../shared/');
            text = text.split('src="../shared/').join('src="../../shared/');
            text = text.split('href="../styles.css"').join('href="../../styles.css"');
            text = text.split('href="../index.html"').join('href="../../index.html"');
            text = text.split('src="../logo-final.png"').join('src="../../logo-final.png"');
            
            // Fix double application just in case
            text = text.split('../../../shared/').join('../../shared/');
            text = text.split('../../../styles.css').join('../../styles.css');
            fs.writeFileSync(itemPath, text, 'utf-8');
        }
    }
}

const items = fs.readdirSync(pdfToolsDir);
for (const item of items) {
    const itemPath = path.join(pdfToolsDir, item);
    if (fs.statSync(itemPath).isDirectory()) {
        processDir(itemPath);
    }
}
console.log('Done resolving HTML paths');
