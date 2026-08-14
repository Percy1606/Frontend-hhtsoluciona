"use client";

import { useCRMStore } from "@/store/crm-store";
import { useEffect } from "react";
import { AgendaDiaria } from "@/components/crm/agenda-diaria";

export default function AgendaTrabajadoresPage() {
  const { clients, fetchClients } = useCRMStore();

  useEffect(() => {
    fetchClients(1, 1000);
  }, [fetchClients]);

  return (
    <div className="space-y-6">
      <AgendaDiaria clients={clients} isGeneralAgenda={true} />
    </div>
  );
}
