const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'image tools', 'index.html');

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

const iconMap = [
    { keyword: 'Resize', icon: 'fa-expand-arrows-alt' },
    { keyword: 'Crop', icon: 'fa-crop-alt' },
    { keyword: 'Compress', icon: 'fa-compress' },
    { keyword: 'Convert', icon: 'fa-exchange-alt' },
    { keyword: 'Blur', icon: 'fa-user-secret' }, // Assuming face blur
    { keyword: 'Background', icon: 'fa-eraser' },
    { keyword: 'Remove', icon: 'fa-eraser' },
    { keyword: 'Meme', icon: 'fa-grin-squint' },
    { keyword: 'PDF', icon: 'fa-file-pdf' },
    { keyword: 'Rotate', icon: 'fa-sync-alt' },
    { keyword: 'Upscale', icon: 'fa-arrow-circle-up' },
    { keyword: 'Watermark', icon: 'fa-copyright' },
    { keyword: 'Color', icon: 'fa-palette' },
    { keyword: 'Noir', icon: 'fa-film' },
    { keyword: 'Filter', icon: 'fa-filter' },
    { keyword: 'Metadata', icon: 'fa-info-circle' },
    { keyword: 'SVG', icon: 'fa-bezier-curve' },
    { keyword: 'PNG', icon: 'fa-image' },
    { keyword: 'JPG', icon: 'fa-image' },
    { keyword: 'Editor', icon: 'fa-edit' }
];

// Regex to match tool objects in the array
const toolRegex = /"title":\s*"(.*?)",\s*"desc":\s*".*?",\s*"icon":\s*"(.*?)"/g;

content = content.replace(toolRegex, (match, title, currentIcon) => {
    let newIcon = currentIcon;
    for (const mapping of iconMap) {
        if (title.includes(mapping.keyword)) {
            newIcon = mapping.icon;
            break;
        }
    }
    return match.replace(`"icon": "${currentIcon}"`, `"icon": "${newIcon}"`);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated image tool icons.');
