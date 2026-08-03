"use client";

import { CRMHeader } from "@/components/crm/crm-header";
import { useCRMStore } from "@/store/crm-store";
import { useEffect } from "react";
import { AgendaDiaria } from "@/components/crm/agenda-diaria";
import { UnidadesGerenciales } from "@/components/crm/unidades-gerenciales";

export default function SeguimientoPage() {
  const { clients, fetchClients } = useCRMStore();

  useEffect(() => {
    fetchClients(1, 1000); // Cargar todos para métricas globales
  }, [fetchClients]);

  return (
    <div className="space-y-6">
      <CRMHeader 
        title="Seguimiento y Agenda Diaria Comercial" 
        subtitle="Centro de control diario de actividades, unidades comerciales y recordatorios." 
      />

      {/* CENTRO DE CONTROL Y UNIDADES COMERCIALES GERENCIALES (TEMA BLANCO ELEGANTE) */}
      <UnidadesGerenciales clients={clients} />

      {/* AGENDA DIARIA PERSONALIZADA (4 ESTADOS ESTRICTOS) */}
      <AgendaDiaria clients={clients} />
    </div>
  );
}
