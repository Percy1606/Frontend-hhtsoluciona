import { Suspense } from "react";
import ActividadesClient from "./ActividadesClient";

export default function ActividadesPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="font-black text-primary uppercase text-xs tracking-[0.2em] animate-pulse">Cargando Actividades...</p>
      </div>
    }>
      <ActividadesClient />
    </Suspense>
  );
}
