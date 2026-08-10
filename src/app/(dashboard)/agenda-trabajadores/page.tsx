"use client";

import { AgendaDiaria } from "@/components/crm/agenda-diaria";

export default function AgendaTrabajadoresPage() {
  return (
    <div className="space-y-6">
      <AgendaDiaria clients={[]} isGeneralAgenda={true} />
    </div>
  );
}
