const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/home/jlameda/Documents/Proyectos/Turnos-main/app/**/*.html');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/\uFE0F/g, '');
  
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Cleaned: ${file}`);
  }
});
