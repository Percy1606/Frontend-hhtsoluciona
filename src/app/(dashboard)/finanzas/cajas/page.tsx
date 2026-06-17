"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  MoreVertical,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Lock,
  Unlock,
  ShieldAlert,
  ArrowRightLeft,
  Activity,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { CajaForm } from "@/components/finanzas/caja-form";
import { TransferModal } from "@/components/finanzas/transfer-modal";
import { TransactionHistoryModal } from "@/components/finanzas/transaction-history-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GenericSecureDeleteModal } from "@/components/ui/generic-secure-delete-modal";

export default function CajasPage() {
  const [cajas, setCajas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // Selección
  const [selectedCaja, setSelectedCaja] = useState<any>(null);

  // Deletions
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cajaToDelete, setCajaToDelete] = useState<{id: string, name: string} | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCajas = async () => {
    setLoading(true);
    try {
      const data = await api.get('/finanzas/cajas');
      setCajas(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Error al cargar las cajas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCajas();
  }, []);

  const handleCreateOrUpdate = async (formData: any) => {
    try {
      if (selectedCaja) {
        await api.put(`/finanzas/cajas/${selectedCaja.id}`, formData);
        toast.success("Configuración actualizada");
      } else {
        await api.post('/finanzas/cajas', formData);
        toast.success("Nueva caja registrada correctamente");
      }
      setIsModalOpen(false);
      fetchCajas();
    } catch (error: any) {
      toast.error("Error al procesar", { description: error.message });
    }
  };

  const handleTransfer = async (formData: any) => {
    try {
      await api.post('/finanzas/cajas/transfer', formData);
      toast.success("Transferencia exitosa", { description: `Se movieron los fondos de forma segura.` });
      setIsTransferModalOpen(false);
      fetchCajas();
    } catch (error: any) {
      toast.error("Fallo en transferencia", { description: error.message });
    }
  };

  const toggleProtection = async (caja: any) => {
    try {
        await api.put(`/finanzas/cajas/${caja.id}`, { esProtegida: !caja.esProtegida });
        toast.success(caja.esProtegida ? "Bóveda liberada" : "Cuenta protegida con éxito");
        fetchCajas();
    } catch (e: any) {
        toast.error("Acción Denegada", { description: e.message });
    }
  };

  const handleSecureDelete = async (password: string) => {
    if (!cajaToDelete) return;
    try {
      setDeleting(true);
      await api.post(`/finanzas/cajas/${cajaToDelete.id}/secure-delete`, { password });
      toast.success("Cuenta eliminada correctamente");
      setDeleteModalOpen(false);
      fetchCajas();
    } catch (error: any) {
      toast.error("Error al eliminar", { description: error.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = (caja: any) => {
    setCajaToDelete({ id: caja.id, name: caja.nombre });
    setDeleteModalOpen(true);
  };

  const filteredCajas = cajas.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCapital = cajas.reduce((sum, c) => sum + Number(c.saldoReal || 0), 0);
  const totalDisponible = cajas.reduce((sum, c) => sum + Number(c.saldoDisponible || 0), 0);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Centro de Control de Cajas</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Gestión directa de fondos y cuentas bancarias</p>
        </div>
        <div className="flex items-center gap-3">
            <Button 
                variant="outline" 
                onClick={() => setIsTransferModalOpen(true)}
                className="h-9 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 font-black text-[9px] uppercase shadow-sm"
            >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Transferir Fondos
            </Button>
            <Button 
                onClick={() => { setSelectedCaja(null); setIsModalOpen(true); }}
                className="bg-primary hover:bg-primary/90 text-white font-black h-9 px-5 rounded-xl gap-2 text-[9px] uppercase shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
                <Plus className="w-3.5 h-3.5" /> Crear Nueva Caja
            </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <KPICard 
            label="Capital Total" 
            value={totalCapital} 
            subLabel="Suma de saldos físicos"
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
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input 
                placeholder="BUSCAR CUENTA POR NOMBRE..." 
                className="pl-9 h-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-none font-bold text-[11px] rounded-xl uppercase italic placeholder:text-slate-300" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" onClick={fetchCajas} className="h-10 px-4 text-slate-400 hover:text-primary rounded-xl">
             <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} /> Sincronizar Cuentas
          </Button>
      </div>

      {/* CAJAS GRID */}
      {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin opacity-20" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultando estados de cuenta...</p>
          </div>
      ) : filteredCajas.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-slate-400">No se encontraron cuentas bancarias o cajas</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCajas.map((caja) => (
                <CajaCard 
                    key={caja.id} 
                    caja={caja} 
                    onEdit={() => { setSelectedCaja(caja); setIsModalOpen(true); }}
                    onDelete={handleDelete}
                    onHistory={() => { setSelectedCaja(caja); setIsHistoryModalOpen(true); }}
                    onToggleProtect={() => toggleProtection(caja)}
                />
            ))}
        </div>
      )}

      {/* MODALES */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl bg-white border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="bg-slate-900 text-white p-6">
            <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" /> {selectedCaja ? "Configuración de Cuenta" : "Nueva Cuenta de Fondos"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <CajaForm 
                initialData={selectedCaja}
                onSubmit={handleCreateOrUpdate}
                onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <TransferModal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
        onSubmit={handleTransfer}
        cajas={cajas}
      />

      <TransactionHistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        caja={selectedCaja}
      />

      <GenericSecureDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleSecureDelete}
        entityName={cajaToDelete?.name || ''}
        loading={deleting}
      />
    </div>
  );
}

