"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FINANCIAL_DATA, PROJECTS_DATA, CRM_DATA } from "@/mocks/data";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  BarChart3, 
  DollarSign, 
  Wallet, 
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Receipt
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, formatDate } from "@/lib/utils";
import { CashFlowChart } from "@/components/finanzas/cash-flow-chart";

const financeStatus: Record<string, string> = {
  "Pagado": "bg-green-100 text-green-700",
  "Parcial": "bg-yellow-100 text-yellow-700",
  "Pendiente": "bg-blue-100 text-blue-700",
  "Vencido": "bg-red-100 text-red-700",
};

export default function FinanzasPage() {
  const totalFacturado = FINANCIAL_DATA.reduce((acc, curr) => acc + curr.monto, 0);
  const totalCobrado = totalFacturado - FINANCIAL_DATA.reduce((acc, curr) => acc + curr.saldo, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tight">Panel Financiero</h1>
          </div>
          <p className="text-muted-foreground mt-1 font-medium">Control de facturación, cobranzas y rentabilidad.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 font-bold border-primary text-primary">
            <Download className="w-4 h-4" /> Exportar
          </Button>
          <Button className="gap-2 font-bold bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20">
            <Plus className="w-4 h-4" /> Registrar Factura
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          label="Total Facturado" 
          value={totalFacturado} 
          icon={<Receipt className="w-5 h-5 text-blue-600" />} 
          trend="+12.5%"
          color="bg-blue-50"
        />
        <StatsCard 
          label="Total Cobrado" 
          value={totalCobrado} 
          icon={<Wallet className="w-5 h-5 text-green-600" />} 
          trend="85% Efec."
          color="bg-green-50"
        />
        <StatsCard 
          label="Utilidad Proyectada" 
          value={580000} 
          icon={<ArrowUpRight className="w-5 h-5 text-primary" />} 
          color="bg-primary/5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-primary uppercase tracking-tight flex items-center gap-2 text-sm">
              <ArrowUpRight className="w-5 h-5 text-success" />
              Flujo de Caja Mensual (S/.)
            </h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-success" /> Ingresos</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-error" /> Egresos</div>
            </div>
          </div>
          <div className="h-[280px]">
            <CashFlowChart />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col">
          <h3 className="font-black text-primary uppercase tracking-tight mb-6 flex items-center gap-2 text-sm">
            <ArrowDownRight className="w-5 h-5 text-error" />
            Cobranzas Críticas
          </h3>
          <div className="space-y-4 flex-1">
            <AlertItem 
              project="TALLANES PACKERS" 
              invoice="F001-000440" 
              amount={8400} 
              days={15} 
            />
            <AlertItem 
              project="RIO VERDE" 
              invoice="F001-000456" 
              amount={7500} 
              days={2} 
            />
          </div>
          <Button variant="outline" className="w-full mt-6 font-bold text-xs uppercase border-primary text-primary">Ver Todas las Cuentas</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por número de factura o cliente..." className="pl-10 h-10 border-border bg-muted/30" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold text-primary">FACTURA</TableHead>
              <TableHead className="font-bold text-primary">CLIENTE / PROYECTO</TableHead>
              <TableHead className="font-bold text-primary">FECHA EMISIÓN</TableHead>
              <TableHead className="font-bold text-primary">FECHA VENC.</TableHead>
              <TableHead className="font-bold text-primary text-right">MONTO</TableHead>
              <TableHead className="font-bold text-primary text-right">SALDO</TableHead>
              <TableHead className="font-bold text-primary">ESTADO</TableHead>
              <TableHead className="font-bold text-primary text-right">UTILIDAD EST.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FINANCIAL_DATA.map((inv) => {
              const project = PROJECTS_DATA.find(p => p.id === inv.proyectoId);
              const client = CRM_DATA.find(c => c.id === project?.clientId);
              return (
                <TableRow key={inv.id} className="hover:bg-muted/10 transition-colors group">
                  <TableCell className="font-black text-xs text-primary">{inv.numero}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-sm text-primary group-hover:text-secondary transition-colors">{client?.empresa}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px] uppercase font-medium">{project?.id}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-600">{formatDate(inv.fechaEmision)}</TableCell>
                  <TableCell className="text-sm font-bold text-slate-600">{formatDate(inv.fechaVencimiento)}</TableCell>
                  <TableCell className="text-right font-black text-sm text-primary">
                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(inv.monto)}
                  </TableCell>
                  <TableCell className="text-right font-black text-sm text-error">
                    {inv.saldo > 0 ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(inv.saldo) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border-none font-black text-[9px] uppercase tracking-wider", financeStatus[inv.estado])}>
                      {inv.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-sm text-primary bg-primary/5">
                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(inv.utilidadEstimada)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon, trend, color }: { label: string, value: number, icon: React.ReactNode, trend?: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-border shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-lg", color)}>
          {icon}
        </div>
        {trend && <Badge className="bg-white border-border text-slate-600 border font-bold text-[10px]">{trend}</Badge>}
      </div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-primary">
        {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(value)}
      </p>
    </div>
  );
}

function AlertItem({ project, invoice, amount, days }: { project: string, invoice: string, amount: number, days: number }) {
  return (
    <div className="p-4 bg-red-50 border-l-4 border-error rounded-r-xl shadow-sm group hover:bg-red-100 transition-colors">
      <div className="flex justify-between items-start mb-1">
        <p className="text-[10px] font-black text-error uppercase tracking-wider">Vencido hace {days} días</p>
        <p className="text-xs font-black text-error">
          {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)}
        </p>
      </div>
      <p className="text-sm font-bold text-slate-700 leading-none">{project}</p>
      <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Ref: {invoice}</p>
    </div>
  );
}
