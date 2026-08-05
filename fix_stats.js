const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/crm/crm-stats.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The replacements we want to do
content = content.replace(/\['Ganado', 'Orden de Servicio', 'Perdido'\]/g, "['Cliente Fidelizado', 'Orden de Servicio', 'Perdido']");
content = content.replace(/\['Ganado', 'Orden de Servicio'\]/g, "['Cliente Fidelizado', 'Orden de Servicio']");
content = content.replace(/ha pasado a etapa "ganado"/g, 'ha pasado a etapa "cliente fidelizado"');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed crm-stats.tsx');
