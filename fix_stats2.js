const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/crm/crm-stats.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/Órdenes de Servicio \(Ganados\)/g, "Órdenes de Servicio / Fidelizados");
content = content.replace(/No hay clientes ganados para mostrar/g, "No hay clientes fidelizados para mostrar");
content = content.replace(/'GANADO'/g, "'CLIENTE FIDELIZADO'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed crm-stats.tsx cosmetic labels');
