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
  History,
  Search,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Truck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FilterX
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLogisticaStore } from "@/store/logistica-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StatsCard = ({ label, value, icon, color, bgColor }: any) => (
  <div className={cn("p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 bg-white", bgColor)}>
    <div className={cn("p-2.5 rounded-lg bg-white shadow-sm", color)}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider leading-none mb-1">{label}</p>
      <p className={cn("text-lg font-black leading-none tracking-tight truncate", color)}>{value}</p>
    </div>
  </div>
);

export default function KardexPage() {
  // Selectores estables del Store
  const movimientos = useLogisticaStore(state => state.movimientos);
  const totalMovimientos = useLogisticaStore(state => state.totalMovimientos);
  const movimientoTotalPages = useLogisticaStore(state => state.movimientoTotalPages);
  const loading = useLogisticaStore(state => state.loading);
  const fetchMovimientos = useLogisticaStore(state => state.fetchMovimientos);
  
  const proyectos = useOperacionesStore(state => state.proyectos);
  const fetchProyectos = useOperacionesStore(state => state.fetchProyectos);

  // Estado local para paginación estable
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");

  useEffect(() => {
    fetchProyectos();
  }, [fetchProyectos]);

  // Sincronización Maestra (Paginación + Filtros)
  useEffect(() => {
    fetchMovimientos(currentPage, 20, searchTerm, filterTipo);
  }, [fetchMovimientos, currentPage, searchTerm, filterTipo]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleTipoChange = (val: string | null) => {
    setFilterTipo(val || "all");
    if (currentPage !== 1) setCurrentPage(1);
  };

  const entradas = movimientos.filter(m => m.tipo === 'ENTRADA').length;
  const salidas = movimientos.filter(m => m.tipo === 'SALIDA').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <History className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-black text-primary tracking-tight uppercase">Kardex / Movimientos</h1>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wide">Historial de entradas y salidas de almacén.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="Entradas (Página)" value={entradas} icon={<TrendingUp className="w-4 h-4"/>} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatsCard label="Salidas (Página)" value={salidas} icon={<TrendingDown className="w-4 h-4"/>} color="text-orange-600" bgColor="bg-orange-50" />
        <StatsCard label="Total Histórico" value={totalMovimientos} icon={<RefreshCw className="w-4 h-4"/>} color="text-primary" bgColor="bg-primary/5" />
        <StatsCard label="Proyectos Impactados" value={new Set(movimientos.map(m => m.proyectoId)).size} icon={<Truck className="w-4 h-4"/>} color="text-blue-600" bgColor="bg-blue-50" />
      </div>

      <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-end">
            <div className="flex-1 w-full space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Buscar en Historial</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar por material o motivo..." 
                        className="pl-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs shadow-none focus:bg-white transition-all"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                <div className="space-y-1.5 min-w-[220px]">
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo de Movimiento</Label>
                    <Select value={filterTipo} onValueChange={handleTipoChange}>
                        <SelectTrigger className="h-11 border-slate-200 font-bold text-xs rounded-xl bg-white shadow-sm">
                            <SelectValue placeholder="Tipo">
                              {filterTipo !== "all" ? 
                                <span className="uppercase">{filterTipo === 'ENTRADA' ? 'ENTRADAS (INGRESOS)' : 'SALIDAS (DESPACHOS)'}</span> : 
                                <span className="text-[11px] text-slate-400 uppercase tracking-tighter italic">TODOS LOS TIPOS</span>
                              }
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="all" className="text-[11px] text-slate-400 uppercase tracking-tighter italic">TODOS LOS TIPOS</SelectItem>
                            <SelectItem value="ENTRADA" className="text-xs font-medium uppercase text-emerald-600">ENTRADAS (INGRESOS)</SelectItem>
                            <SelectItem value="SALIDA" className="text-xs font-medium uppercase text-orange-600">SALIDAS (DESPACHOS)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-end self-end h-11">
                    <Button 
                        variant="ghost" 
                        onClick={() => { setSearchTerm(""); setFilterTipo("all"); setCurrentPage(1); }}
                        className={cn(
                          "h-11 w-11 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 hover:border-red-200 transition-all rounded-xl shadow-none",
                          (searchTerm === "" && filterTipo === "all") && "opacity-0 pointer-events-none"
                        )}
                        title="Limpiar filtros"
                    >
                        <FilterX className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="font-black text-primary uppercase text-[10px] py-4 pl-6">Fecha / Hora</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Tipo</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Material</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Cantidad</TableHead>
                        <TableHead className="font-black text-primary uppercase text-[10px]">Destino / Motivo</TableHead>
                        <TableHead className="text-right font-black text-primary uppercase text-[10px] pr-6">Registro</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-20 animate-pulse font-black text-[10px] text-slate-400 uppercase">Cargando Kardex...</TableCell></TableRow>
                    ) : movimientos.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 font-bold uppercase text-[10px]">No se encontraron movimientos.</TableCell></TableRow>
                    ) : (
                        movimientos.map((mov) => (
                            <TableRow key={mov.id} className="hover:bg-slate-50/50 transition-colors group">
                                <TableCell className="pl-6 text-[10px] font-bold text-slate-500 uppercase">
                                    {new Date(mov.fecha).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("border-none font-black text-[8px] uppercase px-2 h-5 flex items-center gap-1 shadow-none", 
                                        mov.tipo === 'ENTRADA' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700")}>
                                        {mov.tipo === 'ENTRADA' ? <ArrowUpRight className="w-2.5 h-2.5"/> : <ArrowDownLeft className="w-2.5 h-2.5"/>}
                                        {mov.tipo}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <p className="font-black text-slate-800 text-xs uppercase group-hover:text-primary transition-colors">{mov.insumo?.nombre}</p>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase">{mov.insumo?.categoria}</p>
                                </TableCell>
                                <TableCell className="font-black text-sm text-slate-800">{mov.cantidad} {mov.insumo?.unidadMedida}</TableCell>
                                <TableCell>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{mov.motivo}</p>
                                    {mov.proyectoId && (
                                        <p className="text-[8px] font-black text-primary uppercase">Proyecto: {proyectos.find(p => p.id === mov.proyectoId)?.codigo || 'EXTERNO'}</p>
                                    )}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <div className="flex justify-end">
                                        <div className="bg-success/10 p-1.5 rounded-full"><PackageCheck className="w-3.5 h-3.5 text-success"/></div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* Paginación Integrada (Estilo Bandeja Técnica) */}
            {movimientoTotalPages > 1 && (
                <div className="p-3 bg-slate-50 border-t border-border flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">
                        Página {currentPage} de {movimientoTotalPages} — Total: {totalMovimientos} movimientos
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
                            disabled={currentPage >= movimientoTotalPages || loading}
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
    </div>
  );
}
