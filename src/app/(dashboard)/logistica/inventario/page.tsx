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
  Plus,
  Search,
  Package,
  AlertTriangle,
  RefreshCw,
  Eye,
  Download,
  AlertCircle,
  Truck,
  Edit2,
  Trash2,
  FilterX,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLogisticaStore } from "@/store/logistica-store";
import { useAuthStore } from "@/store/auth-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { InsumoForm } from "@/components/logistica/insumo-form";
import { DespachoForm } from "@/components/logistica/despacho-form";
import { InsumoDetalle } from "@/components/logistica/insumo-detalle";
import { SecureDeleteModal } from "@/components/logistica/secure-delete-modal";
import { toast } from "sonner";

const StatsCard = ({ label, value, icon, color, bgColor, isCurrency = false }: any) => (
  <div className={cn("p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 bg-white", bgColor)}>
    <div className={cn("p-2.5 rounded-lg bg-white shadow-sm", color)}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider leading-none mb-1">{label}</p>
      <p className={cn("text-lg font-black leading-none tracking-tight truncate", color)}>
        {isCurrency 
            ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(value)
            : value
        }
      </p>
    </div>
  </div>
);

export default function InventarioPage() {
  const { user } = useAuthStore();
  
  // Selectores estables del Store
  const insumos = useLogisticaStore(state => state.insumos);
  const totalInsumos = useLogisticaStore(state => state.totalInsumos);
  const insumoTotalPages = useLogisticaStore(state => state.insumoTotalPages);
  const loading = useLogisticaStore(state => state.loading);
  const fetchInsumos = useLogisticaStore(state => state.fetchInsumos);
  const getInsumosStockBajo = useLogisticaStore(state => state.getInsumosStockBajo);
  const currentInsumo = useLogisticaStore(state => state.currentInsumo);

  // Estado local para control fino de la UI
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock] = useState("all");

  const [isInsumoModalOpen, setIsInsumoModalOpen] = useState(false);
  const [isDespachoModalOpen, setIsDespachoModalOpen] = useState(false);
  const [isDetalleModalOpen, setIsDetalleModalOpen] = useState(false);
  const [isSecureDeleteOpen, setIsSecureDeleteOpen] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<any>(null);

  // Sincronización Maestra: La página y los filtros mandan sobre la carga
  useEffect(() => {
    fetchInsumos(currentPage, 20, searchTerm, filterCategory, filterStock);
  }, [fetchInsumos, currentPage, searchTerm, filterCategory, filterStock]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleCategoryChange = (val: string | null) => {
    setFilterCategory(val || "all");
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleStockChange = (val: string | null) => {
    setFilterStock(val || "all");
    if (currentPage !== 1) setCurrentPage(1);
  };

  const stockBajo = getInsumosStockBajo();
  const totalInversionPágina = insumos.reduce((acc, i) => acc + (i.stockActual * i.precioReferencial), 0);

  // Extraer categorías de forma que no causen saltos en el Select al paginar
  const categories = useMemo(() => {
    // Si estuviéramos en una página con pocos items, no queremos que el filtro se vacíe
    // Idealmente vendrían del backend, pero por ahora las derivamos de lo que hay en el store
    // (Zustand mantiene los insumos de la carga anterior hasta que llega la nueva)
    const cats = new Set(insumos.map(i => i.categoria).filter(Boolean));
    return Array.from(cats);
  }, [insumos]);

  const handleOpenDespacho = (item?: any) => {
    setSelectedInsumo(item || null);
    setIsDespachoModalOpen(true);
  };

  const handleOpenDetalle = async (item: any) => {
    await useLogisticaStore.getState().fetchInsumoById(item.id);
    setIsDetalleModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedInsumo(item);
    setIsInsumoModalOpen(true);
  };

  const handleRemove = (item: any) => {
    setSelectedInsumo(item);
    setIsSecureDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-black text-primary tracking-tight uppercase">Almacén Central</h1>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wide">Control de inventario y stock de materiales.</p>
        </div>
        
        <div className="flex items-center gap-2">
            <Button variant="outline" className="h-10 px-4 font-black uppercase text-[10px] tracking-widest gap-2 rounded-xl border-slate-200">
                <Download className="w-4 h-4" /> Exportar
            </Button>
            <Button 
                onClick={() => {
                    setSelectedInsumo(null);
                    setIsInsumoModalOpen(true);
                }} 
                className="h-10 px-6 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 gap-2 rounded-xl"
            >
                <Plus className="w-4 h-4" /> Nuevo Insumo
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="Items en Almacén" value={totalInsumos} icon={<Package className="w-4 h-4"/>} color="text-primary" bgColor="bg-primary/5" />
        <StatsCard label="Stock Crítico" value={stockBajo.length} icon={<AlertTriangle className="w-4 h-4"/>} color="text-error" bgColor="bg-red-50" />
        <StatsCard label="Inversión Página" value={totalInversionPágina} icon={<Package className="w-4 h-4"/>} color="text-blue-600" bgColor="bg-blue-50" isCurrency />
        <StatsCard label="Categorías Visibles" value={categories.length} icon={<Search className="w-4 h-4"/>} color="text-emerald-600" bgColor="bg-emerald-50" />
      </div>

      <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-end">
            <div className="flex-1 w-full space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Buscador de Insumos</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar por nombre o descripción..." 
                        className="pl-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs shadow-none focus:bg-white transition-all"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                <div className="space-y-1.5 min-w-[200px]">
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Filtrar Categoría</Label>
                    <Select value={filterCategory} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="h-11 border-slate-200 font-bold text-xs rounded-xl bg-white shadow-sm">
                            <SelectValue placeholder="Categoría">
                              {filterCategory !== "all" ? 
                                <span className="uppercase">{filterCategory}</span> : 
                                <span className="text-[11px] text-slate-400 uppercase tracking-tighter italic">TODAS LAS CATEGORÍAS</span>
                              }
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="all" className="text-[11px] text-slate-400 uppercase tracking-tighter italic">TODAS LAS CATEGORÍAS</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat || ""} className="text-xs font-medium uppercase">{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 min-w-[180px]">
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Estado de Inventario</Label>
                    <Select value={filterStock} onValueChange={handleStockChange}>
                        <SelectTrigger className="h-11 border-slate-200 font-bold text-xs rounded-xl bg-white shadow-sm">
                            <SelectValue placeholder="Estado Stock">
                              {filterStock !== "all" ? 
                                <span className="uppercase">{filterStock === 'disponible' ? 'DISPONIBLE' : 'STOCK BAJO'}</span> : 
                                <span className="text-[11px] text-slate-400 uppercase tracking-tighter italic">VER TODO EL STOCK</span>
                              }
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="all" className="text-[11px] text-slate-400 uppercase tracking-tighter italic">VER TODO EL STOCK</SelectItem>
                            <SelectItem value="disponible" className="text-xs font-medium uppercase text-success">DISPONIBLE</SelectItem>
                            <SelectItem value="bajo" className="text-xs font-medium uppercase text-error">STOCK BAJO / CRÍTICO</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {(searchTerm || filterCategory !== "all" || filterStock !== "all") && (
                    <div className="pb-0.5">
                        <Button 
                            variant="ghost" 
                            onClick={() => { setSearchTerm(""); setFilterCategory("all"); setFilterStock("all"); }}
                            className="h-11 px-4 text-error font-black text-[10px] uppercase hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all"
                        >
                            <FilterX className="w-4 h-4 mr-2" /> Limpiar
                        </Button>
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="font-black text-primary uppercase text-[10px] py-4 pl-6">Insumo / Material</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Categoría</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Unidad</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Stock Actual</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Precio Ref.</TableHead>
                        <TableHead className="text-right font-black text-primary uppercase text-[10px] pr-6">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-20 animate-pulse font-black text-[10px] text-slate-400">CARGANDO ALMACÉN...</TableCell></TableRow>
                    ) : insumos.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 font-bold uppercase text-[10px]">No se encontraron insumos.</TableCell></TableRow>
                    ) : (
                        insumos.map((item) => (
                            <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                <TableCell className="pl-6">
                                    <p className="font-black text-slate-800 text-sm uppercase group-hover:text-primary transition-colors">{item.nombre}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{item.descripcion || 'Sin descripción'}</p>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200 text-slate-500">{item.categoria || 'General'}</Badge>
                                </TableCell>
                                <TableCell className="font-bold text-xs text-slate-600 uppercase">{item.unidadMedida}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("text-base font-black", item.stockActual <= item.stockMinimo ? "text-error" : "text-primary")}>
                                            {item.stockActual}
                                        </span>
                                        {item.stockActual <= item.stockMinimo && <AlertCircle className="w-3.5 h-3.5 text-error animate-pulse" />}
                                    </div>
                                </TableCell>
                                <TableCell className="font-black text-xs text-slate-700">S/ {Number(item.precioReferencial || 0).toFixed(2)}</TableCell>
                                <TableCell className="text-right pr-6">
                                    <div className="flex justify-end gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-primary" 
                                            title="Ver Detalles"
                                            onClick={() => handleOpenDetalle(item)}
                                        >
                                            <Eye className="w-4 h-4"/>
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-blue-600" 
                                            title="Editar Insumo"
                                            onClick={() => handleEdit(item)}
                                        >
                                            <Edit2 className="w-4 h-4"/>
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-slate-800" 
                                            title="Despacho a obra"
                                            onClick={() => handleOpenDespacho(item)}
                                            disabled={item.stockActual <= 0}
                                        >
                                            <Truck className="w-4 h-4"/>
                                        </Button>
                                        {user?.rol === 'ADMIN' && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-error hover:bg-red-50" 
                                                title="Eliminar Insumo"
                                                onClick={() => handleRemove(item)}
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* Paginación Integrada (Estilo Bandeja Técnica) */}
            {insumoTotalPages > 1 && (
                <div className="p-3 bg-slate-50 border-t border-border flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">
                        Página {currentPage} de {insumoTotalPages} — Total: {totalInsumos} insumos
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
                            disabled={currentPage >= insumoTotalPages || loading}
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

      <InsumoForm isOpen={isInsumoModalOpen} onClose={() => setIsInsumoModalOpen(false)} insumo={selectedInsumo} />
      <DespachoForm isOpen={isDespachoModalOpen} onClose={() => setIsDespachoModalOpen(false)} initialInsumo={selectedInsumo} />
      <InsumoDetalle isOpen={isDetalleModalOpen} onClose={() => setIsDetalleModalOpen(false)} insumo={currentInsumo || selectedInsumo} />
      <SecureDeleteModal 
        isOpen={isSecureDeleteOpen} 
        onClose={() => setIsSecureDeleteOpen(false)} 
        entityId={selectedInsumo?.id || ""} 
        entityName={selectedInsumo?.nombre || ""} 
      />
    </div>
  );
}
