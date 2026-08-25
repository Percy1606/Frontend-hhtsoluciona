"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CRMHeader } from "@/components/crm/crm-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import { Loader2, Target, Search, Building2, ChevronDown, ChevronRight, FolderKanban, Wallet, FilterX, Eye, Calendar, DollarSign, Package, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ProyectoData {
  id: string;
  codigo: string;
  nombre: string;
  estado: string;
  ventaContratada: number;
  costoPresupuestado: number;
  autorizaCompras: boolean;
  cliente: { id: string; empresa: string; ruc: string };
  rentabilidad?: {
    costoRealAcumulado: number;
    utilidadBruta: number;
    rentabilidadProyectada: number;
    desglose: {
      manoDeObra: number;
      materiales: number;
      combustible: number;
      viaticos: number;
      hospedaje: number;
      subcontratos: number;
      equipos: number;
      otros: number;
    };
    historialGastos?: Array<{
      id: string;
      concepto: string;
      monto: number;
      fecha: string;
      estado: string;
      codigo?: string;
      tipo?: string;
      ocCodigo?: string;
    }>;
    historialMateriales?: Array<{
      material: string;
      cantidad: number;
      costoTotal: number;
      fecha: string;
      origen: string;
    }>;
  };
  loading?: boolean;
}

export default function CostosProyectoClient() {
  const [proyectos, setProyectos] = useState<ProyectoData[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRentabilidad, setFilterRentabilidad] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCompras, setFilterCompras] = useState('');
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for Modal Gastos / Costo Real
  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenGastosModal = (proyecto: ProyectoData) => {
    setSelectedProyecto(proyecto);
    setIsModalOpen(true);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRentabilidad, filterEstado, filterCompras]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const resProyectos: any = await api.get('/finanzas/bandeja-proyectos');
        
        const proys = (resProyectos || []).map((p: any) => ({
          ...p,
          loading: true,
          rentabilidad: null
        }));
        setProyectos(proys);
        setLoadingInitial(false);

        proys.forEach(async (p: any) => {
          try {
            const rent: any = await api.get(`/finanzas/proyectos/${p.id}/rentabilidad`);
            setProyectos(prev => prev.map(item => {
              if (item.id === p.id) {
                const rentData = rent as any;
                const mappedRent = {
                  costoRealAcumulado: rentData.egresos?.costoTotal || 0,
                  utilidadBruta: rentData.indicadores?.utilidadProyectada || 0,
                  rentabilidadProyectada: rentData.indicadores?.rentabilidadProyectada || 0,
                  desglose: {
                    manoDeObra: rentData.egresos?.manoObra || 0,
                    materiales: rentData.egresos?.materiales || 0,
                    combustible: 0,
                    viaticos: 0,
                    hospedaje: 0,
                    subcontratos: 0,
                    equipos: 0,
                    otros: rentData.egresos?.gastosDirectos || 0,
                  },
                  historialGastos: rentData.historialGastos || [],
                  historialMateriales: rentData.historialMateriales || []
                };
                return { ...item, rentabilidad: mappedRent, loading: false };
              }
              return item;
            }));
          } catch (error) {
            console.error(`Error loading rentabilidad for ${p.id}`, error);
            setProyectos(prev => prev.map(item => {
              if (item.id === p.id) {
                return { ...item, loading: false };
              }
              return item;
            }));
          }
        });
        
      } catch (error) {
        console.error("Error loading proyectos", error);
        setLoadingInitial(false);
      }
    }
    
    loadData();
  }, []);

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) => ({ ...prev, [clientId]: !prev[clientId] }));
  };

  if (loadingInitial) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-black text-primary uppercase text-xs tracking-[0.2em] animate-pulse">Cargando Proyectos...</p>
      </div>
    );
  }

  const filteredProyectos = proyectos.filter(p => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = p.codigo?.toLowerCase().includes(term) || 
                          p.nombre?.toLowerCase().includes(term) || 
                          p.cliente?.empresa?.toLowerCase().includes(term);
    
    let matchesRentabilidad = true;
    if (filterRentabilidad && p.rentabilidad) {
      const rent = p.rentabilidad.rentabilidadProyectada || 0;
      if (filterRentabilidad === 'excelente') matchesRentabilidad = rent >= 20;
      if (filterRentabilidad === 'riesgo') matchesRentabilidad = rent >= 0 && rent < 20;
      if (filterRentabilidad === 'perdida') matchesRentabilidad = rent < 0;
    }

    let matchesEstado = true;
    if (filterEstado) {
      matchesEstado = p.estado?.toLowerCase() === filterEstado.toLowerCase();
    }

    let matchesCompras = true;
    if (filterCompras) {
      const autoriza = p.autorizaCompras ?? false;
      matchesCompras = filterCompras === 'si' ? autoriza : !autoriza;
    }

    return matchesSearch && matchesRentabilidad && matchesEstado && matchesCompras;
  });

  const isFiltered = searchQuery !== '' || filterRentabilidad !== '' || filterEstado !== '' || filterCompras !== '';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterRentabilidad('');
    setFilterEstado('');
    setFilterCompras('');
    setCurrentPage(1);
  };

  const groupedProyectos = filteredProyectos.reduce((acc, p) => {
    if (!p.cliente?.id) return acc;
    if (!acc[p.cliente.id]) {
      acc[p.cliente.id] = {
        cliente: p.cliente,
        proyectos: [],
        totalVenta: 0,
        totalCostoPresupuestado: 0,
        totalCostoReal: 0,
        totalUtilidadBruta: 0
      };
    }
    acc[p.cliente.id].proyectos.push(p);
    acc[p.cliente.id].totalVenta += Number(p.ventaContratada || 0);
    acc[p.cliente.id].totalCostoPresupuestado += Number(p.costoPresupuestado || 0);
    acc[p.cliente.id].totalCostoReal += Number(p.rentabilidad?.costoRealAcumulado || 0);
    acc[p.cliente.id].totalUtilidadBruta += Number(p.rentabilidad?.utilidadBruta || 0);
    return acc;
  }, {} as Record<string, { cliente: any; proyectos: ProyectoData[]; totalVenta: number; totalCostoPresupuestado: number; totalCostoReal: number; totalUtilidadBruta: number }>);

  const clientsList = Object.values(groupedProyectos).sort((a, b) => a.cliente.empresa.localeCompare(b.cliente.empresa));

  const totalPages = Math.ceil(clientsList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentClients = clientsList.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <CRMHeader 
        title="Control de Costos por Proyecto" 
        subtitle="Análisis de rentabilidad y desglose de egresos en tiempo real." 
      />

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Búsqueda Global</Label>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por código o cliente..." 
                  className="pl-10 h-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-none font-bold text-sm rounded-xl" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>

          <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Rentabilidad</Label>
              <Select value={filterRentabilidad} onValueChange={(val) => setFilterRentabilidad(val || "")}>
                  <SelectTrigger className="h-10 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                      <SelectValue placeholder="TODAS" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="excelente" className="font-black text-[10px] text-emerald-600 uppercase">EXCELENTE {'>= 20%'}</SelectItem>
                      <SelectItem value="riesgo" className="font-black text-[10px] text-amber-600 uppercase">EN RIESGO {'0% - 20%'}</SelectItem>
                      <SelectItem value="perdida" className="font-black text-[10px] text-rose-600 uppercase">PÉRDIDA {'< 0%'}</SelectItem>
                  </SelectContent>
              </Select>
          </div>

          <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Estado</Label>
              <Select value={filterEstado} onValueChange={(val) => setFilterEstado(val || "")}>
                  <SelectTrigger className="h-10 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                      <SelectValue placeholder="TODOS" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="en ejecución" className="font-black text-[10px] uppercase">EN EJECUCIÓN</SelectItem>
                      <SelectItem value="pausado" className="font-black text-[10px] uppercase">PAUSADO</SelectItem>
                      <SelectItem value="por iniciar" className="font-black text-[10px] uppercase">POR INICIAR</SelectItem>
                  </SelectContent>
              </Select>
          </div>

          <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Compras</Label>
              <Select value={filterCompras} onValueChange={(val) => setFilterCompras(val || "")}>
                  <SelectTrigger className="h-10 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                      <SelectValue placeholder="TODAS" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="si" className="font-black text-[10px] text-emerald-600 uppercase">AUTORIZADO</SelectItem>
                      <SelectItem value="no" className="font-black text-[10px] text-rose-600 uppercase">NO AUTORIZADO</SelectItem>
                  </SelectContent>
              </Select>
          </div>

          <Button 
              variant="outline" 
              onClick={resetFilters} 
              disabled={!isFiltered}
              className="h-10 w-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-all rounded-xl gap-2 font-black text-[10px] uppercase"
          >
              <FilterX className="w-3.5 h-3.5" /> Limpiar
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col">
          {currentClients.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium">
              No hay proyectos que coincidan con la búsqueda.
            </div>
          ) : (
            currentClients.map((clientData) => {
              const isExpanded = expandedClients[clientData.cliente.id];
              const rentabilidadTotalPorcentaje = clientData.totalVenta > 0 ? (clientData.totalUtilidadBruta / clientData.totalVenta) * 100 : 0;
              
              return (
                <div key={clientData.cliente.id} className="border-b border-slate-200 last:border-0">
                  <div 
                    className={cn(
                      "flex items-center justify-between p-4 cursor-pointer transition-colors",
                      isExpanded ? "bg-slate-50" : "hover:bg-slate-50"
                    )}
                    onClick={() => toggleClient(clientData.cliente.id)}
                  >
                    <div className="flex items-center gap-3 w-1/3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-black text-xs text-slate-800 uppercase">{clientData.cliente.empresa}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">RUC: {clientData.cliente.ruc}</div>
                      </div>
                    </div>

                    <div className="flex flex-1 justify-around items-center">
                      <div className="text-center hidden md:block">
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-center gap-1">
                          <FolderKanban className="w-3 h-3" /> Servicios Activos
                        </div>
                        <div className="font-black text-xs text-slate-700">{clientData.proyectos.length}</div>
                      </div>
                      
                      <div className="text-center hidden md:block">
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-center gap-1">
                          <Wallet className="w-3 h-3" /> Presupuesto Egresos
                        </div>
                        <div className="font-black text-xs text-orange-600">
                          {formatCurrency(clientData.totalCostoPresupuestado)}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-center gap-1">
                          <Wallet className="w-3 h-3" /> Costo Real
                        </div>
                        <div className={cn(
                          "font-black text-xs",
                          clientData.totalCostoReal > clientData.totalCostoPresupuestado ? "text-rose-600" : "text-emerald-600"
                        )}>
                          {formatCurrency(clientData.totalCostoReal)}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-center gap-1">
                          <Wallet className="w-3 h-3" /> Venta Contratada
                        </div>
                        <div className="font-black text-xs text-emerald-600">
                          {formatCurrency(clientData.totalVenta)}
                        </div>
                      </div>
                      
                      <div className="text-center hidden lg:block">
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-center gap-1">
                          Margen Consolidado
                        </div>
                        <div className={cn(
                          "font-black text-xs",
                          rentabilidadTotalPorcentaje >= 20 ? "text-emerald-600" :
                          rentabilidadTotalPorcentaje > 0 ? "text-amber-600" : "text-rose-600"
                        )}>
                          {rentabilidadTotalPorcentaje.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="pl-4">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50/80 p-4 border-t border-slate-100 shadow-inner">
                      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3">Servicio / Proyecto</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3">Venta</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3">Ppto. Egresos</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3">Costo Real</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3">Desglose Principal</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3">Utilidad</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-3 text-right">Margen</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {clientData.proyectos.map((proyecto) => (
                                <TableRow key={proyecto.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                  <TableCell className="py-3 align-top">
                                    <div className="flex flex-col">
                                      <span className="font-black text-slate-900 text-xs">{proyecto.codigo}</span>
                                      <span className="text-[10px] font-medium text-slate-500 line-clamp-1 mt-0.5" title={proyecto.nombre}>{proyecto.nombre}</span>
                                    </div>
                                  </TableCell>
                                  
                                  <TableCell className="py-3 align-top">
                                    <span className="font-bold text-slate-700 text-xs">{formatCurrency(proyecto.ventaContratada || 0)}</span>
                                  </TableCell>

                                  <TableCell className="py-3 align-top">
                                    <span className="font-bold text-orange-600 text-xs">{formatCurrency(proyecto.costoPresupuestado || 0)}</span>
                                  </TableCell>
                                  
                                  <TableCell className="py-3 align-top">
                                    {proyecto.loading ? (
                                      <div className="flex items-center gap-1 text-slate-400">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      </div>
                                    ) : (
                                      <button 
                                        type="button"
                                        onClick={() => handleOpenGastosModal(proyecto)}
                                        className={cn(
                                          "inline-flex items-center gap-1 font-bold text-xs hover:underline cursor-pointer group/btn focus:outline-none", 
                                          (proyecto.rentabilidad?.costoRealAcumulado || 0) > (proyecto.costoPresupuestado || 0) 
                                            ? "text-rose-600" 
                                            : "text-emerald-600"
                                        )}
                                        title="Haz clic para ver el detalle de todos los gastos"
                                      >
                                        <span>{formatCurrency(proyecto.rentabilidad?.costoRealAcumulado || 0)}</span>
                                        <Eye className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity text-slate-400" />
                                      </button>
                                    )}
                                  </TableCell>

                                  <TableCell className="py-3 align-top max-w-[200px]">
                                    {proyecto.loading ? (
                                      <div className="w-16 h-4 bg-slate-100 animate-pulse rounded"></div>
                                    ) : (
                                      <div className="flex flex-wrap gap-1">
                                        {proyecto.rentabilidad?.desglose && Object.entries(proyecto.rentabilidad.desglose).map(([key, value]) => {
                                          if (value > 0) {
                                            const label = key.replace(/([A-Z])/g, ' $1').toUpperCase();
                                            return (
                                              <Badge key={key} variant="secondary" className="text-[8px] bg-slate-100 text-slate-600 border-none font-bold py-0 h-4">
                                                {label}: {formatCurrency(value)}
                                              </Badge>
                                            );
                                          }
                                          return null;
                                        })}
                                      </div>
                                    )}
                                  </TableCell>

                                  <TableCell className="py-3 align-top">
                                    {!proyecto.loading && proyecto.rentabilidad && (
                                      <span className={cn(
                                        "font-bold text-xs",
                                        proyecto.rentabilidad.utilidadBruta > 0 ? "text-emerald-600" : 
                                        proyecto.rentabilidad.utilidadBruta < 0 ? "text-rose-600" : "text-slate-600"
                                      )}>
                                        {formatCurrency(proyecto.rentabilidad.utilidadBruta)}
                                      </span>
                                    )}
                                  </TableCell>

                                  <TableCell className="py-3 align-top text-right">
                                    {!proyecto.loading && (
                                      <Badge className={cn(
                                        "font-black text-[10px] px-1.5 py-0.5 border-none",
                                        (proyecto.rentabilidad?.rentabilidadProyectada || 0) >= 20 ? "bg-emerald-50 text-emerald-600" :
                                        (proyecto.rentabilidad?.rentabilidadProyectada || 0) > 0 ? "bg-amber-50 text-amber-600" :
                                        "bg-rose-50 text-rose-600"
                                      )}>
                                        {(proyecto.rentabilidad?.rentabilidadProyectada || 0).toFixed(1)}%
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Detalle de Costo Real (Gastos & Materiales) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl p-6 border border-slate-200">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Detalle de Egresos Real - {selectedProyecto?.codigo}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium mt-1">
                  {selectedProyecto?.nombre} | Cliente: {selectedProyecto?.cliente?.empresa}
                </DialogDescription>
              </div>
              <div className="text-right pr-6">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Costo Real Acumulado</span>
                <span className="text-base font-black text-rose-600">
                  {formatCurrency(selectedProyecto?.rentabilidad?.costoRealAcumulado || 0)}
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Banner Informativo */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                Incluye todos los egresos registrados por Logística (Órdenes de Compra y Despachos de Almacén Kardex) y Finanzas.
              </span>
            </div>

            {/* Resumen por Categoría */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Mano de Obra</span>
                <span className="text-sm font-black text-slate-800">
                  {formatCurrency(selectedProyecto?.rentabilidad?.desglose?.manoDeObra || 0)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Materiales (Logística)</span>
                <span className="text-sm font-black text-slate-800">
                  {formatCurrency(selectedProyecto?.rentabilidad?.desglose?.materiales || 0)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Otros Egresos</span>
                <span className="text-sm font-black text-slate-800">
                  {formatCurrency(selectedProyecto?.rentabilidad?.desglose?.otros || 0)}
                </span>
              </div>
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider block">Ppto. Egresos</span>
                <span className="text-sm font-black text-indigo-700">
                  {formatCurrency(selectedProyecto?.costoPresupuestado || 0)}
                </span>
              </div>
            </div>

            {/* Tabla de Gastos y Órdenes de Compra */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Gastos & Órdenes de Compra Registradas ({selectedProyecto?.rentabilidad?.historialGastos?.length || 0})
              </h4>

              {(!selectedProyecto?.rentabilidad?.historialGastos || selectedProyecto.rentabilidad.historialGastos.length === 0) ? (
                <div className="p-4 text-center bg-slate-50 rounded-xl text-xs text-slate-400 font-medium">
                  No hay gastos directos ni órdenes de compra registradas en este proyecto.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-[9px] font-black uppercase text-slate-500">Fecha</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-slate-500">Código / Tipo</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-slate-500">Concepto / O.C. Logística</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-slate-500">Estado</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-slate-500 text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProyecto.rentabilidad.historialGastos.map((gasto) => (
                        <TableRow key={gasto.id} className="text-xs">
                          <TableCell className="font-medium text-slate-500 py-2.5">
                            {gasto.fecha ? new Date(gasto.fecha).toLocaleDateString('es-PE') : '-'}
                          </TableCell>
                          <TableCell className="font-bold text-slate-800 py-2.5">
                            <div>{gasto.codigo || gasto.id.slice(-6)}</div>
                            {gasto.tipo && (
                              <span className="text-[9px] font-semibold text-slate-400 uppercase">{gasto.tipo}</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="font-medium text-slate-800">{gasto.concepto}</div>
                            {gasto.ocCodigo && (
                              <Badge variant="outline" className="text-[8px] border-indigo-200 bg-indigo-50/50 text-indigo-700 font-bold mt-0.5">
                                LOGÍSTICA O.C: {gasto.ocCodigo}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge className={cn(
                              "text-[8px] font-black uppercase px-1.5 py-0.5 border-none",
                              gasto.estado === 'PAGADO' ? "bg-emerald-100 text-emerald-700" :
                              gasto.estado === 'APROBADO' ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
                            )}>
                              {gasto.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-black text-rose-600 text-right py-2.5">
                            {formatCurrency(gasto.monto)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Tabla de Consumo de Materiales (Logística Almacén / Kardex) */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                Despachos & Insumos de Logística / Kardex ({selectedProyecto?.rentabilidad?.historialMateriales?.length || 0})
              </h4>

              {(!selectedProyecto?.rentabilidad?.historialMateriales || selectedProyecto.rentabilidad.historialMateriales.length === 0) ? (
                <div className="p-4 text-center bg-slate-50 rounded-xl text-xs text-slate-400 font-medium">
                  No hay salidas de almacén ni despachos registrados por Logística para este proyecto.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-[9px] font-black uppercase text-slate-500">Fecha</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-slate-500">Material / Insumo Logística</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-slate-500">Origen Logístico</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-slate-500 text-center">Cant.</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-slate-500 text-right">Costo Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProyecto.rentabilidad.historialMateriales.map((mat, idx) => (
                        <TableRow key={idx} className="text-xs">
                          <TableCell className="font-medium text-slate-500 py-2.5">
                            {mat.fecha ? new Date(mat.fecha).toLocaleDateString('es-PE') : '-'}
                          </TableCell>
                          <TableCell className="font-bold text-slate-800 py-2.5">
                            {mat.material}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant="outline" className="text-[8px] border-slate-200 bg-slate-50 text-slate-700 font-bold">
                              {mat.origen}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-slate-700 text-center py-2.5">
                            {mat.cantidad}
                          </TableCell>
                          <TableCell className="font-black text-rose-600 text-right py-2.5">
                            {formatCurrency(mat.costoTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

