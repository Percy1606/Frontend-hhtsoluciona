"use client";

import { CRMHeader } from "@/components/crm/crm-header";
import { useCRMStore } from "@/store/crm-store";
import { useEffect } from "react";
import { AgendaDiaria } from "@/components/crm/agenda-diaria";

export default function AgendaDiariaExclusivaPage() {
  const { clients, fetchClients } = useCRMStore();

  useEffect(() => {
    fetchClients(1, 1000);
  }, [fetchClients]);

  return (
    <div className="space-y-6">
      <CRMHeader 
        title="Agenda Diaria, Tareas Estratégicas y Fidelización" 
        subtitle="Panel exclusivo para creación de Tareas, Subtareas por fecha y seguimiento a Clientes Fidelizados." 
      />

      {/* PANEL EXCLUSIVO Y DEDICADO DE AGENDA DIARIA & FIDELIZACIÓN */}
      <AgendaDiaria clients={clients} />
    </div>
  );
}
