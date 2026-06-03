"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCRMStore, Quote } from "@/store/crm-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Printer, ArrowLeft, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function QuotePreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { quotes, fetchQuotes } = useCRMStore();
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  useEffect(() => {
    if (quotes.length > 0 && id) {
      const found = quotes.find(q => q.id === id);
      if (found) setQuote(found);
    }
  }, [quotes, id]);

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hola, te adjunto el enlace a nuestra propuesta técnica ${quote.codigo} para su revisión.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Barra de herramientas (No se imprime) */}
        <div className="print:hidden flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="font-bold text-xs uppercase">
              <Printer className="w-4 h-4 mr-2" /> Imprimir / Guardar PDF
            </Button>
            <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase shadow-lg shadow-[#25D366]/20" onClick={handleWhatsApp}>
              <Send className="w-4 h-4 mr-2" /> Enviar por WhatsApp
            </Button>
          </div>
        </div>

        {/* Documento A4 */}
        <Card className="bg-white shadow-xl print:shadow-none print:border-none print:m-0 border-slate-200">
          <CardContent className="p-8 md:p-12 space-y-8 text-slate-800">
            {/* Encabezado */}
            <div className="flex justify-between items-start border-b-2 border-primary pb-6">
              <div>
                <h1 className="text-3xl font-black text-primary tracking-tighter">PROFORMA</h1>
                <p className="text-sm font-bold text-slate-500 tracking-widest mt-1">N° {quote.codigo}</p>
              </div>
              <div className="text-right space-y-1 text-xs">
                <p className="font-black text-primary text-base">HH T SOLUCIONA S.A.C.</p>
                <p className="font-semibold text-slate-600">RUC: 20611371692</p>
                <p className="font-semibold text-slate-600">Fecha: {formatDate(quote.fecha)}</p>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 grid grid-cols-[120px_1fr] gap-y-2 text-sm">
              <div className="font-bold text-slate-500">RAZÓN SOCIAL:</div>
              <div className="font-black text-slate-700">{quote.empresa}</div>
              
              <div className="font-bold text-slate-500">CONTACTO:</div>
              <div className="font-bold text-slate-700">{quote.contacto}</div>
            </div>

            {/* Referencia */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase text-primary tracking-widest bg-primary/5 p-2 rounded">Referencia</h2>
              <p className="text-sm font-bold text-slate-700 leading-relaxed px-2 uppercase">{quote.referencia || "Servicio Técnico"}</p>
            </div>

            {/* Objetivo */}
            {quote.objetivo && (
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase text-primary tracking-widest bg-primary/5 p-2 rounded">1. Objetivo del Servicio</h2>
                <p className="text-sm text-slate-700 leading-relaxed px-2 whitespace-pre-wrap">{quote.objetivo}</p>
              </div>
            )}

            {/* Alcance */}
            {quote.alcance && quote.alcance.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-black uppercase text-primary tracking-widest bg-primary/5 p-2 rounded">2. Alcance del Servicio</h2>
                <ul className="space-y-2 px-2">
                  {quote.alcance.map((item: any, i: number) => (
                    <li key={i} className="text-sm text-slate-700 leading-relaxed flex items-start gap-2">
                      <span className="font-black text-primary">{i + 1}.</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Consideraciones */}
            {(quote as any).consideraciones && (
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase text-primary tracking-widest bg-primary/5 p-2 rounded">3. Consideraciones Técnicas</h2>
                <p className="text-sm text-slate-700 leading-relaxed px-2 whitespace-pre-wrap">{(quote as any).consideraciones}</p>
              </div>
            )}

            {/* Entregables */}
            {(quote as any).entregables && (
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase text-primary tracking-widest bg-primary/5 p-2 rounded">4. Entregables</h2>
                <p className="text-sm text-slate-700 leading-relaxed px-2 whitespace-pre-wrap">{(quote as any).entregables}</p>
              </div>
            )}

            {/* Inversión */}
            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 mt-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-black uppercase text-primary tracking-widest">Inversión Total (Sin IGV)</h2>
                  <p className="text-xs font-bold text-slate-500 mt-1">Sujeto a las condiciones comerciales descritas.</p>
                </div>
                <div className="text-3xl font-black text-primary tracking-tighter">
                  {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(quote.monto)}
                </div>
              </div>
            </div>

            {/* Cuentas Bancarias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 text-xs">
              <div className="space-y-1">
                <p className="font-black text-slate-800 uppercase">BBVA BANCO CONTINENTAL SOLES</p>
                <p className="text-slate-600">Cuenta corriente: 0011-0667-0200388108</p>
                <p className="text-slate-600">CCI: 011-667-000200388108-39</p>
              </div>
              <div className="space-y-1">
                <p className="font-black text-slate-800 uppercase">BANCO DE LA NACIÓN</p>
                <p className="text-slate-600">Cuenta de detracción (12%): 00-631-443907</p>
              </div>
            </div>
            
            {/* Pie de página para impresión */}
            <div className="hidden print:block fixed bottom-0 left-0 w-full text-center text-[10px] text-slate-400 pb-4 border-t border-slate-200 pt-2">
              HH T SOLUCIONA S.A.C. | RUC 20611371692 | Documento generado electrónicamente
            </div>
          </CardContent>
        </Card>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 20mm; }
          body { background-color: white; }
        }
      `}} />
    </div>
  );
}