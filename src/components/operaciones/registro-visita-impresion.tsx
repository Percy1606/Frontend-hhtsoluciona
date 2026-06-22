"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RegistroVisitaImpresionProps {
  ficha: any;
  borrador: any;
  onBorradorChange?: (data: any) => void;
  isPrintMode?: boolean;
}

export function RegistroVisitaImpresion({ 
  ficha, 
  borrador, 
  onBorradorChange,
  isPrintMode = false 
}: RegistroVisitaImpresionProps) {
  
  const updateBorrador = (data: any) => {
    if (onBorradorChange) {
      onBorradorChange(data);
    }
  };

  const localBorrador = borrador || {};

  return (
    <div className={cn(
      "bg-white mx-auto p-[1.5cm] w-[21cm] min-h-[29.7cm] shadow-lg print:shadow-none print:p-0 print:w-full print:min-h-0",
      isPrintMode && "shadow-none"
    )}>
      {/* Cabecera Corporativa */}
      <div className="flex justify-between items-start mb-8 border-b-4 border-[#001529] pb-4">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 bg-[#001529] rounded-lg flex items-center justify-center text-white font-black text-2xl">HH</div>
          <div>
            <h1 className="text-2xl font-black text-[#001529] leading-none tracking-tighter uppercase">HH T Soluciona SAC</h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Ingeniería, Mantenimiento y Servicios Especializados</p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-[#001529] text-white px-4 py-2 rounded-md inline-block mb-2">
            <h2 className="text-xs font-black uppercase tracking-widest">Registro de Visita Técnica</h2>
          </div>
          <div className="flex items-center justify-end gap-1">
            <p className="text-[11px] font-bold text-[#001529]">Código de visita:</p>
            {isPrintMode ? (
              <span className="text-[11px] font-bold text-[#001529]">{localBorrador.codigoVisita || "HH-2026-______"}</span>
            ) : (
              <input 
                className="text-[11px] font-bold text-[#001529] bg-transparent border-none outline-none w-24 border-b border-transparent focus:border-slate-200"
                value={localBorrador.codigoVisita || "HH-2026-______"}
                onChange={(e) => updateBorrador({ codigoVisita: e.target.value })}
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* OBSERVACIONES DE COORDINACIÓN */}
        {ficha.observaciones && (
          <section className="bg-amber-50 border border-amber-200 rounded-lg p-4 print:bg-white print:border-slate-300 print:text-black shadow-inner">
            <h3 className="text-amber-800 print:text-[#001529] text-[10px] font-black uppercase mb-1.5 tracking-widest">INDICACIONES DE COORDINACIÓN / TRABAJOS A REALIZAR</h3>
            <p className="text-xs font-bold text-slate-700 print:text-black leading-relaxed whitespace-pre-wrap">{ficha.observaciones}</p>
          </section>
        )}

        {/* 1. DATOS GENERALES */}
        <section>
          <h3 className="bg-[#001529] text-white text-[10px] font-black uppercase px-3 py-1 mb-3 tracking-widest">1. DATOS GENERALES</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-2">
            <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
              <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Fecha de la visita:</span>
              <span className="text-xs font-bold text-slate-800">{format(new Date(ficha.fechaVisita), "dd / MM / yyyy")}</span>
            </div>
            <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
              <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Empresa:</span>
              <span className="text-xs font-bold text-slate-800 uppercase truncate">{ficha.cliente?.empresa}</span>
            </div>
            <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
              <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">RUC:</span>
              <span className="text-xs font-bold text-slate-800">{ficha.cliente?.ruc}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Sector:</span>
              <div className="flex gap-3">
                {['Agro', 'Pesca', 'Industrial', 'Comercial'].map(s => {
                  const currentSector = localBorrador.sector || ficha.datosTecnicos?.sector;
                  return (
                    <div key={s} className="flex items-center gap-1 cursor-pointer" onClick={() => !isPrintMode && updateBorrador({ sector: s, sectorOtro: '' })}>
                      <div className={cn(
                        "w-3 h-3 border border-slate-400 rounded-sm flex items-center justify-center",
                        currentSector === s && "bg-[#001529] border-[#001529]"
                      )}>
                        {currentSector === s && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-[9px] font-bold text-slate-600">{s}</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-1">
                  <div className={cn(
                      "w-3 h-3 border border-slate-400 rounded-sm flex items-center justify-center",
                      (localBorrador.sectorOtro || ficha.datosTecnicos?.sectorOtro) && "bg-[#001529] border-[#001529]"
                    )}>
                      {(localBorrador.sectorOtro || ficha.datosTecnicos?.sectorOtro) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                  <span className="text-[9px] font-bold text-slate-600 shrink-0">Otro:</span>
                  {isPrintMode ? (
                    <span className="text-[9px] font-bold text-slate-600 border-b border-slate-200 min-w-[40px] px-1">
                      {localBorrador.sectorOtro || ficha.datosTecnicos?.sectorOtro || ""}
                    </span>
                  ) : (
                    <input 
                      className="text-[9px] font-bold text-slate-600 bg-transparent border-none outline-none border-b border-slate-200 w-16"
                      placeholder="________"
                      value={localBorrador.sectorOtro || ficha.datosTecnicos?.sectorOtro || ""}
                      onChange={(e) => updateBorrador({ sectorOtro: e.target.value, sector: '' })}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. UBICACIÓN */}
        <section>
          <h3 className="bg-[#001529] text-white text-[10px] font-black uppercase px-3 py-1 mb-3 tracking-widest">2. UBICACIÓN</h3>
          <div className="space-y-4 px-2">
            <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
              <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Dirección:</span>
              {isPrintMode ? (
                <span className="text-xs font-bold text-slate-800 uppercase">{localBorrador.direccion || ficha.cliente?.direccion || ""}</span>
              ) : (
                <input 
                  className="text-xs font-bold text-slate-800 uppercase bg-transparent border-none outline-none w-full"
                  value={localBorrador.direccion || ficha.cliente?.direccion || ""}
                  onChange={(e) => updateBorrador({ direccion: e.target.value })}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Distrito:</span>
                {isPrintMode ? (
                  <span className="text-xs font-bold text-slate-800 uppercase">{localBorrador.distrito || ficha.datosTecnicos?.distrito || ""}</span>
                ) : (
                  <input 
                    className="text-xs font-bold text-slate-800 uppercase bg-transparent border-none outline-none w-full"
                    placeholder="__________________"
                    value={localBorrador.distrito || ficha.datosTecnicos?.distrito || ""}
                    onChange={(e) => updateBorrador({ distrito: e.target.value })}
                  />
                )}
              </div>
              <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Provincia:</span>
                {isPrintMode ? (
                  <span className="text-xs font-bold text-slate-800 uppercase">{localBorrador.provincia || ficha.datosTecnicos?.provincia || ""}</span>
                ) : (
                  <input 
                    className="text-xs font-bold text-slate-800 uppercase bg-transparent border-none outline-none w-full"
                    placeholder="__________________"
                    value={localBorrador.provincia || ficha.datosTecnicos?.provincia || ""}
                    onChange={(e) => updateBorrador({ provincia: e.target.value })}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 3. CONTACTO PRINCIPAL */}
        <section>
          <h3 className="bg-[#001529] text-white text-[10px] font-black uppercase px-3 py-1 mb-3 tracking-widest">3. CONTACTO PRINCIPAL</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-2">
            <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
              <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Nombre:</span>
              {isPrintMode ? (
                <span className="text-xs font-bold text-slate-800 uppercase">{localBorrador.contacto || ficha.cliente?.contacto || ""}</span>
              ) : (
                <input 
                  className="text-xs font-bold text-slate-800 uppercase bg-transparent border-none outline-none w-full"
                  value={localBorrador.contacto || ficha.cliente?.contacto || ""}
                  onChange={(e) => updateBorrador({ contacto: e.target.value })}
                />
              )}
            </div>
            <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
              <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Cargo:</span>
              {isPrintMode ? (
                <span className="text-xs font-bold text-slate-800 uppercase">{localBorrador.contactoCargo || ficha.datosTecnicos?.contactoCargo || ""}</span>
              ) : (
                <input 
                  className="text-xs font-bold text-slate-800 uppercase bg-transparent border-none outline-none w-full"
                  placeholder="__________________"
                  value={localBorrador.contactoCargo || ficha.datosTecnicos?.contactoCargo || ""}
                  onChange={(e) => updateBorrador({ contactoCargo: e.target.value })}
                />
              )}
            </div>
            <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
              <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Teléfono:</span>
              {isPrintMode ? (
                <span className="text-xs font-bold text-slate-800 uppercase">{localBorrador.telefono || ficha.cliente?.telefono || ""}</span>
              ) : (
                <input 
                  className="text-xs font-bold text-slate-800 uppercase bg-transparent border-none outline-none w-full"
                  value={localBorrador.telefono || ficha.cliente?.telefono || ""}
                  onChange={(e) => updateBorrador({ telefono: e.target.value })}
                />
              )}
            </div>
            <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
              <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Correo electrónico:</span>
              {isPrintMode ? (
                <span className="text-xs font-bold text-slate-800">{localBorrador.correo || ficha.cliente?.correo || ""}</span>
              ) : (
                <input 
                  className="text-xs font-bold text-slate-800 bg-transparent border-none outline-none w-full"
                  value={localBorrador.correo || ficha.cliente?.correo || ""}
                  onChange={(e) => updateBorrador({ correo: e.target.value })}
                />
              )}
            </div>
          </div>
        </section>

        {/* 4. OTROS PARTICIPANTES */}
        <section>
          <h3 className="bg-[#001529] text-white text-[10px] font-black uppercase px-3 py-1 mb-3 tracking-widest">4. OTROS PARTICIPANTES EN LA VISITA</h3>
          <table className="w-full border-collapse border border-slate-300 text-slate-800">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-300 text-[9px] font-black uppercase text-slate-600 py-2 w-2/3 text-left px-4">Nombre</th>
                <th className="border border-slate-300 text-[9px] font-black uppercase text-slate-600 py-2 text-left px-4">Cargo</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2].map((i) => {
                const p = (localBorrador.participantes || ficha.datosTecnicos?.participantes || [{},{},{}])[i] || {};
                return (
                  <tr key={i} className="h-8">
                    <td className="border border-slate-300 px-4">
                      {isPrintMode ? (
                        <span className="text-xs font-bold uppercase">{p.nombre || ""}</span>
                      ) : (
                        <input 
                          className="text-xs font-bold uppercase bg-transparent border-none outline-none w-full"
                          value={p.nombre || ""}
                          onChange={(e) => {
                            const newParticipants = [...(localBorrador.participantes || ficha.datosTecnicos?.participantes || [{},{},{}])];
                            newParticipants[i] = { ...newParticipants[i], nombre: e.target.value };
                            updateBorrador({ participantes: newParticipants });
                          }}
                        />
                      )}
                    </td>
                    <td className="border border-slate-300 px-4">
                      {isPrintMode ? (
                        <span className="text-xs font-bold uppercase">{p.cargo || ""}</span>
                      ) : (
                        <input 
                          className="text-xs font-bold uppercase bg-transparent border-none outline-none w-full"
                          value={p.cargo || ""}
                          onChange={(e) => {
                            const newParticipants = [...(localBorrador.participantes || ficha.datosTecnicos?.participantes || [{},{},{}])];
                            newParticipants[i] = { ...newParticipants[i], cargo: e.target.value };
                            updateBorrador({ participantes: newParticipants });
                          }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* 5. INFORMACIÓN DEL SISTEMA ELÉCTRICO */}
        <section>
          <h3 className="bg-[#001529] text-white text-[10px] font-black uppercase px-3 py-1 mb-3 tracking-widest">5. INFORMACIÓN DEL SISTEMA ELÉCTRICO</h3>
          <div className="space-y-4 px-2">
            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">¿Cuenta con subestación eléctrica?</span>
                <div className="flex gap-4">
                  {[true, false].map((val) => {
                    const tiene = localBorrador.tieneSubestacion !== undefined ? localBorrador.tieneSubestacion : ficha.datosTecnicos?.sistemaElectrico?.tieneSubestacion;
                    return (
                      <div key={val.toString()} className="flex items-center gap-1 cursor-pointer" onClick={() => !isPrintMode && updateBorrador({ tieneSubestacion: val })}>
                        <div className={cn(
                          "w-4 h-4 border border-slate-400 rounded-sm flex items-center justify-center",
                          tiene === val && "bg-[#001529] border-[#001529]"
                        )}>
                          {tiene === val && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{val ? "Sí" : "No"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Potencia del transformador:</span>
                {isPrintMode ? (
                  <span className="text-xs font-bold text-slate-800 uppercase min-w-[40px] text-center">
                    {localBorrador.potenciaKva || ficha.datosTecnicos?.sistemaElectrico?.potenciaKva || "____"}
                  </span>
                ) : (
                  <input 
                    className="text-xs font-bold text-slate-800 uppercase bg-transparent border-none outline-none w-16"
                    placeholder="__________"
                    value={localBorrador.potenciaKva || ficha.datosTecnicos?.sistemaElectrico?.potenciaKva || ""}
                    onChange={(e) => updateBorrador({ potenciaKva: e.target.value })}
                  />
                )}
                <span className="text-xs font-bold text-slate-800 uppercase">kVA</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Cantidad de transformadores:</span>
                {isPrintMode ? (
                  <span className="text-xs font-bold text-slate-800 uppercase">
                    {localBorrador.cantidadTransformadores || ficha.datosTecnicos?.sistemaElectrico?.cantidadTransformadores || "__________"}
                  </span>
                ) : (
                  <input 
                    className="text-xs font-bold text-slate-800 uppercase bg-transparent border-none outline-none w-full"
                    placeholder="__________"
                    value={localBorrador.cantidadTransformadores || ficha.datosTecnicos?.sistemaElectrico?.cantidadTransformadores || ""}
                    onChange={(e) => updateBorrador({ cantidadTransformadores: e.target.value })}
                  />
                )}
              </div>
              <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Último mantenimiento realizado:</span>
                {isPrintMode ? (
                  <span className="text-xs font-bold text-slate-800 uppercase">
                    {localBorrador.ultimoMantenimiento || (ficha.datosTecnicos?.sistemaElectrico?.ultimoMantenimiento ? format(new Date(ficha.datosTecnicos.sistemaElectrico.ultimoMantenimiento), "dd / MM / yyyy") : "___ / ___ / ______")}
                  </span>
                ) : (
                  <input 
                    className="text-xs font-bold text-slate-800 uppercase bg-transparent border-none outline-none w-full"
                    placeholder="DD / MM / YYYY"
                    value={localBorrador.ultimoMantenimiento || (ficha.datosTecnicos?.sistemaElectrico?.ultimoMantenimiento ? format(new Date(ficha.datosTecnicos.sistemaElectrico.ultimoMantenimiento), "dd / MM / yyyy") : "")}
                    onChange={(e) => updateBorrador({ ultimoMantenimiento: e.target.value })}
                  />
                )}
              </div>
            </div>
            <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
              <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Empresa que realizó el mantenimiento:</span>
              {isPrintMode ? (
                <span className="text-xs font-bold text-slate-800 uppercase truncate">
                  {localBorrador.empresaMantenimiento || ficha.datosTecnicos?.sistemaElectrico?.empresaMantenimiento || "_________________________________________"}
                </span>
              ) : (
                <input 
                  className="text-xs font-bold text-slate-800 uppercase bg-transparent border-none outline-none w-full"
                  placeholder="_________________________________________"
                  value={localBorrador.empresaMantenimiento || ficha.datosTecnicos?.sistemaElectrico?.empresaMantenimiento || ""}
                  onChange={(e) => updateBorrador({ empresaMantenimiento: e.target.value })}
                />
              )}
            </div>
          </div>
        </section>

        {/* 6. MOTIVO DE LA VISITA */}
        <section>
          <h3 className="bg-[#001529] text-white text-[10px] font-black uppercase px-3 py-1 mb-3 tracking-widest">6. MOTIVO DE LA VISITA</h3>
          <div className="grid grid-cols-3 gap-y-3 px-2">
            {['Inspección técnica', 'Diagnóstico', 'Termografía', 'Calidad de energía', 'Reunión técnica'].map(m => {
              const motivos = localBorrador.motivos || ficha.datosTecnicos?.motivos || [];
              const isSelected = motivos.includes(m);
              return (
                <div key={m} className="flex items-center gap-2 cursor-pointer" onClick={() => !isPrintMode && (
                  isSelected ? updateBorrador({ motivos: motivos.filter((item: string) => item !== m) }) : updateBorrador({ motivos: [...motivos, m] })
                )}>
                  <div className={cn(
                    "w-4 h-4 border border-slate-400 rounded-sm flex items-center justify-center",
                    isSelected && "bg-[#001529] border-[#001529]"
                  )}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">{m}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2">
              <div className={cn(
                  "w-4 h-4 border border-slate-400 rounded-sm flex items-center justify-center",
                  (localBorrador.motivoOtro || ficha.datosTecnicos?.motivoOtro) && "bg-[#001529] border-[#001529]"
                )}>
                  {(localBorrador.motivoOtro || ficha.datosTecnicos?.motivoOtro) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
              <span className="text-[10px] font-bold text-slate-600 uppercase shrink-0">Otro:</span>
              {isPrintMode ? (
                <span className="text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200 min-w-[100px] px-1">
                  {localBorrador.motivoOtro || ficha.datosTecnicos?.motivoOtro || ""}
                </span>
              ) : (
                <input 
                  className="text-[10px] font-bold text-slate-600 uppercase bg-transparent border-none outline-none border-b border-slate-200 w-full"
                  placeholder="__________________"
                  value={localBorrador.motivoOtro || ficha.datosTecnicos?.motivoOtro || ""}
                  onChange={(e) => updateBorrador({ motivoOtro: e.target.value })}
                />
              )}
            </div>
          </div>
        </section>

        {/* 7. COMENTARIOS DEL CLIENTE */}
        <section>
          <h3 className="bg-[#001529] text-white text-[10px] font-black uppercase px-3 py-1 mb-3 tracking-widest">7. COMENTARIOS DEL CLIENTE</h3>
          <div className="border border-slate-300 rounded-md p-4 min-h-[100px]">
            {isPrintMode ? (
              <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                {localBorrador.comentariosCliente || ficha.datosTecnicos?.comentariosCliente || ""}
              </p>
            ) : (
              <textarea 
                className="text-xs font-bold text-slate-700 leading-relaxed bg-transparent border-none outline-none w-full h-full min-h-[80px] resize-none"
                value={localBorrador.comentariosCliente || ficha.datosTecnicos?.comentariosCliente || ""}
                onChange={(e) => updateBorrador({ comentariosCliente: e.target.value })}
              />
            )}
          </div>
        </section>

        {/* 8. COMENTARIOS EXTRAS DEL CLIENTE */}
        <section>
          <h3 className="bg-[#001529] text-white text-[10px] font-black uppercase px-3 py-1 mb-3 tracking-widest">8. COMENTARIOS EXTRAS DEL CLIENTE</h3>
          <div className="border border-slate-300 rounded-md p-4 min-h-[120px]">
            {isPrintMode ? (
              <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                {localBorrador.comentariosExtras || ficha.datosTecnicos?.comentariosExtras || ""}
              </p>
            ) : (
              <textarea 
                className="text-xs font-bold text-slate-700 leading-relaxed bg-transparent border-none outline-none w-full h-full min-h-[100px] resize-none"
                value={localBorrador.comentariosExtras || ficha.datosTecnicos?.comentariosExtras || ""}
                onChange={(e) => updateBorrador({ comentariosExtras: e.target.value })}
              />
            )}
          </div>
        </section>

        {/* 9. RESPONSABLE HH */}
        <section className="pt-8">
          <h3 className="bg-[#001529] text-white text-[10px] font-black uppercase px-3 py-1 mb-12 tracking-widest">9. RESPONSABLE HH</h3>
          <div className="grid grid-cols-2 gap-x-12 px-2">
            <div className="space-y-4">
              <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Nombre:</span>
                <span className="text-xs font-bold text-slate-800 uppercase">{ficha.tecnico?.nombre}</span>
              </div>
              <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Cargo:</span>
                <span className="text-xs font-bold text-slate-800 uppercase">{ficha.tecnico?.cargo || "INGENIERO DE CAMPO"}</span>
              </div>
            </div>
            <div className="space-y-8">
              <div className="flex items-end gap-2 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-black text-slate-600 uppercase shrink-0">Fecha:</span>
                <span className="text-xs font-bold text-slate-800 uppercase">{format(new Date(ficha.fechaVisita), "dd / MM / yyyy")}</span>
              </div>
              <div className="border-t border-slate-400 mt-12 text-center pt-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Firma del Responsable</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Pie de Página */}
      <div className="mt-12 pt-4 border-t border-slate-200 text-center">
         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">HH T SOLUCIONA SAC | RUC: 20605928374 | www.httsolutions.com.pe</p>
      </div>
    </div>
  );
}
