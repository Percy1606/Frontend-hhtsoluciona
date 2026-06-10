"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useAuthStore } from "@/store/auth-store";
import { ConstanciaVisitaImpresion } from "@/components/operaciones/constancia-visita-impresion";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";

export default function ImprimirConstanciaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { fichasTecnicas, borradoresConstancia, fetchFichasTecnicas } = useOperacionesStore();
  const { isAuthenticated } = useAuthStore();
  const [ficha, setFicha] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (fichasTecnicas.length === 0) {
        await fetchFichasTecnicas();
      }
    };
    loadData();
  }, [fetchFichasTecnicas, fichasTecnicas.length]);

  useEffect(() => {
    const found = fichasTecnicas.find(f => f.id === id);
    if (found) {
      setFicha(found);
    }
  }, [id, fichasTecnicas]);

  if (!isHydrated) return null;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <p className="font-black text-primary uppercase text-sm tracking-widest">Sesión no iniciada</p>
        <Button onClick={() => window.location.href = '/login'} className="bg-primary text-white font-black uppercase text-[10px]">Ir al Login</Button>
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-900 border-t-transparent"></div>
        <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Cargando constancia...</p>
      </div>
    );
  }

  const borrador = borradoresConstancia[id] || {};

  return (
    <div className="min-h-screen bg-slate-200 py-8 print:p-0 print:bg-white">
      {/* Barra de Herramientas flotante (oculta al imprimir) */}
      <div className="fixed top-6 right-6 flex gap-3 print:hidden z-50">
        <Button 
          variant="outline" 
          className="bg-white border-slate-300 font-black text-xs uppercase shadow-xl hover:bg-slate-50 text-slate-600"
          onClick={() => window.close()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Cerrar
        </Button>
        <Button 
          className="bg-emerald-900 hover:bg-emerald-800 text-white font-black text-xs uppercase shadow-xl px-8"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4 mr-2" /> Imprimir Constancia
        </Button>
      </div>

      {/* El Formato A4 */}
      <div className="print:m-0">
        <ConstanciaVisitaImpresion 
          ficha={ficha} 
          borrador={borrador} 
          isPrintMode={true} 
        />
      </div>
    </div>
  );
}
