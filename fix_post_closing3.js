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

const kpiPath = path.join(__dirname, 'src/components/dashboard/kpi-stats.tsx');
replaceInFile(kpiPath, /Facturaci.n/g, 'Facturación');

const crmStatsPath = path.join(__dirname, 'src/components/crm/crm-stats.tsx');
replaceInFile(crmStatsPath, /Facturaci.n/g, 'Facturación');

console.log('Facturación encoding fixed globally.');
