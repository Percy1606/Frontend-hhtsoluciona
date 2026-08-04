'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  AlertTriangle, 
  DollarSign, 
  Target, 
  Zap, 
  TrendingUp
} from 'lucide-react';
import { Client } from '@/types/crm';
import { 
  ALL_ADVISORS, 
  getClientUnit, 
  UnidadComercialType 
} from '@/lib/types/commercial-units';

interface UnidadesGerencialesProps {
  clients: Client[];
}

export function UnidadesGerenciales({ clients }: UnidadesGerencialesProps) {
  const [selectedUnit, setSelectedUnit] = useState<UnidadComercialType>('TODAS');

  // Clasificación y métricas automáticas por Unidad
  const metrics = useMemo(() => {
    const now = new Date();

    const clientsUnit1 = clients.filter(c => getClientUnit(c.fechaCreacion, c.asignadoA) === 'UNIDAD_1');
    const clientsUnit2 = clients.filter(c => getClientUnit(c.fechaCreacion, c.asignadoA) === 'UNIDAD_2');

    const getStats = (list: Client[]) => {
      const prospectos = list.filter(c => c.etapaComercial === 'Prospecto').length;
      const fidelizados = list.filter(c => c.etapaComercial === 'Ganado' || c.etapaComercial === 'Orden de Servicio').length;
      const perdidos = list.filter(c => c.etapaComercial === 'Perdido').length;
      const cotPendientes = list.filter(c => c.etapaComercial === 'Cotización Enviada').length;
      const enSeguimiento = list.filter(c => c.etapaComercial === 'Seguimiento' || c.etapaComercial === 'Negociación' || c.etapaComercial === 'Contactado' || c.etapaComercial === 'Inspección Realizada').length;
      const conOrdenes = list.filter(c => c.etapaComercial === 'Orden de Servicio').length;
      
      const sinMovimiento = list.filter(c => {
        if (!c.ultimoContacto) return true;
        const diff = (now.getTime() - new Date(c.ultimoContacto).getTime()) / (1000 * 3600 * 24);
        return diff >= 7 && c.etapaComercial !== 'Ganado' && c.etapaComercial !== 'Perdido';
      }).length;

      const montoGanado = list
        .filter(c => c.etapaComercial === 'Ganado' || c.etapaComercial === 'Orden de Servicio')
        .reduce((acc, curr) => acc + (Number(curr.montoEstimado) || 0), 0);

      const totalProspeccion = prospectos + enSeguimiento + cotPendientes + fidelizados + perdidos;
      const conversionProspectoACliente = totalProspeccion > 0 ? ((fidelizados / totalProspeccion) * 100).toFixed(1) : '0.0';
      const conversionCotizacionAOrden = (cotPendientes + fidelizados) > 0 ? ((fidelizados / (cotPendientes + fidelizados)) * 100).toFixed(1) : '0.0';

      return {
        total: list.length,
        prospectos,
        fidelizados,
        perdidos,
        cotPendientes,
        enSeguimiento,
        conOrdenes,
        sinMovimiento,
        montoGanado,
        conversionProspectoACliente,
        conversionCotizacionAOrden
      };
    };

    return {
      u1: getStats(clientsUnit1),
      u2: getStats(clientsUnit2),
      global: getStats(clients)
    };
  }, [clients]);

  // Métricas por colaborador
  const advisorStats = useMemo(() => {
    const list = Object.keys(ALL_ADVISORS).map((advName) => {
      const advInfo = ALL_ADVISORS[advName];
      const advClients = clients.filter(c => c.asignadoA === advName || c.creadoPor === advName);

      const prospectos = advClients.filter(c => c.etapaComercial === 'Prospecto').length;
      const cotizaciones = advClients.filter(c => c.etapaComercial === 'Cotización Enviada').length;
      const ganados = advClients.filter(c => c.etapaComercial === 'Ganado' || c.etapaComercial === 'Orden de Servicio').length;
      const montoTotal = advClients
        .filter(c => c.etapaComercial === 'Ganado' || c.etapaComercial === 'Orden de Servicio')
        .reduce((acc, curr) => acc + (Number(curr.montoEstimado) || 0), 0);

      const metaMensual = advInfo.unit === 'UNIDAD_1' ? 15000 : 25000;
      const cumplimiento = metaMensual > 0 ? Math.min(100, Number(((montoTotal / metaMensual) * 100).toFixed(1))) : 0;

      return {
        name: advName,
        unit: advInfo.unit,
        role: advInfo.role,
        color: advInfo.color,
        carteraCount: advClients.length,
        prospectos,
        cotizaciones,
        ganados,
        montoTotal,
        metaMensual,
        cumplimiento
      };
    });

    if (selectedUnit === 'UNIDAD_1') return list.filter(a => a.unit === 'UNIDAD_1');
    if (selectedUnit === 'UNIDAD_2') return list.filter(a => a.unit === 'UNIDAD_2');
    return list;
  }, [clients, selectedUnit]);

  return (
    <div className="space-y-6 font-sans">
      {/* Barra de Control Gerencial con Blanco y Borde Elegante */}
      <div className="bg-white border border-slate-200/90 rounded-[2rem] p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/80">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                Centro de Control Comercial Gerencial
                <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider">
                  En Tiempo Real
                </span>
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Monitoreo por Unidades Comerciales e Indicadores de Conversión
              </p>
            </div>
          </div>

          {/* Switcher de Unidades */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setSelectedUnit('TODAS')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                selectedUnit === 'TODAS'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🌐 Visión Consolidada
            </button>
            <button
              onClick={() => setSelectedUnit('UNIDAD_1')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                selectedUnit === 'UNIDAD_1'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🚀 Unidad 1 (Nuevos)
            </button>
            <button
              onClick={() => setSelectedUnit('UNIDAD_2')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                selectedUnit === 'UNIDAD_2'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🔄 Unidad 2 (Estratégicos)
            </button>
          </div>
        </div>

        {/* Resumen Gerencial Rápido de 4 Tarjetas Blancas Elegantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card Unidad 1 */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-white/60 backdrop-blur-md border border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-emerald-700 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100/50 px-3 py-1.5 rounded-full">Nuevos Negocios</span>
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-slate-800">{metrics.u1.total} <span className="text-xs font-bold text-slate-500">clientes</span></div>
            <div className="text-xs text-slate-600 mt-3 space-y-1.5 pt-2 border-t border-emerald-100/80">
              <div className="flex justify-between font-medium"><span>Prospectos Nuevos:</span> <strong className="text-emerald-700 font-bold">{metrics.u1.prospectos}</strong></div>
              <div className="flex justify-between font-medium"><span>Cotizaciones Pendientes:</span> <strong className="text-slate-800 font-bold">{metrics.u1.cotPendientes}</strong></div>
              <div className="flex justify-between font-medium"><span>Conversión Prospecto-Cliente:</span> <strong className="text-emerald-700 font-bold">{metrics.u1.conversionProspectoACliente}%</strong></div>
            </div>
          </div>

          {/* Card Unidad 2 */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-white/60 backdrop-blur-md border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-blue-700 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100/50 px-3 py-1.5 rounded-full">Estratégicos</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-slate-800">{metrics.u2.total} <span className="text-xs font-bold text-slate-500">cuentas</span></div>
            <div className="text-xs text-slate-600 mt-3 space-y-1.5 pt-2 border-t border-blue-100/80">
              <div className="flex justify-between font-medium"><span>Cartera Fidelizada/Ganada:</span> <strong className="text-blue-700 font-bold">{metrics.u2.fidelizados}</strong></div>
              <div className="flex justify-between font-medium"><span>Cotizaciones Pendientes:</span> <strong className="text-slate-800 font-bold">{metrics.u2.cotPendientes}</strong></div>
              <div className="flex justify-between font-medium"><span>Conversión Cotización-Orden:</span> <strong className="text-blue-700 font-bold">{metrics.u2.conversionCotizacionAOrden}%</strong></div>
            </div>
          </div>

          {/* Card Alerta Clientes Sin Movimiento */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-50 to-white/60 backdrop-blur-md border border-rose-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-rose-700 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest bg-rose-100/50 px-3 py-1.5 rounded-full">Sin Movimiento (&gt;7d)</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-3xl font-black text-rose-700">
              {selectedUnit === 'UNIDAD_1' ? metrics.u1.sinMovimiento : selectedUnit === 'UNIDAD_2' ? metrics.u2.sinMovimiento : metrics.global.sinMovimiento}
              <span className="text-xs font-bold text-slate-500 ml-1">inactivos</span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-3 pt-2 border-t border-rose-100/80">
              Cuentas que requieren atención o reasignación inmediata.
            </p>
          </div>

          {/* Card Ventas Ganadas Consolidadas */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-white/60 backdrop-blur-md border border-amber-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-amber-700 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100/50 px-3 py-1.5 rounded-full">Ventas & Cierres</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-800">
              S/ {(selectedUnit === 'UNIDAD_1' ? metrics.u1.montoGanado : selectedUnit === 'UNIDAD_2' ? metrics.u2.montoGanado : metrics.global.montoGanado).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-600 font-medium mt-3 pt-2 border-t border-amber-100/80 flex justify-between">
              <span>Órdenes de Servicio:</span>
              <strong className="text-amber-700 font-bold">
                {selectedUnit === 'UNIDAD_1' ? metrics.u1.conOrdenes : selectedUnit === 'UNIDAD_2' ? metrics.u2.conOrdenes : metrics.global.conOrdenes} activas
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Rendimiento por Colaborador con Fondo Blanco */}
      <div className="bg-white border border-slate-200/90 rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Rendimiento Individual de Integrantes por Unidad
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cálculo Automático por Sistema</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80 uppercase text-[10px] font-black tracking-wider">
                <th className="p-3.5 rounded-l-xl">Colaborador</th>
                <th className="p-3.5">Unidad Asignada</th>
                <th className="p-3.5">Rol Específico</th>
                <th className="p-3.5 text-center">Cartera Atendida</th>
                <th className="p-3.5 text-center">Prospectos</th>
                <th className="p-3.5 text-center">Cotizaciones</th>
                <th className="p-3.5 text-center">Cierres / Ganados</th>
                <th className="p-3.5 text-right">Ventas (S/)</th>
                <th className="p-3.5 text-center rounded-r-xl">% Cumplimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {advisorStats.map((adv) => (
                <tr key={adv.name} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${adv.color}`}></span>
                    {adv.name}
                  </td>
                  <td className="p-3.5 font-bold">
                    {adv.unit === 'UNIDAD_1' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase">
                        Unidad 1
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] uppercase">
                        Unidad 2
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-medium text-slate-600">{adv.role}</td>
                  <td className="p-3.5 text-center font-black text-slate-800">{adv.carteraCount}</td>
                  <td className="p-3.5 text-center font-bold text-slate-600">{adv.prospectos}</td>
                  <td className="p-3.5 text-center font-bold text-slate-600">{adv.cotizaciones}</td>
                  <td className="p-3.5 text-center font-black text-emerald-600">{adv.ganados}</td>
                  <td className="p-3.5 text-right font-black text-slate-800">
                    S/ {adv.montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div 
                          className={`h-full rounded-full ${adv.cumplimiento >= 80 ? 'bg-emerald-500' : adv.cumplimiento >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                          style={{ width: `${adv.cumplimiento}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-slate-700">{adv.cumplimiento}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
