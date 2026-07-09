"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle,
  RefreshCw,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { GenericSecureDeleteModal } from "@/components/ui/generic-secure-delete-modal";
import { toast } from "sonner";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  caja: any;
}

const cleanConcepto = (concepto: string) => {
  if (!concepto) return "";
  return concepto
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '') // Remover UUIDs
    .replace(/\[.*?\]/g, '') // Remover [CUALQUIER_COSA:OTRA_COSA]
    .replace(/\(\s*\)/g, '') // Remover paréntesis vacíos
    .replace(/\s-\s*$/, '') // Remover guiones colgados al final
    .trim();
};

const getTipoVisual = (tipo: string, concepto: string = "") => {
  if (tipo === 'BLOQUEO') return { label: '🔒 FONDOS GASTADOS', color: 'bg-orange-50 text-orange-600 border-orange-200 ring-orange-500/20' };
  if (tipo === 'LIBERACION') return { label: '🔓 FONDOS LIBERADOS', color: 'bg-indigo-50 text-indigo-600 border-indigo-200 ring-indigo-500/20' };
  if (tipo === 'ANULACION' || concepto.toUpperCase().includes('ANULADO')) return { label: '🚫 MOV. ANULADO', color: 'bg-red-50 text-red-600 border-red-200 ring-red-500/20' };
  if (tipo === 'EGRESO') return { label: '💸 PAGO EJECUTADO', color: 'bg-rose-50 text-rose-600 border-rose-200 ring-rose-500/20' };
  if (tipo === 'INGRESO') return { label: '💰 INGRESO', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 ring-emerald-500/20' };
  return { label: tipo, color: 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/20' };
};

const formatFechaBonita = (d: string) => {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }).format(new Date(d)).toUpperCase();
};

export function TransactionHistoryModal({ isOpen, onClose, caja }: HistoryModalProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Deletions
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHistory = useCallback(async (targetPage = 1) => {
    if (!caja) return;
    setLoading(true);
    try {
      const res: any = await api.get(`/finanzas/cajas/${caja.id}/transacciones?page=${targetPage}&limit=${limit}`);
      setTransactions(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setPage(res.meta?.page || targetPage);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [caja]);

  useEffect(() => {
    if (isOpen && caja) {
      setPage(1);
      fetchHistory(1);
    }
  }, [isOpen, caja, fetchHistory]);

  const handleSecureDelete = async (password: string) => {
    if (!transactionToDelete) return;
    try {
      setDeleting(true);
      await api.post(`/finanzas/transacciones/${transactionToDelete.id}/secure-delete`, { password });
      toast.success("Movimiento eliminado y saldo revertido");
      setDeleteModalOpen(false);
      fetchHistory();
    } catch (error: any) {
      toast.error("Error al eliminar", { description: error.message });
    } finally {
      setDeleting(false);
    }
  };

  if (!caja) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <DialogHeader className="bg-slate-900 text-white p-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Auditoría de Caja: {caja.nombre}
            </DialogTitle>
            <Button variant="ghost" onClick={() => fetchHistory(page)} className="h-7 w-7 p-0 text-white/50 hover:text-white">
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6">
            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin opacity-20" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultando auditoría...</p>
                </div>
            ) : transactions.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 bg-slate-50 rounded-2xl border-2 border-dashed">
                    <AlertCircle className="w-10 h-10 text-slate-300" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin movimientos registrados</p>
                </div>
            ) : (
                <div className="space-y-4">
                <ScrollArea className="h-[450px] pr-4">
                    <Table>
                        <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="text-[9px] font-black uppercase pl-4">Fecha</TableHead>
                                <TableHead className="text-[9px] font-black uppercase">Tipo</TableHead>
                                <TableHead className="text-[9px] font-black uppercase">Concepto / Motivo</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-right">Monto</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((t, i) => {
                                const isSameAsPrev = i > 0 && t.referenciaId && t.referenciaId === transactions[i-1].referenciaId;
                                const tipoVisual = getTipoVisual(t.tipo, t.concepto);
                                
                                // Calculation logic based on type to find previous balance
                                const montoNum = Number(t.monto);
                                const saldoFinal = Number(t.saldoRealNuevo);
                                let saldoAnterior = saldoFinal;
                                if (t.tipo === 'INGRESO') saldoAnterior = saldoFinal - montoNum;
                                if (t.tipo === 'EGRESO' || t.tipo === 'ANULACION') saldoAnterior = saldoFinal + montoNum;
                                
                                return (
                                <TableRow key={t.id} className={cn("hover:bg-slate-50/50 transition-colors border-slate-100", isSameAsPrev && "border-t-0 bg-slate-50/30")}>
                                    <TableCell className="pl-4 align-top pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-700">{formatFechaBonita(t.fecha).split(',')[0]}</span>
                                            <span className="text-[9px] font-bold text-slate-400">{formatFechaBonita(t.fecha).split(',')[1]}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top pt-4">
                                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase ring-1 ring-inset shadow-sm py-0.5", tipoVisual.color)}>
                                            {tipoVisual.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[280px] align-top pt-4">
                                        <p className="text-[11px] font-bold text-slate-800 uppercase leading-snug break-all">{cleanConcepto(t.concepto)}</p>
                                        {!isSameAsPrev && t.referenciaTipo && (
                                            <div className="mt-1.5 flex flex-wrap gap-1">
                                                <Badge variant="secondary" className="text-[8px] font-black uppercase bg-slate-100 text-slate-500 hover:bg-slate-200">
                                                    {t.referenciaTipo === 'ORDEN_COMPRA' ? 'ORDEN DE COMPRA' : t.referenciaTipo.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right align-top pt-4">
                                        <div className="flex flex-col items-end gap-0.5 font-mono">
                                            <div className="flex justify-between w-[130px] text-[9px] text-slate-400 font-bold uppercase">
                                                <span>Antes:</span>
                                                <span>{formatCurrency(saldoAnterior, caja.moneda)}</span>
                                            </div>
                                            <div className={cn("flex justify-between w-[130px] text-[11px] font-black border-y border-dashed py-0.5 my-0.5", 
                                                t.tipo === 'INGRESO' || t.tipo === 'LIBERACION' ? "text-emerald-600 border-emerald-100" : 
                                                t.tipo === 'EGRESO' || t.tipo === 'ANULACION' ? "text-red-600 border-red-100" : "text-amber-600 border-amber-100"
                                            )}>
                                                <span>{t.tipo === 'INGRESO' || t.tipo === 'LIBERACION' ? '+' : '-'}</span>
                                                <span>{formatCurrency(montoNum, caja.moneda)}</span>
                                            </div>
                                            <div className="flex justify-between w-[130px] text-[10px] text-slate-700 font-black uppercase">
                                                <span>Final:</span>
                                                <span>{formatCurrency(saldoFinal, caja.moneda)}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="pr-4 align-top pt-3">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                                            onClick={() => {
                                                setTransactionToDelete(t);
                                                setDeleteModalOpen(true);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </ScrollArea>
                
                {/* PAGINACIÓN */}
                <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Página {page} de {totalPages}</p>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page === 1 || loading}
                            onClick={() => fetchHistory(page - 1)}
                            className="h-8 w-8 p-0 rounded-xl"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page === totalPages || loading}
                            onClick={() => fetchHistory(page + 1)}
                            className="h-8 w-8 p-0 rounded-xl"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>

    <GenericSecureDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleSecureDelete}
        entityName={`Movimiento: ${transactionToDelete?.concepto?.slice(0, 30)}...`}
        loading={deleting}
    />
    </>
  );
}
