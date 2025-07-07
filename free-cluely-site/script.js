document.addEventListener('DOMContentLoaded', () => {
    const sections = {
        'project-documentation': `docs/assets/PROJECT_DOCUMENTATION.md`,
        'system-design': `docs/assets/SYSTEM_DESIGN.md`,
        'data-flow': `docs/assets/DATA_FLOW.md`,
        'stealth-features': `docs/assets/STEALTH_FEATURES.md`,
        'readme': `docs/assets/README.md`,
        'system-architecture': `docs/assets/system-architecture.txt`
    };

    const fetchAndDisplay = async (sectionId, filePath) => {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let content = await response.text();
            const element = document.getElementById(sectionId);
            
            if (filePath.endsWith('.md')) {
                // Super simple markdown to HTML
                content = content
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                    .replace(/\*(.*)\*/gim, '<em>$1</em>')
                    .replace(/```(.+?)```/gis, '<pre><code>$1</code></pre>')
                    .replace(/`(.+?)`/gim, '<code>$1</code>')
                    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
                    .replace(/\n/g, '<br>');
            } else {
                 content = '<pre>' + content + '</pre>';
            }

            element.innerHTML = content;
        } catch (error) {
            console.error(`Failed to fetch ${filePath}:`, error);
            const element = document.getElementById(sectionId);
            element.innerHTML = `<p>Error loading content from <code>${filePath}</code>.</p>`;
        }
    };

    for (const [sectionId, filePath] of Object.entries(sections)) {
        fetchAndDisplay(sectionId, `../${filePath}`);
    }
});
