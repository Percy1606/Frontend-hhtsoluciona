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
  Clock,
  Settings
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
import { cn, formatCurrency, formatLargeCurrency } from "@/lib/utils";
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
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitInputValue, setLimitInputValue] = useState("");
  
  // Selección
  const [selectedCaja, setSelectedCaja] = useState<any>(null);

  // Deletions
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cajaToDelete, setCajaToDelete] = useState<{id: string, name: string} | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [minLiquidez, setMinLiquidez] = useState(0);

  const fetchCajas = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>("/finanzas/cajas");
      setCajas(Array.isArray(res) ? res : []);
    } catch (error) {
      toast.error("Error al cargar las cajas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCajas();
    const stored = localStorage.getItem('minLiquidez');
    if (stored) setMinLiquidez(Number(stored));
  }, []);

  const handleConfigurar = () => {
    setLimitInputValue(minLiquidez.toLocaleString("en-US"));
    setIsLimitModalOpen(true);
  };

  const handleSaveLimit = () => {
    const val = Number(limitInputValue.replace(/,/g, ''));
    if (!isNaN(val)) {
      setMinLiquidez(val);
      localStorage.setItem('minLiquidez', val.toString());
      setIsLimitModalOpen(false);
      toast.success("Fondo mínimo actualizado correctamente");
    }
  };

  const handleLimitInputChange = (e: any) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val) {
      setLimitInputValue(Number(val).toLocaleString('en-US'));
    } else {
      setLimitInputValue('');
    }
  };

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
  const totalRetenido = cajas.reduce((sum, c) => sum + Number(c.saldoComprometido || 0), 0);
  const totalDisponible = cajas.reduce((sum, c) => sum + Number(c.saldoDisponible || 0), 0);

  const formatCurrencyDynamic = (value: number, moneda: string = 'PEN') => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda,
      minimumFractionDigits: 2,
    }).format(value);
  };

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
                onClick={handleConfigurar}
                className="h-9 px-4 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 gap-2 font-black text-[9px] uppercase shadow-sm bg-amber-50/50"
            >
                <ShieldAlert className="w-3.5 h-3.5" /> Límite Caja
            </Button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            label="Saldo Total en Cajas" 
            value={totalCapital} 
            subLabel="Suma de saldos físicos"
            icon={<Wallet className="w-5 h-5 text-slate-700" />}
            color="bg-slate-100 border-slate-200"
            textColor="text-slate-900"
          />
          <KPICard 
            label="Fondos Gastados" 
            value={totalRetenido} 
            subLabel="Por pagar u obligaciones"
            icon={<Lock className="w-5 h-5 text-orange-600" />}
            color="bg-orange-50 border-orange-200"
            textColor="text-orange-900"
          />
          <KPICard 
            label="Saldo Disponible" 
            value={totalDisponible} 
            subLabel="Libre para nuevos gastos"
            icon={<ArrowUpRight className="w-5 h-5 text-emerald-600" />}
            color="bg-emerald-50 border-emerald-200"
            textColor="text-emerald-900"
          />
          <KPICard 
            label="Cuentas Activas" 
            value={cajas.length} 
            isCurrency={false}
            subLabel="Operativas en sistema"
            icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
            color="bg-blue-50 border-blue-200"
            textColor="text-blue-900"
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

      <Dialog open={isLimitModalOpen} onOpenChange={setIsLimitModalOpen}>
        <DialogContent className="max-w-sm bg-white border-none shadow-2xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-800">
              Configurar Límite de Caja
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Monto mínimo de liquidez (S/)</p>
            <Input 
              value={limitInputValue}
              onChange={handleLimitInputChange}
              placeholder="Ej. 30,000"
              className="h-12 text-lg font-black tracking-tighter"
            />
            <Button onClick={handleSaveLimit} className="w-full h-12 rounded-xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg">
              Guardar Límite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CajaCard({ caja, onEdit, onDelete, onHistory, onToggleProtect }: any) {
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
                            {new Intl.NumberFormat("es-PE", { style: "currency", currency: caja.moneda || 'PEN', minimumFractionDigits: 2 }).format(saldoReal)}
                        </p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Gastado</p>
                        <p className="text-sm font-black tracking-tighter text-orange-600">
                            - {new Intl.NumberFormat("es-PE", { style: "currency", currency: caja.moneda || 'PEN', minimumFractionDigits: 2 }).format(retenido)}
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
                    {(() => {
                        const formattedDisponible = new Intl.NumberFormat("es-PE", { style: "currency", currency: caja.moneda || 'PEN', minimumFractionDigits: 2 }).format(disponible);
                        const fontSizeClass = formattedDisponible.length > 13 ? "text-base" : formattedDisponible.length > 10 ? "text-lg" : "text-xl";
                        return (
                            <p className={cn(
                                "font-black tracking-tighter leading-none mt-1",
                                fontSizeClass,
                                isOverdrawn ? "text-red-600" : "text-emerald-600"
                            )}>
                                {formattedDisponible}
                            </p>
                        );
                    })()}
                </div>
                
                {/* Acciones Rápidas Hover */}
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

function KPICard({ label, value, subLabel, icon, color, textColor, isCurrency = true }: any) {
    return (
        <Card className={cn("border shadow-sm overflow-hidden", color)} title={isCurrency ? formatCurrency(value) : undefined}>
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm")}>
                    {icon}
                </div>
                <div className="space-y-0.5">
                    <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-80", textColor)}>{label}</p>
                    <p className={cn("text-lg font-black tracking-tighter leading-none", textColor)}>
                        {isCurrency ? formatLargeCurrency(value) : value}
                    </p>
                    <p className={cn("text-[9px] font-bold uppercase tracking-tighter mt-1 opacity-70", textColor)}>{subLabel}</p>
                </div>
            </CardContent>
        </Card>
    );
}
