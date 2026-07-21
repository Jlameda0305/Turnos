const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/home/jlameda/Documents/Proyectos/Turnos-main/app/admin/*.html');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix remaining calendar emoji if any
  content = content.replace(/<span class="icon">🗓<\/span>/g, '<span class="icon"><i data-lucide="calendar"></i></span>');

  // Insert "Principal" header before dashboard
  // Look for: <a href="dashboard.html"
  content = content.replace(/(<a href="dashboard\.html"[^>]*>)/g, '<div class="nav-section-title">Principal</div>\n        $1');

  // Insert "Gestión" header before turnos
  // Look for: <a href="turnos.html"
  content = content.replace(/(<a href="turnos\.html"[^>]*>)/g, '<div class="nav-section-title">Gestión</div>\n        $1');

  // Ensure we don't insert twice if run multiple times
  content = content.replace(/<div class="nav-section-title">Principal<\/div>\n\s*<div class="nav-section-title">Principal<\/div>/g, '<div class="nav-section-title">Principal</div>');
  content = content.replace(/<div class="nav-section-title">Gestión<\/div>\n\s*<div class="nav-section-title">Gestión<\/div>/g, '<div class="nav-section-title">Gestión</div>');

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated navigation in: ${file}`);
  }
});
