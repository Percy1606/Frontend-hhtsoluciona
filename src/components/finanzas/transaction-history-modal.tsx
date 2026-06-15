"use client";

import { useState, useEffect } from "react";
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

  const fetchHistory = async (targetPage = page) => {
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
  };

  useEffect(() => {
    if (isOpen && caja) {
      setPage(1);
      fetchHistory(1);
    }
  }, [isOpen, caja]);

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
                            {transactions.map((t) => (
                                <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                    <TableCell className="pl-4">
                                        <p className="text-[10px] font-bold text-slate-700">{formatDate(t.fecha)}</p>
                                        <p className="text-[8px] font-medium text-slate-400 uppercase">{new Date(t.fecha).toLocaleTimeString()}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn(
                                            "text-[8px] font-black uppercase h-5",
                                            t.tipo === 'INGRESO' ? "bg-emerald-100 text-emerald-700" : 
                                            t.tipo === 'EGRESO' ? "bg-red-100 text-red-700" :
                                            t.tipo === 'BLOQUEO' ? "bg-orange-100 text-orange-700" :
                                            "bg-blue-100 text-blue-700"
                                        )}>
                                            {t.tipo}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[250px]">
                                        <p className="text-[10px] font-bold text-slate-800 line-clamp-2 uppercase leading-tight">{t.concepto}</p>
                                        {t.referenciaTipo && (
                                            <p className="text-[8px] font-black text-primary uppercase mt-0.5">{t.referenciaTipo}: {t.referenciaId?.slice(0,8)}</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <p className={cn(
                                            "text-xs font-black",
                                            t.tipo === 'INGRESO' ? "text-emerald-600" : 
                                            t.tipo === 'EGRESO' ? "text-red-600" : "text-slate-800"
                                        )}>
                                            {t.tipo === 'EGRESO' ? "-" : "+"}{formatCurrency(Number(t.monto))}
                                        </p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">SALDO: {formatCurrency(Number(t.saldoRealNuevo))}</p>
                                    </TableCell>
                                    <TableCell className="pr-4">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                                            onClick={() => {
                                                setTransactionToDelete(t);
                                                setDeleteModalOpen(true);
                                            }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
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
