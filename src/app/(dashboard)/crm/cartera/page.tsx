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
  ChevronRight,
  Target,
  Library,
  Loader2
} from "lucide-react";
import { useCRMStore } from "@/store/crm-store";
import { api } from "@/lib/api";
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
import Link from "next/link";

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
    setEtapaComercial,
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

  useEffect(() => {
    return () => resetFilters();
  }, [resetFilters]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.tarifa !== '' ||
    filters.asignadoA !== '' ||
    filters.etapaComercial !== '' ||
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

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      const queryParams = new URLSearchParams({
        page: '1',
        limit: '10000',
        _t: Date.now().toString(),
      });

      if (filters.searchQuery) queryParams.append('search', filters.searchQuery);
      if (filters.tarifa && filters.tarifa !== 'todas') queryParams.append('tarifa', filters.tarifa);
      if (filters.zona) queryParams.append('zona', filters.zona);
      if (filters.asignadoA) queryParams.append('asignadoA', filters.asignadoA);
      if (filters.clasificacion) queryParams.append('clasificacion', filters.clasificacion);
      if (filters.estado) queryParams.append('estado', filters.estado);
      if (filters.etapaComercial && filters.etapaComercial !== 'todas') queryParams.append('etapaComercial', filters.etapaComercial);
      if (filters.tipoCliente) queryParams.append('tipoCliente', filters.tipoCliente);
      if (filters.fechaDesde) queryParams.append('startDate', filters.fechaDesde);
      if (filters.fechaHasta) queryParams.append('endDate', filters.fechaHasta);

      const response = await api.get(`/crm/clientes?${queryParams.toString()}`);
      
      let allClients: any[] = [];
      if (response && response.data && Array.isArray(response.data)) {
        allClients = response.data;
      } else if (Array.isArray(response)) {
        allClients = response;
      }

      if (!allClients || allClients.length === 0) {
        alert("No se encontraron registros con los filtros actuales para exportar.");
        return;
      }

      const mapEtapa = (etapa: string) => {
        const map: Record<string, string> = {
          "Contactado": "Contacto Inicial",
          "Llamada Realizada": "Contacto Inicial",
          "Visita Agendada": "Visita Técnica",
          "Inspección Realizada": "Visita Técnica",
          "Cotización Enviada": "Cotización",
          "Ganado": "Orden de Servicio"
        };
        return map[etapa] || etapa || "Prospecto";
      };

      const dataToExport = allClients.map((c: any, idx: number) => ({
        "N°": idx + 1,
        "Código": c.codigo || "-",
        "Empresa": c.empresa || "-",
        "RUC": c.ruc || "-",
        "Dirección": c.direccion || "-",
        "Zona Comercial": c.zona || "-",
        "Tarifa": c.tarifa || "-",
        "Etapa Comercial": mapEtapa(c.etapaComercial),
        "Calidad / Rentabilidad": (c.clasificacion || "RENTABLE").replace(/_/g, ' '),
        "Tipo Cliente": c.tipoCliente || "PROSPECTO",
        "Contacto": c.contacto || "-",
        "Cargo": c.cargo || "-",
        "Teléfono": c.telefono || "-",
        "Correo": c.correo || "-"
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);

      // Anchos de columna calculados y elegantes
      ws['!cols'] = [
        { wch: 6 },   // N°
        { wch: 14 },  // Código
        { wch: 38 },  // Empresa
        { wch: 15 },  // RUC
        { wch: 35 },  // Dirección
        { wch: 18 },  // Zona Comercial
        { wch: 10 },  // Tarifa
        { wch: 22 },  // Etapa Comercial
        { wch: 22 },  // Calidad / Rentabilidad
        { wch: 16 },  // Tipo Cliente
        { wch: 26 },  // Contacto
        { wch: 20 },  // Cargo
        { wch: 16 },  // Teléfono
        { wch: 28 }   // Correo
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Base Clientes");

      const etapaTag = filters.etapaComercial && filters.etapaComercial !== 'todas' 
        ? `_${filters.etapaComercial.replace(/\s+/g, '_')}` 
        : '';
      const dateTag = new Date().toISOString().split('T')[0];
      
      XLSX.writeFile(wb, `Cartera_Clientes_HH${etapaTag}_${dateTag}.xlsx`);
    } catch (error: any) {
      console.error("Error exportando a Excel:", error);
      alert("Error al exportar los datos a Excel. Intente nuevamente.");
    } finally {
      setIsExporting(false);
    }
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
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" /> Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Exportar Base
                </>
              )}
            </Button>
            <Link href="/crm/biblioteca">
              <Button 
                variant="outline"
                className="h-12 flex-1 sm:flex-none gap-2 font-black uppercase text-[10px] border-accent text-accent hover:bg-accent hover:text-white rounded-xl px-4 transition-all"
              >
                <Library className="w-4 h-4" /> Biblioteca
              </Button>
            </Link>
            <Button 
              className="h-10 flex-1 sm:flex-none gap-2 font-black uppercase text-xs bg-primary hover:bg-primary/90 text-white shadow-md rounded-xl px-4"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4" /> Registrar Cliente
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
                        <SelectItem value="todas" className="font-black text-[10px] uppercase text-slate-400">TODAS LAS TARIFAS</SelectItem>
                        <SelectItem value="MT1" className="font-black text-[10px] uppercase">MT1</SelectItem>
                        <SelectItem value="MT2" className="font-black text-[10px] uppercase">MT2</SelectItem>
                        <SelectItem value="MT3" className="font-black text-[10px] uppercase">MT3</SelectItem>
                        <SelectItem value="MT4" className="font-black text-[10px] uppercase">MT4</SelectItem>
                        <SelectItem value="BT2" className="font-black text-[10px] uppercase">BT2</SelectItem>
                        <SelectItem value="BT3" className="font-black text-[10px] uppercase">BT3</SelectItem>
                        <SelectItem value="BT4" className="font-black text-[10px] uppercase">BT4</SelectItem>
                        <SelectItem value="BT5B" className="font-black text-[10px] uppercase">BT5B</SelectItem>
                        <SelectItem value="BT5BR" className="font-black text-[10px] uppercase">BT5BR</SelectItem>
                        <SelectItem value="BT5A50" className="font-black text-[10px] uppercase">BT5A50</SelectItem>
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
                        <SelectItem value="Mario" className="font-black text-[10px] uppercase">MARIO</SelectItem>
                        <SelectItem value="Steven" className="font-black text-[10px] uppercase">STEVEN</SelectItem>
                        <SelectItem value="Mellani" className="font-black text-[10px] uppercase">MELLANI</SelectItem>
                        <SelectItem value="Javier" className="font-black text-[10px] uppercase">JAVIER</SelectItem>
                        <SelectItem value="Ariana" className="font-black text-[10px] uppercase">ARIANA</SelectItem>
                        <SelectItem value="Angi" className="font-black text-[10px] uppercase">ANGI</SelectItem>
                        <SelectItem value="Valentina" className="font-black text-[10px] uppercase">VALENTINA</SelectItem>
                        <SelectItem value="Brenda" className="font-black text-[10px] uppercase">BRENDA</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Etapa Comercial</Label>
                <Select value={filters.etapaComercial || ""} onValueChange={(val) => setEtapaComercial(val || "")}>
                    <SelectTrigger className="h-10 text-[10px] border-slate-200 bg-white font-black uppercase rounded-xl shadow-sm">
                        <SelectValue placeholder="SELECCIONAR ETAPA" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="todas" className="font-black text-[10px] uppercase text-slate-400">TODAS LAS ETAPAS</SelectItem>
                        <SelectItem value="Prospecto" className="font-black text-[10px] uppercase">PROSPECTO</SelectItem>
                        <SelectItem value="Visita Comercial" className="font-black text-[10px] uppercase">VISITA COMERCIAL</SelectItem>
                        <SelectItem value="Visita Técnica" className="font-black text-[10px] uppercase">VISITA TÉCNICA</SelectItem>
                        <SelectItem value="Cotización" className="font-black text-[10px] uppercase">COTIZACIÓN</SelectItem>
                        <SelectItem value="Negociación" className="font-black text-[10px] uppercase">NEGOCIACIÓN</SelectItem>
                        <SelectItem value="Orden de Servicio" className="font-black text-[10px] uppercase text-emerald-600">ORDEN DE SERVICIO</SelectItem>
                        <SelectItem value="Perdido" className="font-black text-[10px] uppercase text-red-600">PERDIDO</SelectItem>
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
        <DialogContent className="w-full sm:max-w-2xl md:max-w-3xl max-h-[88vh] overflow-hidden p-0 border-none bg-white shadow-2xl rounded-2xl flex flex-col">
          <DialogHeader className="px-6 py-4 bg-primary text-white rounded-t-2xl shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-black tracking-wide flex items-center gap-2 uppercase">
              <Plus className="w-5 h-5 text-accent" />
              Registrar Nuevo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="p-0 flex-1 overflow-hidden min-h-0 flex flex-col">
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
