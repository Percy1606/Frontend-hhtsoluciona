"use client";

import { useState, useEffect } from "react";
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
  ChevronRight
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

  // Carga inicial de catálogos
  useEffect(() => {
    fetchProveedores();
    fetchInsumos();
  }, [fetchProveedores, fetchInsumos]);

  // Sincronización de Ordenes (Paginación + Búsqueda + Filtros)
  useEffect(() => {
    fetchOrdenes(currentPage, 20, searchTerm, statusFilter, dateFrom, dateTo);
  }, [fetchOrdenes, currentPage, searchTerm, statusFilter, dateFrom, dateTo]);

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

        {/* VISTA MÓVIL */}
        <div className="block md:hidden space-y-4">
            {loading ? (
                <div className="text-center py-10 animate-pulse font-black text-[10px] text-slate-400 uppercase">Cargando Órdenes...</div>
            ) : ordenes.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold uppercase text-[10px]">No se encontraron órdenes de materiales.</div>
            ) : (
                ordenes.map((oc, index) => (
                    <div key={oc.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative">
                        <div className="absolute top-4 right-2 flex items-center">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(oc)} className="h-8 w-8 text-primary"><Eye className="w-4 h-4"/></Button>
                            {oc.estado !== 'RECIBIDO' && oc.estado !== 'CANCELADO' && (
                                <>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-blue-600"
                                        onClick={() => handleEdit(oc)}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-error"
                                        onClick={() => handleDeleteClick(oc)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                        
                        <div className="pr-[100px] flex flex-col">
                            <span className="font-black text-primary text-sm uppercase leading-tight">{oc.codigo}</span>
                            <span className="font-bold text-[10px] uppercase text-slate-600 mt-1">{oc.proveedor?.razonSocial}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Proyecto</span>
                                <span className="text-[10px] font-black text-slate-700 uppercase truncate">
                                    {oc.gasto?.proyecto?.nombre || "Stock General"}
                                </span>
                            </div>
                            <div className="flex flex-col items-end">
                                <Badge className={cn("border-none font-black text-[8px] uppercase shadow-none h-4 px-2", estadoCompraColors[oc.estado])}>{oc.estado}</Badge>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                            <span className="text-[10px] text-slate-500 font-bold">{new Date(oc.fechaEmision).toLocaleDateString()}</span>
                            <span className="font-black text-sm text-slate-800">S/ {Number(oc.montoTotal || 0).toFixed(2)}</span>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* VISTA PC */}
        <div className="hidden md:block bg-white rounded-xl border border-slate-100 overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="font-black text-primary uppercase text-[10px] py-4 pl-6 w-12 text-center">Ítem</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Código</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Proveedor</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Proyecto</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Materiales</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Emisión</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Total</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Estado</TableHead>
                        <TableHead className="text-right font-black text-primary uppercase text-[10px] pr-6">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={9} className="text-center py-20 animate-pulse font-black text-[10px] text-slate-400 uppercase">Cargando Órdenes...</TableCell></TableRow>
                    ) : ordenes.length === 0 ? (
                        <TableRow><TableCell colSpan={9} className="text-center py-20 text-slate-400 font-bold uppercase text-[10px]">No se encontraron órdenes de materiales.</TableCell></TableRow>
                    ) : (
                        ordenes.map((oc, index) => (
                            <TableRow key={oc.id} className="hover:bg-slate-50/50 transition-colors group">
                                <TableCell className="pl-6 font-black text-slate-400 text-xs text-center">
                                    {(currentPage - 1) * 20 + index + 1}
                                </TableCell>
                                <TableCell className="font-black text-primary text-xs uppercase group-hover:translate-x-1 transition-transform">{oc.codigo}</TableCell>
                                <TableCell className="font-bold text-xs uppercase text-slate-600">{oc.proveedor?.razonSocial}</TableCell>
                                <TableCell className="font-bold text-[10px] uppercase text-slate-500 max-w-[150px] truncate">{oc.gasto?.proyecto?.nombre || "Stock General"}</TableCell>
                                <TableCell className="font-medium text-[10px] text-slate-500">
                                  {oc.items && oc.items.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-1" title={oc.items.map((item: any) => item.insumo?.nombre).join(", ")}>
                                      <span className="truncate max-w-[150px]">
                                        {oc.items.slice(0, 2).map((item: any) => item.insumo?.nombre || "Material").join(", ")}
                                      </span>
                                      {oc.items.length > 2 && (
                                        <Badge variant="secondary" className="text-[8px] h-4 px-1 py-0 bg-slate-100 text-slate-500 hover:bg-slate-200">
                                          +{oc.items.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : "Sin materiales"}
                                </TableCell>
                                <TableCell className="text-[10px] text-slate-500 font-bold">{new Date(oc.fechaEmision).toLocaleDateString()}</TableCell>
                                <TableCell className="font-black text-xs text-slate-800">S/ {Number(oc.montoTotal || 0).toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge className={cn("border-none font-black text-[8px] uppercase shadow-none", estadoCompraColors[oc.estado])}>{oc.estado}</Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(oc)} className="h-8 w-8 text-primary"><Eye className="w-4 h-4"/></Button>
                                        
                                        {oc.estado !== 'RECIBIDO' && oc.estado !== 'CANCELADO' && (
                                            <>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                    title="Editar Orden"
                                                    onClick={() => handleEdit(oc)}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-error hover:bg-red-50"
                                                    title="Eliminar Orden"
                                                    onClick={() => handleDeleteClick(oc)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* Paginación Integrada (Estilo Bandeja Técnica) */}
            {ordenTotalPages > 1 && (
                <div className="p-3 bg-slate-50 border-t border-border flex items-center justify-between">
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
