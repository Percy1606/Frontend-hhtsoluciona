"use client";

import { useState } from "react";
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
import { formatDate, formatCurrency, getSecureUrl } from "@/lib/utils";
import { Receipt, FileText, Calendar, CreditCard, User, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { GenericSecureDeleteModal } from "@/components/ui/generic-secure-delete-modal";

interface PagoHistorialProps {
  pagos: any[];
  onSuccess?: () => void;
}

export function PagoHistorial({ pagos, onSuccess }: PagoHistorialProps) {
  const [pagoToDelete, setPagoToDelete] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!pagos || pagos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 opacity-30">
        <Receipt className="w-12 h-12 mb-2" />
        <p className="font-black text-xs uppercase tracking-widest">No hay pagos registrados aún</p>
      </div>
    );
  }

  const handleSecureDelete = async (password: string) => {
    if (!pagoToDelete) return;
    try {
      setDeleting(true);
      await api.post(`/finanzas/pagos/${pagoToDelete.id}/secure-delete`, { password });
      toast.success("Pago eliminado y saldo revertido");
      setIsDeleteModalOpen(false);
      setPagoToDelete(null);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error("Error al eliminar", { description: error.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Fecha</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Método / Ref</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-right">Monto</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Acciones</TableHead>
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
                  <div className="flex items-center justify-center gap-2">
                    {pago.comprobanteUrl ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full hover:bg-secondary/10 text-secondary"
                        onClick={() => {
                          const fullUrl = getSecureUrl(pago.comprobanteUrl);
                          window.open(fullUrl, '_blank');
                        }}
                        title="Ver Voucher"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-bold uppercase">N/A</span>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full hover:bg-error/10 text-error/60 hover:text-error"
                      onClick={() => {
                        setPagoToDelete(pago);
                        setIsDeleteModalOpen(true);
                      }}
                      title="Eliminar Pago (Admin)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <GenericSecureDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPagoToDelete(null);
        }}
        onConfirm={handleSecureDelete}
        entityName={`Pago de ${pagoToDelete ? formatCurrency(pagoToDelete.monto) : ""}`}
        loading={deleting}
      />
    </>
  );
}
