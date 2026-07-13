"use client";

import { CRMStats } from "@/components/crm/crm-stats";
import { CRMHeader } from "@/components/crm/crm-header";
import { useCRMStore } from "@/store/crm-store";
import { useEffect } from "react";

export default function EstadisticasPage() {
  const { fetchClients, fetchQuotes } = useCRMStore();

  useEffect(() => {
    fetchClients(1, 5000, false, true);
    fetchQuotes(1, 1000);
  }, [fetchClients, fetchQuotes]);

  return (
    <div className="space-y-6">
      <CRMHeader 
        title="Informes y Analítica" 
        subtitle="Análisis detallado de rendimiento comercial y ventas proyectadas." 
      />
      <CRMStats />
    </div>
  );
}
