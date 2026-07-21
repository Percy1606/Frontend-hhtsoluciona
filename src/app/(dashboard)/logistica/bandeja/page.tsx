"use client";

import { useState } from "react";
import BandejaLogistica from "@/components/logistica/bandeja-logistica";
import CertificadosEquipos from "@/components/logistica/certificados-equipos";
import { ClipboardList, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BandejaLogisticaPage() {
  const [vista, setVista] = useState<"bandeja" | "certificados">("bandeja");

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 mb-1">
            {vista === "bandeja" ? "Bandeja de Proyectos - Logística" : "Certificados de Equipos"}
          </h1>
          <p className="text-sm text-slate-500">
            {vista === "bandeja"
              ? "Revisa los requerimientos de proyectos que ya cuentan con autorización financiera de compras."
              : "Gestión de certificados de calibración y vencimiento de equipos."}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setVista("bandeja")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200 border shadow-sm",
              vista === "bandeja"
                ? "bg-blue-600 text-white border-blue-600 shadow-blue-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            <ClipboardList className="w-4 h-4" />
            Bandeja
          </button>
          <button
            onClick={() => setVista("certificados")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200 border shadow-sm",
              vista === "certificados"
                ? "bg-blue-600 text-white border-blue-600 shadow-blue-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            Certificados
          </button>
        </div>
      </div>

      {vista === "bandeja" ? <BandejaLogistica /> : <CertificadosEquipos />}
    </div>
  );
}
