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
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Receipt, FileText, Calendar, CreditCard, User } from "lucide-react";

interface PagoHistorialProps {
  pagos: any[];
}

export function PagoHistorial({ pagos }: PagoHistorialProps) {
  if (!pagos || pagos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 opacity-30">
        <Receipt className="w-12 h-12 mb-2" />
        <p className="font-black text-xs uppercase tracking-widest">No hay pagos registrados aún</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Fecha</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Método / Ref</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-right">Monto</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Voucher</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagos.map((pago) => (
            <TableRow key={pago.id} className="hover:bg-slate-50/50">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-primary flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> {formatDate(pago.fechaPago)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-black text-[10px] text-slate-600 uppercase tracking-tighter">{pago.metodo}</span>
                  {pago.referencia && (
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <CreditCard className="w-3 h-3 opacity-50" /> {pago.referencia}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-black text-xs text-secondary">
                  {formatCurrency(pago.monto)}
                </span>
              </TableCell>
              <TableCell className="text-center">
                {pago.comprobanteUrl ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-secondary/10 text-secondary"
                    onClick={() => {
                      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                      const fullUrl = pago.comprobanteUrl.startsWith('http') ? pago.comprobanteUrl : `${API_URL}${pago.comprobanteUrl}`;
                      window.open(fullUrl, '_blank');
                    }}
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                ) : (
                  <span className="text-[10px] text-slate-300 font-bold uppercase">N/A</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
