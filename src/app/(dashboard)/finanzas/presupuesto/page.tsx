import { Suspense } from "react";
import PresupuestoClient from "./PresupuestoClient";

export default function PresupuestoOperativoPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-[#001F3F] border-t-transparent"></div>
        <p className="font-black text-primary uppercase text-xs tracking-[0.2em] animate-pulse">Cargando Presupuesto...</p>
      </div>
    }>
      <PresupuestoClient />
    </Suspense>
  );
}
