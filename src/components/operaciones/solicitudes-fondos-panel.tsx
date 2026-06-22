"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Search, 
  TrendingDown, 
  Loader2, 
  Calendar, 
  Filter,
  CheckCircle,
  Clock,
  Wallet,
  FileText,
  AlertCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  ArrowRightLeft
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { Gasto } from "@/types/finanzas";
import { ModernDialog } from "@/components/ui/modern-dialog";
import { GastoForm } from "@/components/finanzas/gasto-form";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { RendicionForm } from "./rendicion-form";

interface SolicitudesFondosPanelProps {
  proyectoId?: string;
}

const statusColors: Record<string, string> = {
  "SOLICITADO": "bg-amber-100 text-amber-700 border-amber-200",
  "APROBADO": "bg-blue-100 text-blue-700 border-blue-200",
  "PAGADO": "bg-green-100 text-green-700 border-green-200",
  "PENDIENTE": "bg-red-100 text-red-700 border-red-200",
  "ANULADO": "bg-slate-100 text-slate-700 border-slate-200",
};

export function SolicitudesFondosPanel({ proyectoId }: SolicitudesFondosPanelProps) {
  const { user } = useAuthStore();
  const isFinanceOrAdmin = user?.rol === 'ADMIN' || user?.modulos?.includes('finanzas');
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [isRendicionModalOpen, setIsRendicionModalOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);
  const [search, setSearch] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchData = async () => {
    try {
      setLoading(true);
      // Filtrar por área Operaciones o por proyecto si se provee
      let url = '/finanzas/gastos?limit=500';
      if (proyectoId) {
        url += `&proyectoId=${proyectoId}`;
      }
      
      const res = await api.get(url);
      const data = Array.isArray(res) ? res : (res.data || []);
      
      // Si no hay proyectoId, filtramos por los tipos que suelen ser de operaciones
      const filtered = proyectoId ? data : data.filter((g: Gasto) => 
        ['VIATICOS', 'COMBUSTIBLE', 'OPERATIVO', 'PROYECTO'].includes(g.tipo) ||
        g.area === 'OperacionesDeCampo'
      );
      
      setGastos(filtered);
    } catch (e) {
      console.error("Error fetching fund requests", e);
      setGastos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [proyectoId]);

  const handleCreateRequest = async (data: any) => {
    try {
      const payload = {
        ...data,
        estado: 'SOLICITADO', // Forzar estado solicitado
        area: 'OperacionesDeCampo',
        solicitanteId: user?.id,
        proyectoId: proyectoId || data.proyectoId,
        fechaEmision: data.fechaEmision || new Date().toISOString()
      };

      await api.post('/finanzas/gastos', payload);
      toast.success("Solicitud enviada correctamente");
      setIsGastoModalOpen(false);
      fetchData();
    } catch (e) {
      toast.error("Error al enviar solicitud");
    }
  };

  const handleRendicionSubmit = async (data: any) => {
    try {
      await api.post('/finanzas/rendiciones', {
        ...data,
        gastoId: selectedGasto?.id,
        registradoPorId: user?.id
      });
      toast.success("Rendición registrada con éxito");
      setIsRendicionModalOpen(false);
      setSelectedGasto(null);
      fetchData();
    } catch (e) {
      toast.error("Error al registrar rendición");
    }
  };

  const filteredGastos = gastos.filter(g => 
    g.concepto.toLowerCase().includes(search.toLowerCase()) ||
    g.codigo?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGastos.length / itemsPerPage);
  const paginatedGastos = filteredGastos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading && gastos.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase text-slate-400">Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar solicitud..." 
            className="pl-9 h-10 border-slate-200 bg-white rounded-xl text-xs font-bold" 
          />
        </div>
        <Button 
          onClick={() => setIsGastoModalOpen(true)}
          className="h-10 px-6 gap-2 text-xs font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Nueva Solicitud de Fondos
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50 h-12">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 pl-6">Fecha / Cód.</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Concepto / Justificación</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Tipo</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-right">Monto</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Estado</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Progreso Rend.</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Detalle</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGastos.map((g) => (
              <TableRow key={g.id} className="hover:bg-slate-50/50 transition-colors border-slate-100 h-16 group">
                <TableCell className="pl-6">
                  <p className="text-[10px] font-black text-slate-800 uppercase">{formatDate(g.fechaEmision)}</p>
                  <p className="text-[9px] font-bold text-primary">{g.codigo || 'SOLICITUD'}</p>
                </TableCell>
                <TableCell>
                  <div className="max-w-[300px]">
                    <p className="font-black text-xs text-slate-700 truncate uppercase">{g.concepto}</p>
                    {g.justificacion && (
                        <p className="text-[9px] text-slate-400 font-medium truncate italic">{g.justificacion}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200 text-slate-500">
                    {g.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-black text-xs text-slate-800">
                    S/ {Number(g.montoTotal).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={cn("border font-black text-[8px] uppercase px-2 py-0.5 rounded-md shadow-none", statusColors[g.estado])}>
                    {g.estado}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                   {g.estado === 'PAGADO' ? (
                       <div className="flex flex-col items-center">
                           <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[9px] font-black text-emerald-600">
                                    S/ {Number(g.montoRendido || 0).toLocaleString()}
                                </span>
                                <span className="text-[8px] font-bold text-slate-300">/</span>
                                <span className="text-[9px] font-black text-slate-400">
                                    S/ {Number(g.montoTotal).toLocaleString()}
                                </span>
                           </div>
                           <Progress 
                            value={((g.montoRendido || 0) / g.montoTotal) * 100} 
                            className="h-1.5 w-20" 
                            indicatorClassName={g.estadoRendicion === 'COMPLETADA' ? "bg-emerald-500" : "bg-amber-500"} 
                           />
                           {g.estadoRendicion === 'COMPLETADA' && (
                               <p className="text-[8px] font-black text-emerald-600 uppercase mt-1">
                                   Vuelto: S/ {Math.max(0, Number(g.montoTotal) - Number(g.montoRendido)).toLocaleString()}
                               </p>
                           )}
                       </div>
                   ) : g.estado === 'APROBADO' ? (
                       <div className="flex flex-col items-center gap-1">
                           <Badge variant="outline" className="text-[8px] font-black uppercase text-blue-600 border-blue-200 bg-blue-50">
                               Listo para Pago
                           </Badge>
                           <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Fondos Reservados</span>
                       </div>
                   ) : (
                       <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-400 border-slate-200 bg-slate-50">
                           Por Aprobar
                       </Badge>
                   )}
                </TableCell>
                <TableCell className="text-center">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                        onClick={() => { setSelectedGasto(g); setIsRendicionModalOpen(true); }}
                        title="Ver Historial y Sustentos"
                    >
                        <FileText className="w-4 h-4" />
                    </Button>
                </TableCell>
                <TableCell className="pr-4 text-right">
                   {g.estado === 'PAGADO' && g.estadoRendicion !== 'COMPLETADA' && (
                       <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => { setSelectedGasto(g); setIsRendicionModalOpen(true); }}
                        className="h-8 text-[9px] font-black uppercase border-primary text-primary hover:bg-primary hover:text-white rounded-xl"
                       >
                           Rendir
                       </Button>
                   )}
                </TableCell>
              </TableRow>
            ))}
            {paginatedGastos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                    <HandCoins className="w-12 h-12" />
                    <p className="font-black text-xs uppercase tracking-widest text-slate-400">No hay solicitudes registradas</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
             <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 border-slate-200 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-black text-slate-500 uppercase px-2">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 border-slate-200 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PARA NUEVA SOLICITUD */}
      <ModernDialog
        isOpen={isGastoModalOpen}
        onOpenChange={setIsGastoModalOpen}
        title="Solicitar Fondos para Operaciones"
      >
        {isFinanceOrAdmin ? (
          <GastoForm 
            initialData={{ 
                estado: 'SOLICITADO', 
                proyectoId: proyectoId || "",
                tipo: 'VIATICOS' 
            } as any}
            onSubmit={handleCreateRequest}
            onCancel={() => setIsGastoModalOpen(false)}
          />
        ) : (
          <SolicitudOperacionesForm
            proyectoId={proyectoId || ""}
            onSubmit={handleCreateRequest}
            onCancel={() => setIsGastoModalOpen(false)}
          />
        )}
      </ModernDialog>

      {/* MODAL PARA RENDICIÓN */}
      <ModernDialog
        isOpen={isRendicionModalOpen}
        onOpenChange={setIsRendicionModalOpen}
        title={`Rendir Cuentas: ${selectedGasto?.concepto}`}
        maxWidth="sm:max-w-[800px]"
      >
        {selectedGasto && (
            <RendicionForm 
                gasto={selectedGasto}
                onSubmit={handleRendicionSubmit}
                onCancel={() => setIsRendicionModalOpen(false)}
            />
        )}
      </ModernDialog>
    </div>
  );
}

function Progress({ value, className, indicatorClassName }: { value: number, className?: string, indicatorClassName?: string }) {
    return (
        <div className={cn("bg-slate-100 rounded-full overflow-hidden", className)}>
            <div 
                className={cn("h-full transition-all duration-500", indicatorClassName)} 
                style={{ width: `${Math.min(100, value)}%` }} 
            />
        </div>
    );
}

function SolicitudOperacionesForm({ proyectoId, onSubmit, onCancel }: { proyectoId: string, onSubmit: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    concepto: "",
    montoTotal: "",
    tipo: "VIATICOS",
    justificacion: "",
    proyectoId: proyectoId
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.concepto || !formData.montoTotal) {
      toast.error("El concepto y monto son obligatorios");
      return;
    }
    setIsSubmitting(true);
    await onSubmit({
      ...formData,
      montoTotal: Number(formData.montoTotal)
    });
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in p-2">
      <div className="space-y-1">
        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Concepto / Motivo</Label>
        <Input 
          placeholder="Ej. Viáticos para visita técnica..." 
          value={formData.concepto}
          onChange={e => setFormData({ ...formData, concepto: e.target.value })}
          className="font-bold text-xs h-10 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Monto (S/)</Label>
          <Input 
            type="number"
            step="0.01"
            placeholder="0.00" 
            value={formData.montoTotal}
            onChange={e => setFormData({ ...formData, montoTotal: e.target.value })}
            className="font-black text-sm text-primary h-10 rounded-xl"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tipo</Label>
          <Select value={formData.tipo} onValueChange={v => setFormData({ ...formData, tipo: v || "" })}>
            <SelectTrigger className="font-bold text-xs h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIATICOS">Viáticos</SelectItem>
              <SelectItem value="COMBUSTIBLE">Combustible</SelectItem>
              <SelectItem value="OPERATIVO">Gasto Operativo</SelectItem>
              <SelectItem value="PROYECTO">Gasto Proyecto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Justificación Detallada</Label>
        <Textarea 
          placeholder="Explique brevemente para qué se requiere el dinero..." 
          value={formData.justificacion}
          onChange={e => setFormData({ ...formData, justificacion: e.target.value })}
          className="resize-none h-24 text-xs rounded-xl"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={onCancel} className="flex-1 font-bold uppercase text-[10px] h-10 rounded-xl">Cancelar</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 font-black uppercase text-[10px] h-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Enviar Solicitud
        </Button>
      </div>
    </div>
  );
}
