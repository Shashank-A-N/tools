const fs = require('fs');
const path = require('path');

const categories = {
    audio: {
        'convert': ['convert', 'format', 'encoder', 'decoder'],
        'analysis': ['analysis', 'bpm', 'key', 'detect', 'meter', 'spectrogram', 'oscilloscope', 'decibel', 'phase'],
        'effect': ['effect', 'reverb', 'delay', 'chorus', 'distortion', 'phaser', 'flanger', 'equalizer', 'panner', 'boost', 'fade', 'reverse', 'voice changer', 'pitch', 'speed'],
        'editing': ['join', 'merge', 'cut', 'trim', 'split', 'mix', 'replace', 'remove', 'silence'],
        'generator': ['generator', 'tone', 'noise', 'binaural', 'dtmf', 'rhythm', 'text to speech'],
        'utility': ['utility', 'tag', 'renamer', 'organizer', 'loop', 'recorder']
    },
    image: {
        'edit': ['resize', 'crop', 'rotate', 'flip', 'upscale', 'compress', 'round', 'corner'],
        'convert': ['convert', 'to', 'pdf', 'html'],
        'effect': ['filter', 'background', 'black', 'white', 'blur', 'noise', 'color', 'noirify', 'clean'],
        'security': ['watermark', 'redact', 'steganography', 'hide'],
        'generator': ['generator', 'maker', 'passport', 'meme', 'qr', 'barcode']
    },
    text: {
        'convert': ['base64', 'binary', 'hex', 'csv', 'json', 'xml', 'yaml', 'html', 'markdown', 'encode', 'decode'],
        'generator': ['generator', 'lorem', 'ipsum', 'password', 'slug', 'ascii', 'art', 'qr', 'uuid'],
        'utility': ['diff', 'find', 'replace', 'sort', 'duplicate', 'remove', 'clean', 'format', 'case', 'join', 'split', 'transform'],
        'analysis': ['analysis', 'count', 'frequency', 'stat']
    },
    video: {
        'edit': ['edit', 'split', 'merge', 'trim', 'crop', 'rotate', 'flip', 'reverse', 'loop', 'speed', 'volume', 'stabilize'],
        'convert': ['convert', 'format', 'audio', 'extract', 'gif'],
        'security': ['blur', 'redact', 'steganography', 'hash', 'vault', 'watermark'],
        'analysis': ['metadata', 'bitrate', 'decoder', 'info'],
        'record': ['record', 'capture', 'screen', 'webcam']
    }
};

const iconMap = {
    'audio': 'fa-music',
    'sound': 'fa-volume-up',
    'image': 'fa-image',
    'photo': 'fa-camera',
    'text': 'fa-font',
    'code': 'fa-code',
    'video': 'fa-video',
    'movie': 'fa-film',
    'convert': 'fa-exchange-alt',
    'analysis': 'fa-chart-bar',
    'generator': 'fa-magic',
    'secure': 'fa-lock',
    'edit': 'fa-cut',
    'cut': 'fa-scissors',
    'crop': 'fa-crop',
    'trim': 'fa-cut',
    'split': 'fa-cut',
    'merge': 'fa-object-group',
    'join': 'fa-object-group',
    'rec': 'fa-circle',
    'play': 'fa-play',
    'pause': 'fa-pause',
    'stop': 'fa-stop',
    'loop': 'fa-sync',
    'time': 'fa-clock',
    'speed': 'fa-tachometer-alt',
    'vol': 'fa-volume-up',
    'mute': 'fa-volume-mute',
    'mic': 'fa-microphone',
    'cam': 'fa-camera',
    'screen': 'fa-desktop',
    'lock': 'fa-lock',
    'key': 'fa-key',
    'pass': 'fa-key',
    'user': 'fa-user',
    'file': 'fa-file',
    'fold': 'fa-folder',
    'save': 'fa-save',
    'down': 'fa-download',
    'up': 'fa-upload',
    'set': 'fa-cog',
    'cog': 'fa-cog',
    'tool': 'fa-tools',
    'info': 'fa-info-circle',
    'help': 'fa-question-circle',
    'filt': 'fa-filter',
    'sort': 'fa-sort',
    'search': 'fa-search',
    'eye': 'fa-eye',
    'hide': 'fa-eye-slash',
    'view': 'fa-eye',
    'mix': 'fa-sliders-h',
    'equal': 'fa-sliders-h',
    'level': 'fa-layer-group',
    'color': 'fa-palette',
    'paint': 'fa-paint-brush',
    'draw': 'fa-pencil-alt',
    'write': 'fa-pen',
    'text': 'fa-font',
    'font': 'fa-font',
    'list': 'fa-list'
};

function getCategory(title, desc, type) {
    const text = (title + ' ' + desc).toLowerCase();
    const typeCats = categories[type];
    for (const [cat, keywords] of Object.entries(typeCats)) {
        if (keywords.some(k => text.includes(k))) return cat;
    }
    return 'utility'; // Default
}

function getIcon(title, desc) {
    const text = (title + ' ' + desc).toLowerCase();
    // Try to match specific icons first
    for (const [key, icon] of Object.entries(iconMap)) {
        if (key.length > 2 && text.includes(key)) return icon;
    }
    return 'fa-tools';
}

function generateToolsArray(basePath, type) {
    const jsonPath = path.join(basePath, type + ' tools', 'tools_list_utf8.json');
    if (!fs.existsSync(jsonPath)) {
        console.log(`Skipping ${type}, file not found: ${jsonPath}`);
        return;
    }
    let content = fs.readFileSync(jsonPath, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    const tools = JSON.parse(content);

    // Sort tools alphabetically by title
    tools.sort((a, b) => a.title.localeCompare(b.title));

    const formattedTools = tools.map(t => {
        let cat = getCategory(t.title, t.desc, type);
        let icon = getIcon(t.title, t.desc);

        // Manual Overrides if needed
        if (t.title.includes("ASCII")) cat = "generator";

        return {
            title: t.title,
            desc: t.desc || "No description available.",
            icon: icon,
            color: "text-blue-400", // We could rotate colors if we want: blue, purple, green, red
            bg: "bg-blue-500/10",
            category: cat,
            link: `./${t.dir}/index.html`,
            tags: `${cat}, ${t.title.replace(/[^a-zA-Z0-9]/g, ' ')}, ${type}`
        };
    });

    const output = `const tools = ${JSON.stringify(formattedTools, null, 4)};`;
    const outputPath = path.join(basePath, type + ' tools', 'tools_array.js');
    fs.writeFileSync(outputPath, output);
    console.log(`Generated ${type} tools array at ${outputPath}`);
}

const basePath = process.argv[2];
if (!basePath) {
    console.error("Please provide base path");
    process.exit(1);
}

['audio', 'image', 'text', 'video'].forEach(type => generateToolsArray(basePath, type));
