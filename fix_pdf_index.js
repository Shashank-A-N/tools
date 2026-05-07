const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pdf tools', 'index.html');
let html = fs.readFileSync(filePath, 'utf-8');

// 1. Inject auth UI
const authTarget = `<button onclick="toggleThemeAnimation()"`;
const authRepl = `<div class="flex items-center space-x-2 sm:space-x-3">\n                    <div id="shadow-auth-ui"></div>\n                </div>\n                <button onclick="toggleThemeAnimation()"`;

if(html.includes(authTarget) && !html.includes('id="shadow-auth-ui"')) {
    html = html.replace(authTarget, authRepl);
    console.log("Injected auth UI");
}

// 2. Inject JS logic for apps-menu-toggle
const jsTarget = `</script>\n</body>`;
const jsRepl = `
        // Apps Menu Toggle Logic
        const appsMenuBtn = document.getElementById('apps-menu-toggle');
        const appsDropdown = document.getElementById('apps-dropdown') || document.getElementById('apps-menu');
        if (appsMenuBtn && appsDropdown) {
            appsMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                appsDropdown.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!appsMenuBtn.contains(e.target) && !appsDropdown.contains(e.target)) {
                    appsDropdown.classList.add('hidden');
                }
            });
        }
</script>\n</body>`;

if(html.includes("</body>") && !html.includes('appsDropdown.classList.toggle')) {
    html = html.replace('</body>', `
        // Apps Menu Toggle Logic
        const appsMenuBtn = document.getElementById('apps-menu-toggle');
        const appsDropdown = document.getElementById('apps-dropdown') || document.getElementById('apps-menu');
        if (appsMenuBtn && appsDropdown) {
            appsMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                appsDropdown.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!appsMenuBtn.contains(e.target) && !appsDropdown.contains(e.target)) {
                    appsDropdown.classList.add('hidden');
                }
            });
        }
    </script>
</body>`);
    console.log("Injected JS toggler logic");
}

fs.writeFileSync(filePath, html, 'utf-8');
console.log("Done");
