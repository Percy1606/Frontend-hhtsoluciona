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
  FilterX
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
    setSearchQuery,
    setTarifa,
    setAsignadoA,
    setEstado,
    setZona,
    setTipoCliente,
    resetFilters,
    addClient,
    fetchClients
  } = useCRMStore();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.tarifa !== 'all' ||
    filters.asignadoA !== 'all' ||
    filters.estado !== 'all' ||
    filters.zona !== 'all' ||
    filters.tipoCliente !== 'all';

  const uniqueZones = Array.from(new Set(clients.map(c => c.zona).filter(Boolean)));
  const uniqueTypes = Array.from(new Set(clients.map(c => c.tipoCliente).filter(Boolean)));

  const handleCreateClient = (data: any) => {
    addClient(data);
    setIsAddModalOpen(false);
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
      "Teléfono": c.telefono || "",
      "Contacto": c.contacto,
      "Cargo": c.cargo || "",
      "Correo": c.correo || "",
      "Asignado A": c.asignadoA,
      "Tipo Cliente": c.tipoCliente || "Nuevo"
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cartera Clientes");
    XLSX.writeFile(wb, `Cartera_HH_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <CRMHeader 
        title="Clientes" 
        subtitle="Base de datos centralizada de clientes y prospectos." 
      />

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex-1 space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Búsqueda Global</Label>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                placeholder="Buscar por empresa, RUC o contacto..." 
                className="pl-12 h-12 border-slate-200 bg-slate-50/30 focus:bg-white transition-all shadow-none font-bold text-base rounded-xl" 
                value={filters.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="h-12 gap-2 font-black uppercase text-xs border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-6"
              onClick={handleExportExcel}
            >
              <Download className="w-4 h-4" /> Exportar Base
            </Button>
            <Button 
              className="h-12 gap-2 font-black uppercase text-xs bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 rounded-xl px-8"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-5 h-5" /> Nuevo Cliente
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Tarifa</Label>
                <Select value={filters.tarifa} onValueChange={(val) => setTarifa(val || "all")}>
                <SelectTrigger className="h-11 text-xs border-slate-200 bg-white font-bold rounded-xl shadow-sm">
                    <SelectValue placeholder="Tarifa" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all" className="text-slate-400 font-bold uppercase text-[10px] italic">Todas las tarifas</SelectItem>
                    <SelectItem value="MT2" className="font-bold text-[10px]">MT2</SelectItem>
                    <SelectItem value="MT3" className="font-bold text-[10px]">MT3</SelectItem>
                    <SelectItem value="MT4" className="font-bold text-[10px]">MT4</SelectItem>
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Asesor Asignado</Label>
                <Select value={filters.asignadoA} onValueChange={(val) => setAsignadoA(val || "all")}>
                <SelectTrigger className="h-11 text-xs border-slate-200 bg-white font-bold rounded-xl shadow-sm">
                    <SelectValue placeholder="Responsable" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all" className="text-slate-400 font-bold uppercase text-[10px] italic">Todos los asesores</SelectItem>
                    <SelectItem value="Angie" className="font-bold text-[10px]">ANGIE</SelectItem>
                    <SelectItem value="Valentina" className="font-bold text-[10px]">VALENTINA</SelectItem>
                    <SelectItem value="Ariana" className="font-bold text-[10px]">ARIANA</SelectItem>
                    <SelectItem value="Nicoll" className="font-bold text-[10px]">NICOLL</SelectItem>
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Tipo de Cliente</Label>
                <Select value={filters.tipoCliente} onValueChange={(val) => setTipoCliente(val || "all")}>
                <SelectTrigger className="h-11 text-xs border-slate-200 bg-white font-bold rounded-xl shadow-sm">
                    <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all" className="text-slate-400 font-bold uppercase text-[10px] italic">Todos los tipos</SelectItem>
                    {uniqueTypes.map(t => (
                    <SelectItem key={t} value={t} className="font-bold text-[10px] uppercase">{t}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Zona Comercial</Label>
                <Select value={filters.zona} onValueChange={(val) => setZona(val || "all")}>
                <SelectTrigger className="h-11 text-xs border-slate-200 bg-white font-bold rounded-xl shadow-sm">
                    <SelectValue placeholder="Zona" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all" className="text-slate-400 font-bold uppercase text-[10px] italic">Todas las zonas</SelectItem>
                    {uniqueZones.map(z => (
                    <SelectItem key={z} value={z} className="font-bold text-[10px] uppercase">{z}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Estado</Label>
                <Select value={filters.estado} onValueChange={(val) => setEstado(val || "all")}>
                <SelectTrigger className="h-11 text-xs border-slate-200 bg-white font-bold rounded-xl shadow-sm">
                    <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all" className="text-slate-400 font-bold uppercase text-[10px] italic">Todos los estados</SelectItem>
                    <SelectItem value="Activo" className="font-bold text-[10px]">ACTIVO</SelectItem>
                    <SelectItem value="Inactivo" className="font-bold text-[10px]">INACTIVO</SelectItem>
                </SelectContent>
                </Select>
            </div>

            <div className="flex gap-2">
                <Button 
                variant="outline" 
                onClick={resetFilters} 
                disabled={!isFiltered}
                className="h-11 flex-1 text-slate-400 hover:text-error hover:bg-red-50 border border-slate-200 transition-all rounded-xl gap-2 font-black text-[10px] uppercase"
                >
                <FilterX className="w-4 h-4" /> Limpiar
                </Button>
            </div>
          </div>
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
