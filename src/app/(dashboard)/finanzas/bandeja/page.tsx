import BandejaFinanzas from "@/components/finanzas/bandeja-finanzas";

export default function BandejaFinanzasPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Bandeja de Proyectos - Finanzas</h1>
      <p className="text-sm text-slate-500 mb-6">Revisa y autoriza presupuestos para los proyectos ganados recientemente.</p>
      <BandejaFinanzas />
    </div>
  );
}
