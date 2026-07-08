"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  ShoppingCart,
  Search,
  Eye,
  Plus,
  PackageCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FolderKanban
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLogisticaStore } from "@/store/logistica-store";
import { useAuthStore } from "@/store/auth-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useCRMStore } from "@/store/crm-store";
import { OrdenCompraForm } from "@/components/logistica/orden-compra-form";
import { GenericSecureDeleteModal } from "@/components/ui/generic-secure-delete-modal";
import { toast } from "sonner";

const StatsCard = ({ label, value, icon, color, bgColor, isCurrency = false }: any) => (
  <div className={cn("p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 bg-white", bgColor)}>
    <div className={cn("p-2 rounded-lg bg-white shadow-sm", color)}>
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none mb-1">{label}</p>
      <p className={cn("text-lg font-black leading-none tracking-tight", color)}>
        {isCurrency 
            ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
            : value
        }
      </p>
    </div>
  </div>
);

const estadoCompraColors: Record<string, string> = {
    "PENDIENTE": "bg-gray-100 text-gray-700",
    "APROBADO": "bg-blue-100 text-blue-700",
    "RECIBIDO": "bg-green-100 text-green-700",
    "CANCELADO": "bg-red-100 text-red-700",
};

export default function OrdenesCompraPage() {
  const { user } = useAuthStore();
  
  // Selectores estables del Store
  const ordenes = useLogisticaStore(state => state.ordenes);
  const totalOrdenes = useLogisticaStore(state => state.totalOrdenes);
  const montoTotalOrdenes = useLogisticaStore(state => state.montoTotalOrdenes);
  const ordenTotalPages = useLogisticaStore(state => state.ordenTotalPages);
  const loading = useLogisticaStore(state => state.loading);
  const fetchOrdenes = useLogisticaStore(state => state.fetchOrdenes);
  const updateEstadoOrden = useLogisticaStore(state => state.updateEstadoOrden);
  const secureRemoveOrden = useLogisticaStore(state => state.secureRemoveOrden);
  const fetchProveedores = useLogisticaStore(state => state.fetchProveedores);
  const fetchInsumos = useLogisticaStore(state => state.fetchInsumos);

  // Proyectos para mapear nombres de clientes
  const proyectos = useOperacionesStore(state => state.proyectos);
  const fetchProyectos = useOperacionesStore(state => state.fetchProyectos);
  
  // CRM para mapear clientes desde cotizaciones (fallback)
  const globalQuotes = useCRMStore(state => state.quotes);
  const fetchQuotes = useCRMStore(state => state.fetchQuotes);

  // Estado local para paginación estable
  const [currentPage, setCurrentPage] = useState(1);
  const [isOrdenModalOpen, setIsOrdenModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const [editingOrden, setEditingOrden] = useState<any>(null);
  const [isSecureDeleteOpen, setIsSecureDeleteOpen] = useState(false);
  const [ordenToDelete, setOrdenToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleProject = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  // Carga inicial de catálogos y proyectos
  useEffect(() => {
    fetchProveedores();
    fetchInsumos();
    fetchProyectos(1, 100);
    fetchQuotes(1, 500); // Fetch para fallback de clientes
  }, [fetchProveedores, fetchInsumos, fetchProyectos, fetchQuotes]);

  // Sincronización de Ordenes (Paginación + Búsqueda + Filtros)
  // Nota: Para agrupar correctamente por proyecto, podríamos querer cargar más items (ej. 100 o 500)
  // pero mantendremos la paginación a 100 para tener un buen balance.
  useEffect(() => {
    fetchOrdenes(currentPage, 100, searchTerm, statusFilter, dateFrom, dateTo);
  }, [fetchOrdenes, currentPage, searchTerm, statusFilter, dateFrom, dateTo]);

  const ordenesPorProyecto = useMemo(() => {
    const map = new Map<string, { proyectoId: string, proyectoCodigo: string, proyectoNombre: string, clienteNombre: string, ordenes: any[], totalRecibido: number, totalPendiente: number }>();
    const unassignedId = 'unassigned';
    
    ordenes.forEach(oc => {
      const pId = (oc as any).proyectoId || unassignedId;
      const proyectoStore = proyectos.find(p => p.id === pId);
      
      const codigo = proyectoStore?.codigo || oc.gasto?.proyecto?.codigo || 'ÓRDENES GENERALES';
      const nombre = proyectoStore?.nombre || oc.gasto?.proyecto?.nombre || 'ALMACÉN / INVENTARIO DIRECTO';
      
      // Intentar obtener el cliente de todas las formas posibles
      let clienteNombre = (proyectoStore as any)?.cliente?.empresa || (proyectoStore as any)?.cliente?.nombre || oc.gasto?.proyecto?.cliente?.empresa || oc.gasto?.proyecto?.cliente?.nombre;
      
      if (!clienteNombre) {
        // Fallback: Buscar en las cotizaciones globales
        const searchCode = proyectoStore?.codigo || oc.gasto?.proyecto?.codigo || codigo;
        const linkedQuote = globalQuotes.find(q => {
            if ((proyectoStore as any)?.cotizacionId && q.id === (proyectoStore as any).cotizacionId) return true;
            
            if (searchCode && q.codigo) {
                const projNum = searchCode.split("-").slice(-2).join("-"); // Ej: "26-002"
                if (projNum && q.codigo.includes(projNum)) return true;
                if (projNum && q.codigo.includes(projNum.replace("26-", "2026-"))) return true;
            }
            return false;
        });
        
        if (linkedQuote) {
            clienteNombre = (linkedQuote as any).cliente?.empresa || (linkedQuote as any).cliente?.nombre;
        }
      }
      
      if (!clienteNombre) clienteNombre = 'Sin Cliente';

      if (!map.has(pId)) {
        map.set(pId, {
          proyectoId: pId,
          proyectoCodigo: codigo,
          proyectoNombre: nombre,
          clienteNombre: clienteNombre,
          ordenes: [],
          totalRecibido: 0,
          totalPendiente: 0,
        });
      }
      const grupo = map.get(pId)!;
      grupo.ordenes.push(oc);
      const mTotal = Number(oc.montoTotal || 0);
      if (oc.estado === 'RECIBIDO') {
        grupo.totalRecibido += mTotal;
      } else if (oc.estado !== 'CANCELADO') {
        grupo.totalPendiente += mTotal;
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.proyectoId === unassignedId) return 1;
      if (b.proyectoId === unassignedId) return -1;
      return a.proyectoCodigo.localeCompare(b.proyectoCodigo);
    });
  }, [ordenes, proyectos, globalQuotes]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleRecibirOrden = async (oc: any) => {
    if (confirm(`¿Confirmas la recepción de la Orden ${oc.codigo}? Se actualizará el stock de todos los productos.`)) {
        try {
            await updateEstadoOrden(oc.id, 'RECIBIDO');
            toast.success("Stock Actualizado", { description: "Los productos han ingresado al almacén." });
        } catch (error) {
            toast.error("Error al procesar", { description: "No se pudo actualizar el estado de la orden." });
        }
    }
  };

  const handleEdit = (oc: any) => {
    setEditingOrden(oc);
    setIsOrdenModalOpen(true);
  };

  const handleDeleteClick = (oc: any) => {
    setOrdenToDelete(oc);
    setIsSecureDeleteOpen(true);
  };

  const handleSecureDelete = async (password: string) => {
    if (!ordenToDelete) return;
    try {
      setDeleting(true);
      await secureRemoveOrden(ordenToDelete.id, password);
      toast.success("Orden Eliminada", { description: "La orden ha sido eliminada permanentemente." });
      setIsSecureDeleteOpen(false);
      setOrdenToDelete(null);
    } catch (error: any) {
      toast.error("Error", { description: "No se pudo eliminar la orden." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-black text-primary tracking-tight uppercase">Órdenes de Materiales</h1>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wide">Gestión de adquisiciones y abastecimiento de materiales.</p>
        </div>
        
        <Button onClick={() => setIsOrdenModalOpen(true)} className="h-10 px-6 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Nueva Orden
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="Órdenes Pendientes" value={ordenes.filter(o => o.estado === 'PENDIENTE').length} icon={<Clock className="w-4 h-4"/>} color="text-warning" bgColor="bg-yellow-50" />
        <StatsCard label="Items en Página" value={ordenes.length} icon={<ShoppingCart className="w-4 h-4"/>} color="text-primary" bgColor="bg-primary/5" />
        <StatsCard label="Monto Total (OM)" value={montoTotalOrdenes} icon={<ShoppingCart className="w-4 h-4"/>} color="text-emerald-600" bgColor="bg-emerald-50" isCurrency />
        <StatsCard label="Total Histórico" value={totalOrdenes} icon={<CheckCircle2 className="w-4 h-4"/>} color="text-success" bgColor="bg-green-50" />
      </div>

      <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-6">
            <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Búsqueda</label>
                <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar código o proveedor..." 
                        className="pl-10 h-10 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs shadow-none focus:bg-white transition-all"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>
            <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Estado</label>
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "TODOS")}>
                    <SelectTrigger className="h-10 w-full border-slate-200 rounded-lg text-xs font-bold text-slate-500 mt-1">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="TODOS" className="font-bold text-xs uppercase text-slate-600">Todos los Estados</SelectItem>
                        <SelectItem value="PENDIENTE" className="font-bold text-xs uppercase text-slate-500">Pendiente</SelectItem>
                        <SelectItem value="APROBADO" className="font-bold text-xs uppercase text-blue-600">Aprobado</SelectItem>
                        <SelectItem value="RECIBIDO" className="font-bold text-xs uppercase text-green-600">Recibido</SelectItem>
                        <SelectItem value="CANCELADO" className="font-bold text-xs uppercase text-red-600">Cancelado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label htmlFor="date-from" className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Fecha Inicio</label>
                <Input 
                    id="date-from"
                    type="date" 
                    value={dateFrom} 
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-10 w-full border-slate-200 rounded-lg text-xs font-bold text-slate-500 mt-1"
                />
            </div>
            <div>
                <label htmlFor="date-to" className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Fecha Fin</label>
                <Input 
                    id="date-to"
                    type="date" 
                    value={dateTo} 
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-10 w-full border-slate-200 rounded-lg text-xs font-bold text-slate-500 mt-1"
                />
            </div>
            <div>
                <Button 
                    variant="outline" 
                    onClick={() => { setDateFrom(""); setDateTo(""); setSearchTerm(""); setStatusFilter("TODOS"); }}
                    className="h-10 w-full px-4 gap-2 text-xs font-bold rounded-lg border-border text-slate-500 hover:text-slate-700"
                >
                    Limpiar Filtros
                </Button>
            </div>
        </div>

        {/* Lista agrupada por proyecto (Diseño unificado PC/Móvil) */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse font-black text-[10px] text-slate-400 uppercase">Cargando Órdenes...</div>
          </div>
        ) : ordenesPorProyecto.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
            <ShoppingCart className="w-12 h-12 mx-auto text-slate-200 mb-4" />
            <p className="text-sm font-black uppercase text-slate-400 tracking-wider">No se encontraron órdenes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ordenesPorProyecto.map((grupo) => {
              const isOpen = expanded.has(grupo.proyectoId);
              return (
              <div key={grupo.proyectoId} className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-slate-300", isOpen && "row-span-2")}>
                {/* Cabecera del Proyecto */}
                <button
                  type="button"
                  onClick={() => toggleProject(grupo.proyectoId)}
                  className="w-full text-left transition-colors duration-150"
                >
                  <div className="p-4">
                    {/* TOP ROW */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200", isOpen ? "bg-primary shadow-md shadow-primary/20" : "bg-primary/5")}>
                          <FolderKanban className={cn("w-5 h-5 transition-colors duration-200", isOpen ? "text-white" : "text-primary")} />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-sm font-black uppercase tracking-tight text-slate-800 truncate max-w-[180px]" title={`${grupo.proyectoCodigo} - ${grupo.proyectoNombre}`}>
                            {grupo.proyectoCodigo}
                            {grupo.proyectoNombre.replace(/^proyecto\s*:\s*(cot-\d{4}-\d{3})?/i, '').trim() ? ` - ${grupo.proyectoNombre.replace(/^proyecto\s*:\s*(cot-\d{4}-\d{3})?/i, '').trim()}` : ''}
                          </h2>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5 truncate max-w-[180px]" title={grupo.clienteNombre}>
                            {grupo.clienteNombre}
                          </p>
                        </div>
                      </div>
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200", isOpen ? "bg-primary/10 text-primary" : "text-slate-300")}>
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {/* BADGES ROW */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200" title="Total Recibido">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-[9px] font-bold text-slate-600">S/ {Number(grupo.totalRecibido || 0).toFixed(2)}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200" title="Total Pendiente">
                        <Clock className="w-3 h-3 text-orange-400" />
                        <span className="text-[9px] font-bold text-slate-600">S/ {Number(grupo.totalPendiente || 0).toFixed(2)}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200" title="Cant. Órdenes">
                        <ShoppingCart className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-600">{grupo.ordenes.length}</span>
                      </span>
                    </div>
                  </div>
                </button>

                {/* Lista de Órdenes */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 max-h-[350px] overflow-y-auto">
                    {grupo.ordenes.map((oc, idx) => (
                      <div key={oc.id} className={`px-4 py-3 transition-colors hover:bg-white ${idx < grupo.ordenes.length - 1 ? 'border-b border-slate-300 border-dashed' : ''}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-xs uppercase tracking-wide text-slate-700">
                            {oc.codigo}
                          </span>
                          <div className="flex gap-1 shrink-0 ml-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(oc)} className="h-6 w-6 text-slate-400 hover:text-primary hover:bg-primary/10 rounded">
                              <Eye className="w-3 h-3" />
                            </Button>
                            {oc.estado !== 'RECIBIDO' && oc.estado !== 'CANCELADO' && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(oc)} className="h-6 w-6 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(oc)} className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-bold text-[9px] uppercase text-slate-500 truncate max-w-[140px]" title={oc.proveedor?.razonSocial}>
                            {oc.proveedor?.razonSocial}
                          </span>
                          <Badge className={cn("border-none font-black text-[8px] uppercase shadow-none h-4 px-1.5", estadoCompraColors[oc.estado])}>
                            {oc.estado}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/60">
                          <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {new Date(oc.fechaEmision).toLocaleDateString()}
                          </span>
                          <span className="font-black text-[11px] text-slate-800">S/ {Number(oc.montoTotal || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* Paginación Integrada */}
        {ordenTotalPages > 1 && (
            <div className="p-3 mt-4 bg-white border border-border shadow-sm rounded-xl flex items-center justify-between">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">
                    Página {currentPage} de {ordenTotalPages} — Total: {totalOrdenes} órdenes
                </p>
                <div className="flex gap-2 mr-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage <= 1 || loading}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="h-7 px-3 font-black text-[9px] uppercase border-slate-200 bg-white gap-1"
                    >
                        <ChevronLeft className="w-3 h-3" /> Anterior
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage >= ordenTotalPages || loading}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="h-7 px-3 font-black text-[9px] uppercase border-slate-200 bg-white gap-1"
                    >
                        Siguiente <ChevronRight className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        )}
      </div>

      <OrdenCompraForm 
        isOpen={isOrdenModalOpen} 
        onClose={() => {
            setIsOrdenModalOpen(false);
            setEditingOrden(null);
        }} 
        initialData={editingOrden}
      />
      
      <GenericSecureDeleteModal
        isOpen={isSecureDeleteOpen}
        onClose={() => setIsSecureDeleteOpen(false)}
        onConfirm={handleSecureDelete}
        entityName={ordenToDelete ? `Orden de Materiales ${ordenToDelete.codigo}` : ''}
        loading={deleting}
      />
    </div>
  );
}
