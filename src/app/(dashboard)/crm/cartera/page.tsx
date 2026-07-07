"use client";

import { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { ClientTable } from "@/components/crm/client-table";
import { ClientForm } from "@/components/crm/client-form";
import { CRMHeader } from "@/components/crm/crm-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Download,
  X,
  Filter,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Target
} from "lucide-react";
import { useCRMStore } from "@/store/crm-store";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CarteraPage() {
  const {
    clients,
    filters,
    zones,
    totalClients,
    page,
    limit,
    totalPages,
    setSearchQuery,
    setTarifa,
    setAsignadoA,
    setEstado,
    setZona,
    setTipoCliente,
    setClasificacion,
    setFechaRango,
    resetFilters,
    addClient,
    fetchClients,
    loading
  } = useCRMStore();

  useEffect(() => {
    fetchClients(page, limit);
  }, [fetchClients, page, limit, filters]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.tarifa !== '' ||
    filters.asignadoA !== '' ||
    filters.estado !== '' ||
    filters.zona !== '' ||
    filters.clasificacion !== '' ||
    filters.tipoCliente !== '';

  const handleCreateClient = async (data: any) => {
    try {
      await addClient(data);
      setIsAddModalOpen(false);
      // fetchClients() is called inside addClient
    } catch (error: any) {
      alert(error.message || "Error al crear el cliente");
    }
  };

  const handleExportExcel = () => {
    const dataToExport = clients.map((c, idx) => ({
      "N°": idx + 1,
      "Código": c.codigo,
      "Empresa": c.empresa,
      "RUC": c.ruc,
      "Dirección": c.direccion,
      "Zona": c.zona,
      "Tarifa": c.tarifa,
      "Clasificación": c.clasificacion || "Sin asignar",
      "Tipo Cliente": c.tipoCliente || "Prospecto",
      "Teléfono": c.telefono || "",
      "Contacto": c.contacto,
      "Cargo": c.cargo || "",
      "Correo": c.correo || "",
      "Asignado A": c.asignadoA,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cartera Clientes");
    XLSX.writeFile(wb, `Cartera_HH_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <CRMHeader 
        title="Base de Datos Clientes" 
        subtitle="Gestión integral de prospectos y clientes reales de HH T Soluciona." 
      />

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Fila 1: Búsqueda y Acciones */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Búsqueda Global</Label>
            </div>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por empresa, RUC o contacto ..." 
                  className="pl-11 h-12 border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-none font-bold text-sm rounded-xl" 
                  value={filters.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Button 
              variant="outline" 
              className="h-12 flex-1 sm:flex-none gap-2 font-black uppercase text-[10px] border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-4"
              onClick={handleExportExcel}
            >
              <Download className="w-4 h-4" /> Exportar Base
            </Button>
            <Button 
              className="h-12 flex-1 sm:flex-none gap-2 font-black uppercase text-[10px] bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 rounded-xl px-4"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4" /> Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* Separador sutil */}
        <div className="border-t border-slate-100" />

        {/* Fila 2: Filtros de Segmentación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Calidad</Label>
                <Select value={filters.clasificacion} onValueChange={(val) => setClasificacion(val || "")}>
                    <SelectTrigger className="h-10 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                        <SelectValue placeholder="SELECCIONAR CALIDAD" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="MUY_RENTABLE" className="font-black text-[10px] text-green-600 uppercase">MUY RENTABLE</SelectItem>
                        <SelectItem value="RENTABLE" className="font-black text-[10px] text-blue-600 uppercase">RENTABLE</SelectItem>
                        <SelectItem value="POCO_RENTABLE" className="font-black text-[10px] text-slate-600 uppercase">POCO RENTABLE</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Tarifa</Label>
                <Select value={filters.tarifa} onValueChange={(val) => setTarifa(val || "")}>
                    <SelectTrigger className="h-10 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                        <SelectValue placeholder="SELECCIONAR TARIFA" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="MT1" className="font-black text-[10px] uppercase">MT1</SelectItem>
                        <SelectItem value="MT2" className="font-black text-[10px] uppercase">MT2</SelectItem>
                        <SelectItem value="MT3" className="font-black text-[10px] uppercase">MT3</SelectItem>
                        <SelectItem value="MT4" className="font-black text-[10px] uppercase">MT4</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Zona Comercial</Label>
                <Select value={filters.zona} onValueChange={(val) => setZona(val || "")}>
                    <SelectTrigger className="h-10 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                        <SelectValue placeholder="SELECCIONAR ZONA" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                        {zones.length === 0 ? (
                            <>
                                <SelectItem value="Piura" className="font-black text-[10px] uppercase">PIURA</SelectItem>
                                <SelectItem value="Sullana" className="font-black text-[10px] uppercase">SULLANA</SelectItem>
                                <SelectItem value="Paita" className="font-black text-[10px] uppercase">PAITA</SelectItem>
                                <SelectItem value="Talara" className="font-black text-[10px] uppercase">TALARA</SelectItem>
                                <SelectItem value="Lima" className="font-black text-[10px] uppercase">LIMA</SelectItem>
                            </>
                        ) : (
                            zones.map(z => (
                                <SelectItem key={z} value={z} className="font-black text-[10px] uppercase">{z.toUpperCase()}</SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Asesor Asignado</Label>
                <Select value={filters.asignadoA} onValueChange={(val) => setAsignadoA(val || "")}>
                    <SelectTrigger className="h-10 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                        <SelectValue placeholder="SELECCIONAR ASESOR" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="Angie" className="font-black text-[10px] uppercase">ANGIE</SelectItem>
                        <SelectItem value="Valentina" className="font-black text-[10px] uppercase">VALENTINA</SelectItem>
                        <SelectItem value="Ariana" className="font-black text-[10px] uppercase">ARIANA</SelectItem>
                        <SelectItem value="Nicoll" className="font-black text-[10px] uppercase">NICOLL</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Estado Comercial</Label>
                <Select value={filters.estado} onValueChange={(val) => setEstado(val || "")}>
                    <SelectTrigger className="h-10 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                        <SelectValue placeholder="SELECCIONAR ESTADO" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="Activo" className="font-black text-[10px] uppercase">ACTIVO</SelectItem>
                        <SelectItem value="Inactivo" className="font-black text-[10px] uppercase">INACTIVO</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button 
                variant="outline" 
                onClick={resetFilters} 
                disabled={!isFiltered}
                className="h-10 w-full text-slate-400 hover:text-error hover:bg-red-50 border border-slate-200 transition-all rounded-xl gap-2 font-black text-[10px] uppercase"
            >
                <FilterX className="w-3.5 h-3.5" /> Limpiar
            </Button>
        </div>
      </div>

      <ClientTable mode="cartera" />

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-hidden p-0 border-none bg-white shadow-2xl rounded-xl">
          <DialogHeader className="p-8 bg-primary text-white rounded-t-xl shrink-0">
            <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-2 uppercase">
              <Plus className="w-8 h-8 text-accent" />
              Registrar Nuevo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="p-0 flex-1 overflow-hidden">
            <ClientForm 
              onSubmit={handleCreateClient} 
              onCancel={() => setIsAddModalOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