function CajaCard({ caja, onEdit, onDelete, onHistory, onToggleProtect }: any) {
    const isProtected = caja.esProtegida;

    return (
        <Card className={cn(
            "transition-all duration-500 overflow-hidden group relative border-none shadow-md hover:shadow-xl",
            isProtected 
                ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" 
                : "bg-white text-slate-800 border-slate-200"
        )}>
            {/* DECORACIÓN SUPERIOR */}
            <div className={cn(
                "h-1 w-full",
                isProtected ? "bg-gradient-to-r from-primary via-blue-400 to-primary animate-gradient-x" : "bg-slate-100"
            )} />

            <CardContent className="p-6 space-y-6">
                {/* CABECERA */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                            isProtected 
                                ? "bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                                : "bg-primary/5 border border-primary/10"
                        )}>
                            {isProtected ? (
                                <Lock className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            ) : (
                                <Wallet className="w-6 h-6 text-primary" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className={cn(
                                    "font-black text-sm uppercase tracking-tighter",
                                    isProtected ? "text-white" : "text-slate-900"
                                )}>
                                    {caja.nombre}
                                </h3>
                                {isProtected && (
                                    <div className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Badge variant="outline" className={cn(
                                    "text-[8px] font-black uppercase px-2 py-0 border-none",
                                    isProtected ? "bg-white/10 text-primary" : "bg-slate-100 text-slate-500"
                                )}>
                                    {caja.tipo}
                                </Badge>
                                <Badge className={cn(
                                    "text-[8px] font-black uppercase px-2 py-0 border-none",
                                    caja.subtipo === 'OBLIGACIONES' ? "bg-orange-100 text-orange-600" :
                                    caja.subtipo === 'RESERVA' ? "bg-emerald-100 text-emerald-600" :
                                    "bg-blue-100 text-blue-600"
                                )}>
                                    {caja.subtipo}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        {Number(caja.porcentajeProvision) > 0 && (
                            <div className="flex flex-col items-end justify-center mr-2">
                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">Provisión</span>
                                <span className="text-xs font-black text-blue-600">{Number(caja.porcentajeProvision)}%</span>
                            </div>
                        )}
                        <Button variant="ghost" size="icon" onClick={onHistory} className={cn("h-8 w-8 rounded-full", isProtected ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-slate-100 text-slate-400")}>
                            <History className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onEdit} className={cn("h-8 w-8 rounded-full", isProtected ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-slate-100 text-slate-400")}>
                            <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(caja)} className={cn("h-8 w-8 rounded-full", isProtected ? "hover:bg-white/10 text-white/40 hover:text-error" : "hover:bg-red-50 text-slate-400 hover:text-error")}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* SALDOS PRINCIPALES */}
                <div className="relative">
                    {/* FONDO DECORATIVO PARA BÓVEDAS */}
                    {isProtected && (
                        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full -z-10" />
                    )}
                    
                    <div className="grid grid-cols-2 gap-6 relative">
                        <div className="space-y-1">
                            <p className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                isProtected ? "text-slate-400" : "text-slate-400"
                            )}>Saldo Real</p>
                            <p className={cn(
                                "text-xl font-black tracking-tighter",
                                isProtected ? "text-white" : "text-slate-900"
                            )}>
                                {formatCurrency(Number(caja.saldoReal))}
                            </p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                isProtected ? "text-primary" : "text-slate-400"
                            )}>Disponible</p>
                            <p className={cn(
                                "text-xl font-black tracking-tighter",
                                isProtected ? "text-blue-400" : "text-emerald-600"
                            )}>
                                {formatCurrency(Number(caja.saldoDisponible))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* PIE DE TARJETA Y ACCIONES RÁPIDAS */}
                <div className={cn(
                    "pt-4 border-t flex items-center justify-between",
                    isProtected ? "border-white/5" : "border-slate-100"
                )}>
                    <div className="flex items-center gap-3">
                         <div 
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all active:scale-95",
                                isProtected ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )} 
                            onClick={onToggleProtect}
                        >
                            {isProtected ? <ShieldCheck className="w-3 h-3" /> : <Unlock className="w-3 h-3 opacity-50" />}
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                {isProtected ? "Bóveda Activa" : "Cuenta Pública"}
                            </span>
                         </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                        <Activity className="w-3 h-3 opacity-30" />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">
                            {caja._count?.transacciones || 0} MOV.
                        </span>
                    </div>
                </div>

                {/* ALERTA DE FONDOS RETENIDOS */}
                {Number(caja.saldoComprometido) > 0 && (
                    <div className={cn(
                        "mt-2 p-2 rounded-lg flex items-center justify-center gap-2",
                        isProtected ? "bg-orange-500/10 border border-orange-500/20" : "bg-orange-50 border border-orange-100"
                    )}>
                        <Clock className="w-3 h-3 text-orange-500 animate-pulse" />
                        <span className={cn(
                            "text-[8px] font-black uppercase tracking-tight",
                            isProtected ? "text-orange-400" : "text-orange-600"
                        )}>
                            S/ {Number(caja.saldoComprometido).toLocaleString()} RETENIDOS POR PAGOS
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function KPICard({ label, value, subLabel, icon, color, isCurrency = true }: any) {
    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-slate-50")}>
                    {icon}
                </div>
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
                    <p className="text-xl font-black tracking-tighter text-slate-900 leading-none">
                        {isCurrency ? formatCurrency(value) : value}
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">{subLabel}</p>
                </div>
            </CardContent>
        </Card>
    );
}
