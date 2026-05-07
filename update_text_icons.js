const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'text tools', 'index.html');

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

const iconMap = [
    { keyword: 'Base64', icon: 'fa-code' },
    { keyword: 'Binary', icon: 'fa-code' }, // Or fa-microchip
    { keyword: 'CSV', icon: 'fa-file-csv' },
    { keyword: 'JSON', icon: 'fa-file-code' },
    { keyword: 'Diff', icon: 'fa-columns' },
    { keyword: 'Duplicate', icon: 'fa-copy' },
    { keyword: 'Email', icon: 'fa-envelope' },
    { keyword: 'Find', icon: 'fa-search' },
    { keyword: 'Frequency', icon: 'fa-chart-bar' },
    { keyword: 'Hex', icon: 'fa-hashtag' },
    { keyword: 'Sort', icon: 'fa-sort-amount-down' },
    { keyword: 'Lorem', icon: 'fa-paragraph' },
    { keyword: 'Morse', icon: 'fa-broadcast-tower' },
    { keyword: 'Case', icon: 'fa-font' },
    { keyword: 'Converter', icon: 'fa-exchange-alt' },
    { keyword: 'Generator', icon: 'fa-magic' },
    { keyword: 'Remover', icon: 'fa-trash-alt' },
    { keyword: 'Extractor', icon: 'fa-magnet' }, // or fa-filter
    { keyword: 'Stats', icon: 'fa-chart-pie' },
    { keyword: 'Calculator', icon: 'fa-calculator' },
    { keyword: 'Counter', icon: 'fa-calculator' }
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
console.log('Successfully updated text tool icons.');
