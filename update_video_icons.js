const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'video tools', 'index.html');

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

const iconMap = [
    { keyword: 'Subtitle', icon: 'fa-closed-captioning' },
    { keyword: 'Rotate', icon: 'fa-sync-alt' },
    { keyword: 'Frame', icon: 'fa-camera' },
    { keyword: 'Grabber', icon: 'fa-camera' },
    { keyword: 'Fusion', icon: 'fa-object-group' },
    { keyword: 'Merge', icon: 'fa-object-group' },
    { keyword: 'Metadata', icon: 'fa-info-circle' },
    { keyword: 'Scrubber', icon: 'fa-eraser' },
    { keyword: 'Privacy', icon: 'fa-user-secret' },
    { keyword: 'Blur', icon: 'fa-eye-slash' },
    { keyword: 'Redactor', icon: 'fa-user-secret' },
    { keyword: 'Secure', icon: 'fa-lock' },
    { keyword: 'Vault', icon: 'fa-shield-alt' },
    { keyword: 'Encoder', icon: 'fa-file-video' },
    { keyword: 'Decoder', icon: 'fa-file-video' },
    { keyword: 'Player', icon: 'fa-play-circle' },
    { keyword: 'Split', icon: 'fa-cut' },
    { keyword: 'Trim', icon: 'fa-cut' },
    { keyword: 'Compress', icon: 'fa-compress' },
    { keyword: 'Convert', icon: 'fa-exchange-alt' },
    { keyword: 'Loop', icon: 'fa-undo' },
    { keyword: 'Volume', icon: 'fa-volume-up' },
    { keyword: 'Speed', icon: 'fa-tachometer-alt' },
    { keyword: 'Stabilize', icon: 'fa-video' }
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
console.log('Successfully updated video tool icons.');
