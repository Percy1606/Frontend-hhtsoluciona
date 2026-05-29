"use client";

import { CRMHeader } from "@/components/crm/crm-header";
import { QuoteManager } from "@/components/crm/quote-manager";

export default function CotizacionesPage() {
  return (
    <div className="space-y-6">
      <CRMHeader 
        title="Cotizaciones y Propuestas" 
        subtitle="Generación, envío y seguimiento de ofertas comerciales." 
      />
      <QuoteManager />
    </div>
  );
}
