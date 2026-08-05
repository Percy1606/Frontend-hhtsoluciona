const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {}
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'src')).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

let changedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/Cliente Fidelizado/g, 'Ganado / Fidelizado')
    .replace(/CLIENTE FIDELIZADO/g, 'GANADO / FIDELIZADO')
    .replace(/cliente fidelizado/g, 'ganado / fidelizado');
    
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed ' + file);
    changedCount++;
  }
});

console.log('Total files changed: ' + changedCount);
