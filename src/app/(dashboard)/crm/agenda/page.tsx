"use client";

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
      {/* PANEL EXCLUSIVO Y DEDICADO DE AGENDA DIARIA & FIDELIZACIÓN */}
      <AgendaDiaria clients={clients} />
    </div>
  );
}
