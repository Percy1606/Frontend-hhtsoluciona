"use client";

import { ProyeccionFinanciera } from "@/types/finanzas";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectionPanelProps {
  data: ProyeccionFinanciera[];
}

export function ProjectionPanel({ data }: ProjectionPanelProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {data.map((p) => {
          const isNegative = p.saldoProyectado < 0;
          return (
            <div 
              key={p.dias} 
              className={cn(
                "p-4 rounded-2xl border transition-all",
                isNegative 
                  ? "bg-red-50 border-red-100 shadow-sm" 
                  : "bg-slate-50 border-slate-100"
              )}
            >
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">
                A {p.dias} días
              </p>
              <p className={cn(
                "text-sm font-black tracking-tighter",
                isNegative ? "text-red-600" : "text-primary"
              )}>
                {formatCurrency(p.saldoProyectado)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {isNegative ? (
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                ) : p.cobros > p.pagos ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-orange-500" />
                )}
                <span className={cn(
                  "text-[9px] font-bold uppercase",
                  isNegative ? "text-red-500" : "text-slate-400"
                )}>
                  {isNegative ? "Riesgo de Liquidez" : p.cobros > p.pagos ? "Superávit" : "Déficit"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 h-10">Plazo</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 h-10">Fecha Estimada</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 h-10 text-right">Cobros (+) </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 h-10 text-right">Pagos (-)</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 h-10 text-right">Saldo Proyectado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((p) => (
              <TableRow key={p.dias} className="hover:bg-slate-50/50">
                <TableCell className="font-black text-xs h-12 text-primary">{p.dias} Días</TableCell>
                <TableCell className="text-xs font-medium text-muted-foreground">
                  {new Date(p.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                </TableCell>
                <TableCell className="text-right font-bold text-emerald-600 text-xs">
                  {formatCurrency(p.cobros)}
                </TableCell>
                <TableCell className="text-right font-bold text-red-600 text-xs">
                  {formatCurrency(p.pagos)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge className={cn(
                    "font-black text-[10px] border-none",
                    p.saldoProyectado >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  )}>
                    {formatCurrency(p.saldoProyectado)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
