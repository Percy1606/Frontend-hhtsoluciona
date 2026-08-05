const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { old: /"Contactado"/g, new: '"Contacto Inicial"' },
  { old: /'Contactado'/g, new: "'Contacto Inicial'" },
  { old: /"Llamada Realizada"/g, new: '"Contacto Inicial"' },
  { old: /'Llamada Realizada'/g, new: "'Contacto Inicial'" },
  { old: /"Visita Agendada"/g, new: '"Visita Comercial"' },
  { old: /'Visita Agendada'/g, new: "'Visita Comercial'" },
  { old: /"Inspecci\\u00f3n Realizada"/g, new: '"Visita Comercial"' },
  { old: /"Inspección Realizada"/g, new: '"Visita Comercial"' },
  { old: /'Inspección Realizada'/g, new: "'Visita Comercial'" },
  { old: /"Cotizaci\\u00f3n Enviada"/g, new: '"Cotización"' },
  { old: /"Cotización Enviada"/g, new: '"Cotización"' },
  { old: /'Cotización Enviada'/g, new: "'Cotización'" },
  { old: /"Ganado"/g, new: '"Cliente Fidelizado"' },
  { old: /'Ganado'/g, new: "'Cliente Fidelizado'" },
];

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync(srcDir, function(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // We do not want to replace "Ganado" indiscriminately if it's part of a variable like "montoGanado"
    // The regexes specifically look for quotes around the words, which is safe.
    
    for (let r of replacements) {
        content = content.replace(r.old, r.new);
    }
    
    // Fix Kanban columns specially to match the exact PDF order
    if (filePath.includes('client-kanban.tsx')) {
        const newColumns = \const columns = [
  { id: "Prospecto", title: "Prospecto", color: "bg-slate-400" },
  { id: "Contacto Inicial", title: "Contacto Inicial", color: "bg-cyan-500" },
  { id: "Visita Comercial", title: "Visita Comercial", color: "bg-indigo-500" },
  { id: "Seguimiento", title: "Seguimiento", color: "bg-pink-500" },
  { id: "Cotización", title: "Cotización", color: "bg-violet-500" },
  { id: "Negociación", title: "Negociación", color: "bg-orange-500" },
  { id: "Orden de Servicio", title: "Orden de Servicio", color: "bg-emerald-600" },
  { id: "Servicio Ejecutado", title: "Servicio Ejecutado", color: "bg-teal-500" },
  { id: "Facturación", title: "Facturación", color: "bg-blue-500" },
  { id: "Postventa", title: "Postventa", color: "bg-purple-500" },
  { id: "Cliente Fidelizado", title: "Cliente Fidelizado", color: "bg-success" },
  { id: "Perdido", title: "Perdido", color: "bg-error" },
];\;
        content = content.replace(/const columns = \\[[\\s\\S]*?\\];/, newColumns);
    }
    
    // Update CRM Types specially to include all the new ones exactly
    if (filePath.includes('types\\\\crm.ts') || filePath.includes('types/crm.ts')) {
        content = content.replace(/etapaComercial:.*?Perdido".*?;/, 'etapaComercial: "Prospecto" | "Contacto Inicial" | "Visita Comercial" | "Seguimiento" | "Cotización" | "Negociación" | "Orden de Servicio" | "Servicio Ejecutado" | "Facturación" | "Postventa" | "Cliente Fidelizado" | "Perdido";');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated: ' + filePath);
    }
});
