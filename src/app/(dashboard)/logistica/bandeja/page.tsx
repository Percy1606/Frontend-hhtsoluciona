import BandejaLogistica from "@/components/logistica/bandeja-logistica";

export default function BandejaLogisticaPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Bandeja de Proyectos - Logística</h1>
      <p className="text-sm text-slate-500 mb-6">Revisa los requerimientos de proyectos que ya cuentan con autorización financiera de compras.</p>
      <BandejaLogistica />
    </div>
  );
}
