"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { ClientTable } from "@/components/crm/client-table";
import { ClientForm } from "@/components/crm/client-form";
import { CRMHeader } from "@/components/crm/crm-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Download,
  X,
  Filter
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
    addClient
  } = useCRMStore();

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
    // Basic export logic for database view
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
        title="Cartera de Clientes" 
        subtitle="Base de datos centralizada de clientes y prospectos." 
      />

      <div className="bg-white p-5 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative w-full lg:w-96 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por empresa, RUC o contacto..." 
              className="pl-10 h-10 border-border bg-muted/20 focus-visible:ring-primary/20" 
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2 font-bold border-primary/20 text-primary bg-white hover:bg-slate-50"
              onClick={handleExportExcel}
            >
              <Download className="w-4 h-4" /> Exportar
            </Button>
            <Button 
              className="gap-2 font-bold bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4" /> Nuevo Cliente
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 mb-2 text-xs font-black text-slate-500 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Filtros de Cartera
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            <Select value={filters.tarifa} onValueChange={(val) => setTarifa(val || "all")}>
              <SelectTrigger className="h-9 text-xs border-border bg-white font-bold">
                <SelectValue placeholder="Tarifa" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Tarifa: Todas</SelectItem>
                <SelectItem value="MT3">MT3</SelectItem>
                <SelectItem value="MT4">MT4</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.asignadoA} onValueChange={(val) => setAsignadoA(val || "all")}>
              <SelectTrigger className="h-9 text-xs border-border bg-white font-bold">
                <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Vendedor: Todos</SelectItem>
                <SelectItem value="Angi">Angi</SelectItem>
                <SelectItem value="Valentina">Valentina</SelectItem>
                <SelectItem value="Ariana">Ariana</SelectItem>
                <SelectItem value="Nicol">Nicol</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.tipoCliente} onValueChange={(val) => setTipoCliente(val || "all")}>
              <SelectTrigger className="h-9 text-xs border-border bg-white font-bold">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Tipo: Todos</SelectItem>
                {uniqueTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.zona} onValueChange={(val) => setZona(val || "all")}>
              <SelectTrigger className="h-9 text-xs border-border bg-white font-bold">
                <SelectValue placeholder="Zona" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Zona: Todas</SelectItem>
                {uniqueZones.map(z => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.estado} onValueChange={(val) => setEstado(val || "all")}>
              <SelectTrigger className="h-9 text-xs border-border bg-white font-bold">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Estado: Todos</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isFiltered && (
            <div className="flex justify-end mt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters} 
                className="text-xs text-muted-foreground hover:text-error gap-1 font-bold h-7"
              >
                <X className="w-3 h-3" /> Limpiar Filtros
              </Button>
            </div>
          )}
        </div>
      </div>

      <ClientTable mode="cartera" />

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-hidden p-0 border-none bg-white shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white rounded-t-xl shrink-0">
            <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-2">
              <Plus className="w-8 h-8 text-accent" />
              Registrar Nuevo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="p-8">
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
