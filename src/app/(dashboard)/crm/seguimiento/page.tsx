"use client";

import { CRMHeader } from "@/components/crm/crm-header";
import { useCRMStore } from "@/store/crm-store";
import { useEffect } from "react";
import { UnidadesGerenciales } from "@/components/crm/unidades-gerenciales";

export default function SeguimientoPage() {
  const { clients, fetchClients } = useCRMStore();

  useEffect(() => {
    fetchClients(1, 1000); // Cargar todos para métricas globales
  }, [fetchClients]);

  return (
    <div className="space-y-6">
      <CRMHeader 
        title="Seguimiento y Fidelización Comercial" 
        subtitle="Centro de control de unidades comerciales, clientes fidelizados y auditoría." 
      />

      {/* CENTRO DE CONTROL Y UNIDADES COMERCIALES GERENCIALES */}
      <UnidadesGerenciales clients={clients} />
    </div>
  );
}

