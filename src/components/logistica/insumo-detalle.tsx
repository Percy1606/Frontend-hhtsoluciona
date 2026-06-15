"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Insumo, MovimientoAlmacen } from "@/store/logistica-store";
import { Package, ArrowUpRight, ArrowDownLeft, Clock, History } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface InsumoDetalleProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: Insumo | null;
}

export function InsumoDetalle({ isOpen, onClose, insumo }: InsumoDetalleProps) {
  if (!insumo) return null;

  // Los movimientos vienen del backend via store cuando se consulta un insumo específico o se carga el kardex
  // Aquí asumiremos que el store ya tiene los movimientos o los pasamos si es necesario.
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 border-none bg-white overflow-hidden rounded-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 bg-primary text-white shrink-0">
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                <Package className="w-6 h-6 text-accent" />
                Detalles del Material
            </DialogTitle>
            <Badge variant="outline" className="text-[10px] font-black border-white/20 text-white uppercase px-3">
                {insumo.categoria}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Resumen Superior */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Actual</p>
                    <p className={cn("text-2xl font-black", insumo.stockActual <= insumo.stockMinimo ? "text-error" : "text-primary")}>
                        {insumo.stockActual} <span className="text-xs text-slate-400 font-bold uppercase">{insumo.unidadMedida}</span>
                    </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Mínimo</p>
                    <p className="text-2xl font-black text-slate-700">
                        {insumo.stockMinimo}
                    </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Unitario</p>
                    <p className="text-2xl font-black text-emerald-600">
                        S/ {Number(insumo.precioReferencial || 0).toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="font-black text-lg text-primary uppercase tracking-tight">{insumo.nombre}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 italic">
                    {insumo.descripcion || "Sin descripción detallada registrada."}
                </p>
            </div>

            {/* Historial Reciente */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                    <History className="w-4 h-4" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest">Movimientos Recientes</h3>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="text-[9px] font-black uppercase py-3">Fecha</TableHead>
                                <TableHead className="text-[9px] font-black uppercase">Tipo</TableHead>
                                <TableHead className="text-[9px] font-black uppercase">Cant.</TableHead>
                                <TableHead className="text-[9px] font-black uppercase">Motivo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(!insumo.movimientos || insumo.movimientos.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-[10px] font-bold text-slate-400 uppercase italic">
                                        No hay movimientos registrados para este insumo.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                insumo.movimientos.map((mov: any) => (
                                    <TableRow key={mov.id} className="hover:bg-slate-50/30 transition-colors">
                                        <TableCell className="text-[9px] font-bold text-slate-500 uppercase">
                                            {formatDate(mov.fecha)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "border-none font-black text-[7px] uppercase px-1.5 h-4 shadow-none",
                                                mov.tipo === 'ENTRADA' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                                            )}>
                                                {mov.tipo}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-black text-[10px] text-slate-700">
                                            {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
                                        </TableCell>
                                        <TableCell className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[150px]">
                                            {mov.motivo}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-6">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                Última Actualización: {formatDate(insumo.updatedAt)}
            </p>
            <Button onClick={onClose} className="bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest px-8 rounded-xl h-10">
                Cerrar
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
