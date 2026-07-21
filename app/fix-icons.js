const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/home/jlameda/Documents/Proyectos/Turnos-main/app/**/*.html');

const replacements = [
  { rx: /📊/g, rep: '<i data-lucide="layout-dashboard"></i>' },
  { rx: /👥/g, rep: '<i data-lucide="users"></i>' },
  { rx: /✂️?/g, rep: '<i data-lucide="scissors"></i>' },
  { rx: /🏷/g, rep: '<i data-lucide="tag"></i>' },
  { rx: /👁/g, rep: '<i data-lucide="eye"></i>' }
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Move lucide script to <head>
  if (content.includes('<script src="https://unpkg.com/lucide@latest"></script>')) {
    // Remove from bottom
    content = content.replace(/  <script src="https:\/\/unpkg\.com\/lucide@latest"><\/script>\n/, '');
    // Remove creation call from bottom
    content = content.replace(/  <script>lucide\.createIcons\(\);<\/script>\n/, '');
    
    // Add to head
    if (!content.includes('unpkg.com/lucide@latest') && content.includes('</head>')) {
      content = content.replace('</head>', '  <script src="https://unpkg.com/lucide@latest"></script>\n</head>');
    }
  } else if (!content.includes('unpkg.com/lucide@latest') && content.includes('</head>')) {
    content = content.replace('</head>', '  <script src="https://unpkg.com/lucide@latest"></script>\n</head>');
  }
  
  // Re-add createIcons before body if not present
  if (!content.includes('lucide.createIcons();')) {
     content = content.replace('</body>', '  <script>lucide.createIcons();</script>\n</body>');
  }

  // Replace remaining emojis
  replacements.forEach(({ rx, rep }) => {
    content = content.replace(rx, rep);
  });
  
  // Replace admin logout button with user-pill
  const oldLogoutStr = '<div class="admin-topnav-right">\n        <button class="nav-link" id="logoutBtn" title="Cerrar Sesión">\n          <span class="icon"><i data-lucide="log-out"></i></span>\n        </button>\n      </div>';
  
  const oldLogoutRegex = /<div class="admin-topnav-right">\s*<button class="nav-link" id="logoutBtn"[^>]*>\s*<span class="icon"><i data-lucide="log-out"><\/i><\/span>\s*<\/button>\s*<\/div>/g;

  const newLogout = `<div class="admin-topnav-right">
        <div class="user-pill" id="userPill">
          <div class="avatar" id="userAvatar">A</div>
          <span id="userName">Admin</span>
          <button class="logout-btn" id="logoutBtn" title="Cerrar sesión"><i data-lucide="log-out"></i></button>
        </div>
      </div>`;
      
  content = content.replace(oldLogoutRegex, newLogout);

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});
