"use client";

import { useState } from "react";
import BandejaInspecciones from "@/components/operaciones/bandeja-inspecciones";
import ActividadesGenerales from "@/components/operaciones/actividades-generales";
import { ClipboardList, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BandejaOperacionesPage() {
  const [vista, setVista] = useState<"inspecciones" | "actividades">("inspecciones");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-sm font-black text-slate-800 uppercase mb-0.5 tracking-tight">
            {vista === "inspecciones" ? "Inspecciones en Campo" : "Actividades Generales"}
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            {vista === "inspecciones"
              ? "Control Operativo de Visitas Técnicas asignadas por el área Comercial."
              : "Gestión de tareas operativas libres, asignación de responsables y evidencias."}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setVista("inspecciones")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200",
              vista === "inspecciones"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ClipboardList className="w-4 h-4" />
            Inspecciones
          </button>
          <button
            onClick={() => setVista("actividades")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200",
              vista === "actividades"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Briefcase className="w-4 h-4" />
            Actividades
          </button>
        </div>
      </div>

      {vista === "inspecciones" ? <BandejaInspecciones /> : <ActividadesGenerales />}
    </div>
  );
}
