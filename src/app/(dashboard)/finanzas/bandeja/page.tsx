import BandejaFinanzas from "@/components/finanzas/bandeja-finanzas";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FolderKanban } from "lucide-react";

export default function BandejaFinanzasPage() {
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 mb-1">Bandeja de Proyectos - Finanzas</h1>
          <p className="text-sm text-slate-500">Revisa y autoriza presupuestos para los proyectos ganados recientemente.</p>
        </div>
        <Link href="/operaciones/proyectos">
          <Button 
            className="h-10 px-5 gap-2 text-[10px] uppercase tracking-widest font-black bg-[#001F3F] hover:bg-[#003366] text-white shadow-lg shadow-slate-900/10 rounded-xl transition-all hover:scale-105"
          >
            <FolderKanban className="w-4 h-4 text-blue-300" /> Rentabilidad Operativa
          </Button>
        </Link>
      </div>
      <BandejaFinanzas />
    </div>
  );
}
