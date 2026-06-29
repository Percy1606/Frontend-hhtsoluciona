"use client";

import { ClientKanban } from "@/components/crm/client-kanban";
import { CRMHeader } from "@/components/crm/crm-header";
import { useCRMStore } from "@/store/crm-store";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { User, FilterX, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PipelinePage() {
  const { filters, setAsignadoA, setSearchQuery, fetchClients } = useCRMStore();

  useEffect(() => {
    fetchClients(1, 1000);
  }, [fetchClients]);

  return (
    <div className="space-y-6">
      <CRMHeader 
        title="Proceso de ventas" 
        subtitle="Visualización comercial y embudo de conversión en tiempo real." 
      />

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1 space-y-4">
          <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Filtros de Búsqueda y Responsable</Label>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 md:max-w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por empresa o código..." 
                className="pl-10 h-12 border-slate-200 bg-slate-50/30 focus:bg-white rounded-xl shadow-sm font-bold text-xs"
                value={filters.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={filters.asignadoA} onValueChange={(val) => setAsignadoA(val || "")}>
              <SelectTrigger className="w-full md:w-[300px] h-12 text-[10px] font-black uppercase border-slate-200 bg-slate-50/30 focus:bg-white rounded-xl shadow-sm">
                <SelectValue placeholder="SELECCIONAR ASESOR" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-xl">
                <SelectItem value="Angie" className="font-black uppercase text-[10px]">ANGIE</SelectItem>
                <SelectItem value="Valentina" className="font-black uppercase text-[10px]">VALENTINA</SelectItem>
                <SelectItem value="Ariana" className="font-black uppercase text-[10px]">ARIANA</SelectItem>
                <SelectItem value="Nicoll" className="font-black uppercase text-[10px]">NICOLL</SelectItem>
              </SelectContent>
            </Select>
            {(filters.asignadoA || filters.searchQuery) && (
                <Button 
                    variant="ghost" 
                    onClick={() => { setAsignadoA(""); setSearchQuery(""); }}
                    className="h-12 text-[10px] font-black uppercase text-error hover:bg-red-50 gap-2 px-4 rounded-xl"
                >
                    <FilterX className="w-4 h-4" /> Limpiar
                </Button>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
            <User className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase">Vista de Embudo Activa</span>
        </div>
      </div>

      <ClientKanban />
    </div>
  );
}
