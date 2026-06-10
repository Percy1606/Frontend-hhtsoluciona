"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  Calendar, 
  ClipboardCheck, 
  FileText, 
  Info, 
  PenTool, 
  Clock,
  CheckSquare,
  Square
} from "lucide-react";

interface ConstanciaVisitaImpresionProps {
  ficha: any;
  borrador: any;
  onBorradorChange?: (data: any) => void;
  isPrintMode?: boolean;
}

export function ConstanciaVisitaImpresion({ 
  ficha, 
  borrador, 
  onBorradorChange,
  isPrintMode = false 
}: ConstanciaVisitaImpresionProps) {
  
  const updateBorrador = (data: any) => {
    if (onBorradorChange) {
      onBorradorChange(data);
    }
  };

  const localBorrador = borrador || {};
  const actividades = localBorrador.actividadesRealizadas || [];

  const toggleActividad = (act: string) => {
    if (isPrintMode) return;
    const current = [...actividades];
    const index = current.indexOf(act);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(act);
    }
    updateBorrador({ actividadesRealizadas: current });
  };

  const menuActividades = [
    "Inspección visual del sistema eléctrico",
    "Inspección termográfica",
    "Revisión de subestación eléctrica",
    "Verificación de transformadores",
    "Revisión de tableros eléctricos",
    "Reunión técnica"
  ];

  const primaryGreen = "#064e3b"; // Verde oscuro corporativo

  return (
    <div className={cn(
      "bg-white mx-auto p-[1.5cm] w-[21cm] min-h-[29.7cm] shadow-lg print:shadow-none print:p-0 print:w-full print:min-h-0 text-slate-800",
      isPrintMode && "shadow-none"
    )}>
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-8 border-b-2 pb-6" style={{ borderColor: primaryGreen }}>
        <div className="flex gap-4 items-center">
          <div className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-black text-3xl shadow-lg" style={{ backgroundColor: primaryGreen }}>HH</div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none" style={{ color: primaryGreen }}>HH T-SOLUCIONA S.A.C.</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Ingeniería y Servicios Especializados</p>
          </div>
        </div>
        <div className="text-right">
          <div className="px-6 py-3 rounded-xl text-white shadow-md mb-2" style={{ backgroundColor: primaryGreen }}>
            <h2 className="text-sm font-black uppercase tracking-[0.2em]">Constancia de Visita Técnica</h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400">RUC: 20605928374</p>
        </div>
      </div>

      {/* Introducción */}
      <div className="mb-8 px-4 py-4 bg-slate-50 rounded-xl border-l-4" style={{ borderLeftColor: primaryGreen }}>
        <p className="text-xs font-medium leading-relaxed text-slate-600 italic">
          Por medio de la presente se deja constancia que personal técnico de <span className="font-bold text-slate-800">HH T-SOLUCIONA S.A.C.</span> realizó una visita técnica en las instalaciones de la empresa:
        </p>
      </div>

      <div className="space-y-8">
        {/* 1. DATOS DE LA EMPRESA */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg text-white" style={{ backgroundColor: primaryGreen }}>
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: primaryGreen }}>1. DATOS DE LA EMPRESA</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 px-4">
            <div className="flex items-end gap-3 border-b border-slate-200 pb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase min-w-[80px]">Empresa:</span>
              <span className="text-sm font-black uppercase">{ficha.cliente?.empresa}</span>
            </div>
            <div className="flex items-end gap-3 border-b border-slate-200 pb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase min-w-[80px]">RUC:</span>
              <span className="text-sm font-black">{ficha.cliente?.ruc}</span>
            </div>
            <div className="flex items-end gap-3 border-b border-slate-200 pb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase min-w-[80px]">Dirección:</span>
              <span className="text-sm font-bold uppercase truncate">{ficha.cliente?.direccion}</span>
            </div>
          </div>
        </section>

        {/* 2. DATOS DE LA VISITA */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg text-white" style={{ backgroundColor: primaryGreen }}>
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: primaryGreen }}>2. DATOS DE LA VISITA</h3>
          </div>
          <div className="grid grid-cols-3 gap-8 px-4">
            <div className="flex items-end gap-3 border-b border-slate-200 pb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Fecha:</span>
              <span className="text-sm font-black">{format(new Date(ficha.fechaVisita), "dd / MM / yyyy")}</span>
            </div>
            <div className="flex items-end gap-3 border-b border-slate-200 pb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Hora Inicio:</span>
              <input 
                className="text-sm font-black bg-transparent border-none outline-none w-full text-center"
                placeholder="00:00"
                value={localBorrador.horaInicio || ""}
                onChange={(e) => updateBorrador({ horaInicio: e.target.value })}
                readOnly={isPrintMode}
              />
            </div>
            <div className="flex items-end gap-3 border-b border-slate-200 pb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Hora Término:</span>
              <input 
                className="text-sm font-black bg-transparent border-none outline-none w-full text-center"
                placeholder="00:00"
                value={localBorrador.horaFin || ""}
                onChange={(e) => updateBorrador({ horaFin: e.target.value })}
                readOnly={isPrintMode}
              />
            </div>
          </div>
        </section>

        {/* 3. ACTIVIDADES REALIZADAS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg text-white" style={{ backgroundColor: primaryGreen }}>
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: primaryGreen }}>3. ACTIVIDADES REALIZADAS</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 px-6">
            {menuActividades.map((act) => {
              const isSelected = actividades.includes(act);
              return (
                <div key={act} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleActividad(act)}>
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    isSelected ? "bg-emerald-900 border-emerald-900 text-white" : "border-slate-300 group-hover:border-emerald-700"
                  )}>
                    {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                  </div>
                  <span className={cn("text-[11px] font-bold uppercase", isSelected ? "text-slate-800" : "text-slate-500")}>
                    {act}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center",
                localBorrador.otroActividad ? "bg-emerald-900 border-emerald-900 text-white" : "border-slate-300"
              )}>
                {localBorrador.otroActividad && <CheckSquare className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Otro:</span>
              <input 
                className="text-[11px] font-bold text-slate-800 bg-transparent border-none outline-none border-b border-slate-200 w-full uppercase"
                placeholder="ESPECIFICAR ACTIVIDAD"
                value={localBorrador.otroActividad || ""}
                onChange={(e) => updateBorrador({ otroActividad: e.target.value })}
                readOnly={isPrintMode}
              />
            </div>
          </div>
        </section>

        {/* 4. OBSERVACIONES GENERALES */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg text-white" style={{ backgroundColor: primaryGreen }}>
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: primaryGreen }}>4. OBSERVACIONES GENERALES</h3>
          </div>
          <div className="px-4">
            <div className="min-h-[180px] w-full rounded-xl border-2 border-slate-100 p-4 bg-slate-50/30">
              {isPrintMode ? (
                <p className="text-xs font-bold leading-relaxed text-slate-700 whitespace-pre-wrap uppercase">
                  {localBorrador.observaciones || "SIN OBSERVACIONES ADICIONALES."}
                </p>
              ) : (
                <textarea 
                  className="w-full h-full min-h-[140px] bg-transparent border-none outline-none text-xs font-bold text-slate-700 leading-relaxed uppercase resize-none"
                  placeholder="ESCRIBA AQUÍ LAS OBSERVACIONES, COMENTARIOS O RECOMENDACIONES TÉCNICAS..."
                  value={localBorrador.observaciones || ""}
                  onChange={(e) => updateBorrador({ observaciones: e.target.value })}
                />
              )}
            </div>
          </div>
        </section>

        {/* NOTA INFORMATIVA */}
        <div className="mx-4 p-4 rounded-xl border-2 border-dashed flex gap-4 items-start bg-emerald-50/30" style={{ borderColor: primaryGreen + '40' }}>
          <div className="p-2 rounded-full bg-white shadow-sm mt-0.5" style={{ color: primaryGreen }}>
            <Info className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase mb-1" style={{ color: primaryGreen }}>Nota Informativa:</p>
            <p className="text-[10px] font-bold leading-tight text-slate-600">
              La presente constancia acredita únicamente la realización de la visita técnica y las actividades descritas, no constituyendo certificación, conformidad ni aprobación técnica de las instalaciones evaluadas.
            </p>
          </div>
        </div>

        {/* 5. FIRMAS */}
        <section className="pt-8">
          <div className="flex items-center gap-2 mb-12">
            <div className="p-1.5 rounded-lg text-white" style={{ backgroundColor: primaryGreen }}>
              <PenTool className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: primaryGreen }}>5. FIRMAS DE CONFORMIDAD</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-20 px-8">
            {/* Columna Cliente */}
            <div className="space-y-6">
              <div className="border-t-2 border-slate-300 pt-2 text-center">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-16 tracking-widest">Representante de la Empresa</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-end gap-2 border-b border-slate-100 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase min-w-[60px]">Nombre:</span>
                  <span className="text-xs font-black uppercase truncate">{ficha.cliente?.contacto}</span>
                </div>
                <div className="flex items-end gap-2 border-b border-slate-100 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase min-w-[60px]">Cargo:</span>
                  <span className="text-xs font-black uppercase">__________________</span>
                </div>
                <div className="flex items-end gap-2 border-b border-slate-100 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase min-w-[60px]">Fecha:</span>
                  <span className="text-xs font-black">{format(new Date(ficha.fechaVisita), "dd / MM / yyyy")}</span>
                </div>
              </div>
            </div>

            {/* Columna HH */}
            <div className="space-y-6">
              <div className="border-t-2 border-slate-300 pt-2 text-center">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-16 tracking-widest">HH T-SOLUCIONA S.A.C.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-end gap-2 border-b border-slate-100 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase min-w-[60px]">Nombre:</span>
                  <span className="text-xs font-black uppercase truncate">{ficha.tecnico?.nombre}</span>
                </div>
                <div className="flex items-end gap-2 border-b border-slate-100 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase min-w-[60px]">Cargo:</span>
                  <span className="text-xs font-black uppercase">{ficha.tecnico?.cargo || "INGENIERO DE CAMPO"}</span>
                </div>
                <div className="flex items-end gap-2 border-b border-slate-100 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase min-w-[60px]">Fecha:</span>
                  <span className="text-xs font-black">{format(new Date(ficha.fechaVisita), "dd / MM / yyyy")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Pie de Página */}
      <div className="mt-16 pt-6 border-t border-slate-100 text-center">
         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">HH T SOLUCIONA SAC | RUC: 20605928374 | www.httsolutions.com.pe</p>
      </div>
    </div>
  );
}
