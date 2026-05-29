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
import { Filter, User } from "lucide-react";
import { useState } from "react";

export default function PipelinePage() {
  const { filters, setAsignadoA } = useCRMStore();

  return (
    <div className="space-y-6">
      <CRMHeader 
        title="Pipeline de Ventas" 
        subtitle="Visualización comercial y embudo de conversión en tiempo real." 
      />

      <div className="bg-white p-3 rounded-xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-black text-primary uppercase px-2">
          <Filter className="w-4 h-4 text-accent" /> Filtros Comerciales
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Filtrar por Asesor:</span>
            <Select value={filters.asignadoA} onValueChange={(val) => setAsignadoA(val || "all")}>
              <SelectTrigger className="w-[180px] h-8 text-xs font-bold border-slate-200">
                <SelectValue placeholder="Todos los asesores" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Todos los asesores</SelectItem>
                <SelectItem value="Angi">Angi</SelectItem>
                <SelectItem value="Valentina">Valentina</SelectItem>
                <SelectItem value="Ariana">Ariana</SelectItem>
                <SelectItem value="Nicol">Nicol</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ClientKanban />
    </div>
  );
}
