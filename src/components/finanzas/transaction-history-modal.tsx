"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  RefreshCw, 
  Loader2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle
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
  if (tipo === 'BLOQUEO') return { label: 'FONDOS GASTADOS', color: 'bg-orange-50 text-orange-600 border-orange-200 ring-orange-500/20' };
  if (tipo === 'LIBERACION') return { label: 'FONDOS LIBERADOS', color: 'bg-indigo-50 text-indigo-600 border-indigo-200 ring-indigo-500/20' };
  if (tipo === 'ANULACION' || concepto.toUpperCase().includes('ANULADO')) return { label: 'MOVIMIENTO ANULADO', color: 'bg-red-50 text-red-600 border-red-200 ring-red-500/20' };
  if (tipo === 'EGRESO') return { label: 'PAGO EJECUTADO', color: 'bg-rose-50 text-rose-600 border-rose-200 ring-rose-500/20' };
  if (tipo === 'INGRESO') return { label: 'INGRESO', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 ring-emerald-500/20' };
  return { label: tipo, color: 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/20' };
};

const formatFechaBonita = (d: string) => {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }).format(new Date(d)).toUpperCase();
};

export function TransactionHistoryModal({ isOpen, onClose, caja }: HistoryModalProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Selected Detail Modal
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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

  const handleOpenDetail = (t: any) => {
    setSelectedTx(t);
    setIsDetailOpen(true);
  };

  const handleGoToExpense = (gastoId: string) => {
    onClose();
    setIsDetailOpen(false);
    router.push(`/finanzas/egresos?highlightGastoId=${gastoId}`);
  };

  if (!caja) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-4xl lg:max-w-5xl bg-white p-0 overflow-hidden rounded-3xl border-none shadow-2xl flex flex-col max-h-[92vh]">
        <DialogHeader className="bg-slate-900 text-white p-6 shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Auditoría de Caja: {caja.nombre}
            </DialogTitle>
            <Button 
              variant="ghost" 
              onClick={() => fetchHistory(page)} 
              className="h-8 px-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs font-bold gap-1.5 transition-colors"
              title="Actualizar movimientos"
            >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                <span className="text-[10px] uppercase font-bold tracking-wider">Recargar</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 flex-1 overflow-y-auto">
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
                                <TableHead className="w-[80px] text-center"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((t, i) => {
                                const isSameAsPrev = i > 0 && t.referenciaId && t.referenciaId === transactions[i-1].referenciaId;
                                const tipoVisual = getTipoVisual(t.tipo, t.concepto);
                                
                                const montoNum = Number(t.monto);
                                const saldoFinal = Number(t.saldoRealNuevo);
                                let saldoAnterior = saldoFinal;
                                if (t.tipo === 'INGRESO') saldoAnterior = saldoFinal - montoNum;
                                if (t.tipo === 'EGRESO' || t.tipo === 'ANULACION') saldoAnterior = saldoFinal + montoNum;
                                
                                return (
                                <TableRow 
                                  key={t.id} 
                                  className={cn(
                                    "hover:bg-slate-50/80 transition-colors border-slate-100 group", 
                                    isSameAsPrev && "border-t-0 bg-slate-50/30"
                                  )}
                                >
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
                                    <TableCell 
                                      onClick={() => handleOpenDetail(t)}
                                      className="max-w-[200px] md:max-w-[320px] align-top pt-4 whitespace-normal break-words cursor-pointer"
                                    >
                                        <p className="text-[11px] font-bold text-slate-800 uppercase leading-snug hover:text-primary transition-colors">
                                          {cleanConcepto(t.concepto)}
                                        </p>
                                        {!isSameAsPrev && (
                                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                {t.referenciaTipo && (
                                                  <Badge variant="secondary" className="text-[8px] font-black uppercase bg-slate-100 text-slate-500">
                                                      {t.referenciaTipo === 'ORDEN_COMPRA' ? 'ORDEN DE COMPRA' : t.referenciaTipo.replace('_', ' ')}
                                                  </Badge>
                                                )}
                                                <span className="text-[9px] font-extrabold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                  <Eye className="w-3 h-3" /> Ver Detalle
                                                </span>
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
                                    <TableCell className="pr-4 align-top pt-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                              onClick={() => handleOpenDetail(t)}
                                              title="Ver Detalle"
                                          >
                                              <Eye className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-7 w-7 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                                              onClick={() => {
                                                  setTransactionToDelete(t);
                                                  setDeleteModalOpen(true);
                                              }}
                                              title="Eliminar Movimiento"
                                          >
                                              <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
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

    {/* MODAL DE DETALLE DEL MOVIMIENTO */}
    {selectedTx && (
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-black uppercase text-slate-900">
                  Detalle del Movimiento
                </DialogTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {formatFechaBonita(selectedTx.fecha)}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-3 text-xs">
            {/* Concepto y Monto */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                Concepto / Motivo
              </span>
              <p className="font-bold text-slate-900 leading-snug">
                {selectedTx.concepto}
              </p>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/80">
                <span className="text-[10px] font-black uppercase text-slate-500">Monto Ejecutado</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {formatCurrency(Number(selectedTx.monto), caja.moneda)}
                </span>
              </div>
            </div>

            {/* Proyecto Asignado si existe */}
            {selectedTx.gastoDetalle?.proyecto && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-blue-900 font-black text-[10px] uppercase tracking-wide">
                  <Building2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Proyecto Vinculado</span>
                </div>
                <p className="text-xs font-bold text-slate-900">
                  {selectedTx.gastoDetalle.proyecto.codigo} - {selectedTx.gastoDetalle.proyecto.nombre}
                </p>
                {selectedTx.gastoDetalle.proyecto.cliente && (
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Cliente: {selectedTx.gastoDetalle.proyecto.cliente.empresa || selectedTx.gastoDetalle.proyecto.cliente.nombre}
                  </p>
                )}
              </div>
            )}

            {/* Comprobante Adjunto si existe */}
            {selectedTx.gastoDetalle?.comprobanteUrl && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-black uppercase text-emerald-900">Sustento Adjunto</span>
                <a 
                  href={selectedTx.gastoDetalle.comprobanteUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ver Comprobante
                </a>
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button 
                variant="outline" 
                className="h-9 text-xs font-bold rounded-xl"
                onClick={() => setIsDetailOpen(false)}
              >
                Cerrar
              </Button>
              {selectedTx.referenciaTipo === 'GASTO' && selectedTx.referenciaId && (
                <Button 
                  className="h-9 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl gap-1.5 shadow-sm"
                  onClick={() => handleGoToExpense(selectedTx.referenciaId)}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ver en Módulo de Gastos
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}

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
