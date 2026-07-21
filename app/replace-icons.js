const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/home/jlameda/Documents/Proyectos/Turnos-main/app/**/*.html');

const replacements = [
  { rx: /⚙️?/g, rep: '<i data-lucide="settings"></i>' },
  { rx: /🚪/g, rep: '<i data-lucide="log-out"></i>' },
  { rx: /📅/g, rep: '<i data-lucide="calendar"></i>' },
  { rx: /✏️?/g, rep: '<i data-lucide="pencil"></i>' },
  { rx: /🗑️?/g, rep: '<i data-lucide="trash-2"></i>' },
  { rx: /✓/g, rep: '<i data-lucide="check"></i>' },
  { rx: /✕/g, rep: '<i data-lucide="x"></i>' },
  { rx: /◄/g, rep: '<i data-lucide="chevron-left"></i>' },
  { rx: /►/g, rep: '<i data-lucide="chevron-right"></i>' }
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Add Lucide script if not present
  if (!content.includes('lucide@latest')) {
    content = content.replace('</body>', '  <script src="https://unpkg.com/lucide@latest"></script>\n  <script>lucide.createIcons();</script>\n</body>');
  }

  // Replace emojis
  replacements.forEach(({ rx, rep }) => {
    content = content.replace(rx, rep);
  });
  
  // Try to find .innerHTML = assignments and append lucide.createIcons() to them
  // This is tricky, maybe it's better to just use a MutationObserver in utils.js
  
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
