const fs = require('fs');
const path = require('path');

const stages = "['Orden de Servicio', 'Servicio Ejecutado', 'Facturación', 'Postventa', 'Cliente Fidelizado']";

const replaceInFile = (filePath, regex, replacement) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(regex, replacement);
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed ' + path.basename(filePath));
  }
};

// 1. unidades-gerenciales.tsx
const uniPath = path.join(__dirname, 'src/components/crm/unidades-gerenciales.tsx');
let uniContent = fs.readFileSync(uniPath, 'utf8');
uniContent = uniContent.replace(/c\.etapaComercial === 'Cliente Fidelizado' \|\| c\.etapaComercial === 'Orden de Servicio'/g, "['Orden de Servicio', 'Servicio Ejecutado', 'Facturación', 'Postventa', 'Cliente Fidelizado'].includes(c.etapaComercial)");
fs.writeFileSync(uniPath, uniContent, 'utf8');

// 2. kpi-stats.tsx
const kpiPath = path.join(__dirname, 'src/components/dashboard/kpi-stats.tsx');
let kpiContent = fs.readFileSync(kpiPath, 'utf8');
kpiContent = kpiContent.replace(/\['Cliente Fidelizado', 'Orden de Servicio'\]/g, "['Orden de Servicio', 'Servicio Ejecutado', 'Facturación', 'Postventa', 'Cliente Fidelizado']");
fs.writeFileSync(kpiPath, kpiContent, 'utf8');

// 3. crm-stats.tsx
const crmStatsPath = path.join(__dirname, 'src/components/crm/crm-stats.tsx');
let crmStatsContent = fs.readFileSync(crmStatsPath, 'utf8');
crmStatsContent = crmStatsContent.replace(/\['Cliente Fidelizado', 'Orden de Servicio'\]/g, "['Orden de Servicio', 'Servicio Ejecutado', 'Facturación', 'Postventa', 'Cliente Fidelizado']");
crmStatsContent = crmStatsContent.replace(/\['Cliente Fidelizado', 'Orden de Servicio', 'Perdido'\]/g, "['Orden de Servicio', 'Servicio Ejecutado', 'Facturación', 'Postventa', 'Cliente Fidelizado', 'Perdido']");
fs.writeFileSync(crmStatsPath, crmStatsContent, 'utf8');

console.log('Post-closing stages fixed globally.');
