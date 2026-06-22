const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'Percy', 'Documents', 'SOFTWARE HH', 'Frontend-hhtsoluciona', 'src', 'app', '(dashboard)', 'finanzas', 'cajas', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Update KPIs calculations
content = content.replace(
  /const totalCapital = cajas.reduce.*/,
  "const totalCapital = cajas.reduce((sum, c) => sum + Number(c.saldoReal || 0), 0);\n  const totalRetenido = cajas.reduce((sum, c) => sum + Number(c.saldoComprometido || 0), 0);"
);

// Format function
if (!content.includes('formatCurrencyDynamic')) {
  content = content.replace(
    /export default function CajasPage/,
    "export const formatCurrencyDynamic = (value: number, moneda: string = 'PEN') => {\n  return new Intl.NumberFormat('es-PE', {\n    style: 'currency',\n    currency: moneda,\n    minimumFractionDigits: 2,\n  }).format(value);\n};\n\nexport default function CajasPage"
  );
}

// Update KPI grid
const oldKpiGrid = `      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <KPICard 
            label="Capital Total" 
            value={totalCapital} 
            subLabel="Suma de saldos fsicos"
            icon={<Wallet className="w-4 h-4 text-blue-600" />}
            color="bg-blue-600"
          />
          <KPICard 
            label="Fondo Disponible" 
            value={totalDisponible} 
            subLabel="Libre para nuevos gastos"
            icon={<ArrowUpRight className="w-4 h-4 text-emerald-600" />}
            color="bg-emerald-600"
          />
          <KPICard 
            label="Cuentas Activas" 
            value={cajas.length} 
            isCurrency={false}
            subLabel="Operativas en sistema"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
            color="bg-slate-900"
          />
      </div>`;
const newKpiGrid = `      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            label="Saldo Total en Cajas" 
            value={totalCapital} 
            subLabel="Suma de saldos físicos"
            icon={<Wallet className="w-4 h-4 text-slate-600" />}
            color="bg-slate-100 text-slate-800"
          />
          <KPICard 
            label="Fondos Retenidos" 
            value={totalRetenido} 
            subLabel="Por pagar u obligaciones"
            icon={<Lock className="w-4 h-4 text-orange-600" />}
            color="bg-orange-50 text-orange-800"
          />
          <KPICard 
            label="Saldo Disponible" 
            value={totalDisponible} 
            subLabel="Libre para nuevos gastos"
            icon={<ArrowUpRight className="w-4 h-4 text-emerald-600" />}
            color="bg-emerald-50 text-emerald-800"
          />
          <KPICard 
            label="Cuentas Activas" 
            value={cajas.length} 
            isCurrency={false}
            subLabel="Operativas en sistema"
            icon={<ShieldCheck className="w-4 h-4 text-blue-600" />}
            color="bg-blue-50 text-blue-800"
          />
      </div>`;
content = content.replace(oldKpiGrid, newKpiGrid);

// Change KPICard to support color classes
content = content.replace(
  /function KPICard.*{\s*return \(\s*<Card className="border-slate-200 shadow-sm overflow-hidden".*?>/,
  `function KPICard({ label, value, subLabel, icon, color, isCurrency = true }: any) {
    return (
        <Card className={cn("border-slate-200 shadow-sm overflow-hidden", color)} title={isCurrency ? formatCurrency(value) : undefined}>`
);
content = content.replace(
  /<div className={cn\("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-slate-50"\)}>/,
  `<div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm")}>`
);

// We need to completely rewrite the CajaCard component to meet the new Pro requirements.
const cajaCardMatch = content.match(/function CajaCard\(\{ caja, onEdit, onDelete, onHistory, onToggleProtect \}: any\) {[\s\S]*?\n}\n/);
if (cajaCardMatch) {
  const newCajaCard = `function CajaCard({ caja, onEdit, onDelete, onHistory, onToggleProtect }: any) {
    const isProtected = caja.esProtegida;
    const saldoReal = Number(caja.saldoReal || 0);
    const retenido = Number(caja.saldoComprometido || 0);
    const disponible = Number(caja.saldoDisponible || 0);
    const isOverdrawn = disponible < 0;

    return (
        <Card className={cn(
            "transition-all duration-300 overflow-hidden group relative shadow-sm hover:shadow-md border",
            isOverdrawn ? "border-red-400 bg-red-50/30" : "border-slate-200 bg-white"
        )}>
            {/* Cabecera de la Tarjeta */}
            <div className={cn(
                "p-5 border-b",
                isOverdrawn ? "border-red-100 bg-red-50" : "border-slate-100 bg-slate-50/50"
            )}>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                            isProtected ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-700"
                        )}>
                            {isProtected ? <Lock className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-black text-sm uppercase tracking-tighter text-slate-900 line-clamp-1" title={caja.nombre}>
                                {caja.nombre}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Badge variant="outline" className="text-[9px] font-bold uppercase px-1.5 py-0 border-slate-200 text-slate-500">
                                    {caja.tipo}
                                </Badge>
                                <Badge variant="outline" className="text-[9px] font-bold uppercase px-1.5 py-0 border-slate-200 text-slate-500">
                                    {caja.subtipo}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    {isOverdrawn && (
                        <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-[9px] uppercase font-black px-2 py-0.5 animate-pulse shadow-sm">
                            Sobregirada
                        </Badge>
                    )}
                </div>

                {/* Saldos Desglose */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Saldo Real</p>
                        <p className="text-sm font-black tracking-tighter text-slate-700">
                            {formatCurrencyDynamic(saldoReal, caja.moneda)}
                        </p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Retenido</p>
                        <p className="text-sm font-black tracking-tighter text-orange-600">
                            - {formatCurrencyDynamic(retenido, caja.moneda)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Saldo Disponible */}
            <div className={cn(
                "p-5 flex items-center justify-between",
                isOverdrawn ? "bg-red-50" : "bg-white"
            )}>
                <div>
                    <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        isOverdrawn ? "text-red-600" : "text-emerald-600"
                    )}>Saldo Disponible</p>
                    <p className={cn(
                        "text-2xl font-black tracking-tighter leading-none mt-1",
                        isOverdrawn ? "text-red-600" : "text-emerald-600"
                    )}>
                        {formatCurrencyDynamic(disponible, caja.moneda)}
                    </p>
                </div>
                
                {/* Acciones Rpidas Hover */}
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={onHistory} title="Ver Movimientos" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-primary">
                        <History className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onEdit} title="Editar Caja" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(caja)} title="Eliminar Caja" className="h-8 w-8 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div 
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={onToggleProtect}
                >
                    {isProtected ? <ShieldCheck className="w-3.5 h-3.5 text-slate-600" /> : <Unlock className="w-3 h-3 text-slate-400" />}
                    <span className="text-[9px] font-bold uppercase text-slate-500">
                        {isProtected ? "Bóveda" : "Pública"}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] font-bold uppercase text-slate-500 tracking-tighter">
                        {caja._count?.transacciones || 0} Movimientos
                    </span>
                </div>
            </div>
        </Card>
    );
}
`;
  content = content.replace(cajaCardMatch[0], newCajaCard);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done!');
