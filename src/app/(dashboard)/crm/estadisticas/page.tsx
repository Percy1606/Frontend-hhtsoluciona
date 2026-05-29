"use client";

import { CRMStats } from "@/components/crm/crm-stats";
import { CRMHeader } from "@/components/crm/crm-header";

export default function EstadisticasPage() {
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
