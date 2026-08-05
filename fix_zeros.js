const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, regex, replacement) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(regex, replacement);
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed ' + path.basename(filePath));
  }
};

const uniPath = path.join(__dirname, 'src/components/crm/unidades-gerenciales.tsx');
let uniContent = fs.readFileSync(uniPath, 'utf8');
uniContent = uniContent.replace(/toLocaleString\('es-PE', { minimumFractionDigits: 2 }\)/g, "toLocaleString('es-PE', { minimumFractionDigits: 0 })");
fs.writeFileSync(uniPath, uniContent, 'utf8');

console.log('Zeros fixed in unidades-gerenciales');
