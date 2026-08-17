'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  AlertTriangle, 
  DollarSign, 
  Target, 
  Zap, 
  TrendingUp,
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Client } from '@/types/crm';
import { 
  ALL_ADVISORS, 
  getClientUnit, 
  UnidadComercialType,
  UNIT_1_CUTOFF_DATE
} from '@/lib/types/commercial-units';
import { api } from '@/lib/api';

interface UnidadesGerencialesProps {
  clients: Client[];
  dateRange?: { startDate: Date | null, endDate: Date | null };
}

// Normalización estricta de primer nombre canónico
const normalizeAdvisorKey = (rawName: string): string => {
  if (!rawName) return '';
  const clean = rawName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (clean.includes('angi') || clean.includes('angie')) return 'Angi';
  if (clean.includes('mellani') || clean.includes('melani')) return 'Mellani';
  if (clean.includes('valentina')) return 'Valentina';
  if (clean.includes('ariana')) return 'Ariana';
  if (clean.includes('brenda')) return 'Brenda';
  if (clean.includes('javier')) return 'Javier';
  if (clean.includes('steven')) return 'Steven';
  if (clean.includes('guillermo')) return 'Guillermo';
  if (clean.includes('diego')) return 'Diego';
  if (clean.includes('mario') || clean.includes('infante')) return 'Mario';

  // Si es un nombre compuesto, tomar únicamente la primera palabra (Primer Nombre)
  const firstName = rawName.trim().split(' ')[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

export function UnidadesGerenciales({ clients, dateRange }: UnidadesGerencialesProps) {
  const [selectedUnit, setSelectedUnit] = useState<UnidadComercialType>('TODAS');
  const [tareas, setTareas] = useState<any[]>([]);
  const [selectedAdvTasks, setSelectedAdvTasks] = useState<string | null>(null);
  const [selectedAdvStatus, setSelectedAdvStatus] = useState<string | null>(null);
  const [showInactives, setShowInactives] = useState(false);
  const [trabajadoresBD, setTrabajadoresBD] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchTareasYTrabajadores = async () => {
      try {
        const [resCrm, resTrabajadores, resConfigTrabajadores] = await Promise.all([
          api.get('/crm/agenda').catch(() => []),
          api.get('/crm/agenda?tipo=trabajadores').catch(() => []),
          api.get('/config/trabajadores').catch(() => [])
        ]);
        const listCrm = Array.isArray(resCrm) ? resCrm : [];
        const listTrabajadores = Array.isArray(resTrabajadores) ? resTrabajadores : [];
        setTareas([...listCrm, ...listTrabajadores]);

        if (Array.isArray(resConfigTrabajadores)) {
          setTrabajadoresBD(resConfigTrabajadores);
        }
      } catch (err) {
        console.warn('Error fetching tareas y trabajadores:', err);
      }
    };
    fetchTareasYTrabajadores();
  }, []);

  // Clasificación y métricas automáticas por Unidad
  const metrics = useMemo(() => {
    const now = new Date();

    const clientsUnit1 = clients.filter(c => getClientUnit(c.fechaCreacion, c.asignadoA) === 'UNIDAD_1');
    const clientsUnit2 = clients.filter(c => getClientUnit(c.fechaCreacion, c.asignadoA) === 'UNIDAD_2');

    const getStats = (list: Client[]) => {
      const prospectos = list.filter(c => c.etapaComercial === 'Prospecto').length;
      const fidelizados = list.filter(c => ['Orden de Servicio', 'Servicio Ejecutado', 'Facturación', 'Postventa', 'Ganado / Fidelizado'].includes(c.etapaComercial)).length;
      const perdidos = list.filter(c => c.etapaComercial === 'Perdido').length;
      const cotPendientes = list.filter(c => c.etapaComercial === 'Cotización').length;
      const enSeguimiento = list.filter(c => c.etapaComercial === 'Seguimiento' || c.etapaComercial === 'Negociación' || c.etapaComercial === 'Contacto Inicial' || c.etapaComercial === 'Visita Técnica' || c.etapaComercial === 'Visita Comercial').length;
      const conOrdenes = list.filter(c => c.etapaComercial === 'Orden de Servicio').length;
      
      const sinMovimiento = list.filter(c => {
        if (!c.ultimoContacto) return true;
        const diff = (now.getTime() - new Date(c.ultimoContacto).getTime()) / (1000 * 3600 * 24);
        return diff >= 7 && c.etapaComercial !== 'Ganado / Fidelizado' && c.etapaComercial !== 'Perdido';
      }).length;

      const montoGanado = list
        .filter(c => ['Orden de Servicio', 'Servicio Ejecutado', 'Facturación', 'Postventa', 'Ganado / Fidelizado'].includes(c.etapaComercial))
        .reduce((acc, curr) => acc + (Number(curr.montoEstimado) || Number(curr.ventaProyectada) || 0), 0);

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

  // Map de estados de trabajadores desde la BD
  const workerStatusMap = useMemo(() => {
    const map = new Map<string, boolean>();
    trabajadoresBD.forEach(w => {
      if (w.nombre) {
        const cleanName = normalizeAdvisorKey(w.nombre);
        map.set(cleanName, w.activo !== false);
      }
    });
    return map;
  }, [trabajadoresBD]);

  // Construcción dinámica de colaboradores unificando BD + Cartera/Tareas sin duplicados y filtrando activos
  const allDynamicAdvisors = useMemo(() => {
    const map = new Map<string, { name: string; unit: 'UNIDAD_1' | 'UNIDAD_2'; role: string; color: string; activo: boolean }>();

    const addAdvisor = (rawName: string, defaultRole?: string, defaultUnit?: 'UNIDAD_1' | 'UNIDAD_2', isFromBD?: boolean, bdActive?: boolean) => {
      if (!rawName || !rawName.trim()) return;
      const canonicalName = normalizeAdvisorKey(rawName);
      
      const isActive = isFromBD ? (bdActive !== false) : (workerStatusMap.has(canonicalName) ? workerStatusMap.get(canonicalName)! : true);

      if (!map.has(canonicalName)) {
        const isU1 = ['Ariana', 'Brenda', 'Valentina'].includes(canonicalName);
        const knownInfo = ALL_ADVISORS[canonicalName];
        map.set(canonicalName, {
          name: canonicalName,
          unit: defaultUnit || (knownInfo ? knownInfo.unit : (isU1 ? 'UNIDAD_1' : 'UNIDAD_2')),
          role: knownInfo ? knownInfo.role : (defaultRole || 'Colaborador'),
          color: knownInfo ? knownInfo.color : (isU1 ? 'bg-emerald-600' : 'bg-blue-600'),
          activo: isActive
        });
      }
    };

    // 1. Predefinidos
    Object.keys(ALL_ADVISORS).forEach(name => addAdvisor(name));

    // 2. BD Trabajadores
    trabajadoresBD.forEach(w => {
      if (w.nombre) {
        addAdvisor(w.nombre, w.cargo || w.area, undefined, true, w.activo);
      }
    });

    // 3. Asignados en Clientes
    clients.forEach(c => {
      [c.asignadoA, c.creadoPor].forEach(n => {
        if (n) addAdvisor(n, 'Ejecutivo / Asesor');
      });
    });

    // 4. Responsables de Tareas
    tareas.forEach(t => {
      const respList = [t.responsable, ...(t.subtareas || []).map((s: any) => s.responsable)];
      respList.forEach(n => {
        if (n) addAdvisor(n, 'Gestor / Operativo');
      });
    });

    const allList = Array.from(map.values());
    if (showInactives) return allList;
    return allList.filter(adv => adv.activo);
  }, [trabajadoresBD, clients, tareas, workerStatusMap, showInactives]);

  // Métricas por colaborador
  const advisorStats = useMemo(() => {
    const list = allDynamicAdvisors.map((advInfo) => {
      const advName = advInfo.name;
      
      const matchName = (name: string | undefined, target: string) => {
        if (!name) return false;
        return normalizeAdvisorKey(name) === normalizeAdvisorKey(target);
      };

      const advClients = clients.filter(c => {
        const isAssigned = matchName(c.asignadoA, advName) || (!c.asignadoA && matchName(c.creadoPor, advName));
        if (!isAssigned) return false;

        const d = new Date(c.fechaCreacion);
        const isNewClient = !isNaN(d.getTime()) && d >= UNIT_1_CUTOFF_DATE;

        const isWonOrActive = ['Orden de Servicio', 'Servicio Ejecutado', 'Facturación', 'Postventa', 'Ganado / Fidelizado', 'Cotización'].includes(c.etapaComercial);

        if (advInfo.unit === 'UNIDAD_1') return isNewClient || isWonOrActive;
        if (advInfo.unit === 'UNIDAD_2') return !isNewClient && !isWonOrActive;
        return true;
      });

      const prospectos = advClients.filter(c => c.etapaComercial === 'Prospecto').length;
      const cotizaciones = advClients.filter(c => c.etapaComercial === 'Cotización').length;
      const ganados = advClients.filter(c => ['Orden de Servicio', 'Servicio Ejecutado', 'Facturación', 'Postventa', 'Ganado / Fidelizado'].includes(c.etapaComercial)).length;
      const montoTotal = advClients
        .filter(c => ['Orden de Servicio', 'Servicio Ejecutado', 'Facturación', 'Postventa', 'Ganado / Fidelizado'].includes(c.etapaComercial))
        .reduce((acc, curr) => acc + (Number(curr.montoEstimado) || Number(curr.ventaProyectada) || 0), 0);

      const metaMensual = advInfo.unit === 'UNIDAD_1' ? 15000 : 25000;
      const cumplimiento = metaMensual > 0 ? Math.min(100, Number(((montoTotal / metaMensual) * 100).toFixed(1))) : 0;

      const actividades = tareas.flatMap((t: any) => {
         const subs = Array.isArray(t.subtareas) ? t.subtareas : [];
         const asignadas = subs.filter((s: any) => matchName(s.responsable || t.responsable, advName));
         
         if (asignadas.length > 0) return asignadas;
         
         if (matchName(t.responsable, advName) && subs.length === 0) {
            return [{ id: t.id, completada: t.estado === 'FINALIZADA', fecha: t.fechaCompromiso }];
         }
         return [];
      });

      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      
      let tareasPendientes = 0;
      let tareasRetrasadas = 0;
      let tareasFinalizadas = 0;
      const tareasEnProceso = 0;

      actividades.forEach((act: any) => {
         let actDate = hoy;
         if (act.fecha || act.fechaCompromiso) {
            const f = act.fecha || act.fechaCompromiso;
            const parts = f.split('/');
            if (parts.length === 3) actDate = new Date(Number(parts[2]), Number(parts[1])-1, Number(parts[0]));
            else actDate = new Date(f);
         }

         if (dateRange && dateRange.startDate && dateRange.endDate) {
            const taskTime = actDate.getTime();
            if (taskTime < dateRange.startDate.getTime() || taskTime > dateRange.endDate.getTime()) {
               return;
            }
         }

         if (act.completada || act.estado === 'FINALIZADA') {
            tareasFinalizadas++;
         } else {
            if (actDate.getTime() < hoy.getTime()) {
               tareasRetrasadas++;
            } else {
               tareasPendientes++;
            }
         }
      });

      return {
        name: advName,
        unit: advInfo.unit,
        role: advInfo.role,
        color: advInfo.color,
        activo: advInfo.activo,
        carteraCount: advClients.length,
        prospectos,
        cotizaciones,
        ganados,
        montoTotal,
        metaMensual,
        cumplimiento,
        tareasPendientes,
        tareasEnProceso,
        tareasFinalizadas,
        tareasRetrasadas
      };
    });

    if (selectedUnit === 'UNIDAD_1') return list.filter(a => a.unit === 'UNIDAD_1');
    if (selectedUnit === 'UNIDAD_2') return list.filter(a => a.unit === 'UNIDAD_2');
    return list;
  }, [allDynamicAdvisors, clients, selectedUnit, tareas, dateRange]);

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
              className={`px-5 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                selectedUnit === 'TODAS'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Visión Consolidada
            </button>
            <button
              onClick={() => setSelectedUnit('UNIDAD_1')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                selectedUnit === 'UNIDAD_1'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Unidad 1 (Nuevos)
            </button>
            <button
              onClick={() => setSelectedUnit('UNIDAD_2')}
              className={`px-5 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                selectedUnit === 'UNIDAD_2'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Unidad 2 (Estratégicos)
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
              S/ {(selectedUnit === 'UNIDAD_1' ? metrics.u1.montoGanado : selectedUnit === 'UNIDAD_2' ? metrics.u2.montoGanado : metrics.global.montoGanado).toLocaleString('es-PE', { minimumFractionDigits: 0 })}
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
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Rendimiento Individual de Integrantes por Unidad
          </h3>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-slate-500 hover:text-slate-800 uppercase select-none">
              <input 
                type="checkbox" 
                checked={showInactives} 
                onChange={(e) => setShowInactives(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              Mostrar Inactivos / Históricos
            </label>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Cálculo Automático</span>
          </div>
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
                <th className="p-3.5 text-center">Gestión de Tareas</th>
                <th className="p-3.5 text-right">Ventas (S/)</th>
                <th className="p-3.5 text-center rounded-r-xl">% Cumplimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {advisorStats.map((adv) => (
                <tr key={adv.name} className={`hover:bg-slate-50/60 transition-colors ${!adv.activo ? 'opacity-60 bg-slate-50/40' : ''}`}>
                  <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${adv.color}`}></span>
                    {adv.name}
                    {!adv.activo && (
                      <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded ml-1">Inactivo</span>
                    )}
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
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-600 cursor-pointer hover:opacity-80" title="Pendientes" onClick={(e) => { e.stopPropagation(); setSelectedAdvTasks(adv.name); setSelectedAdvStatus('PENDIENTE'); }}>
                        <Clock className="w-3 h-3 text-slate-400" /> {adv.tareasPendientes}
                      </div>
                      <div className="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded text-[9px] font-bold text-blue-600 cursor-pointer hover:opacity-80" title="En Proceso" onClick={(e) => { e.stopPropagation(); setSelectedAdvTasks(adv.name); setSelectedAdvStatus('EN_PROCESO'); }}>
                        <PlayCircle className="w-3 h-3 text-blue-400" /> {adv.tareasEnProceso}
                      </div>
                      <div className="flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-600 cursor-pointer hover:opacity-80" title="Finalizadas" onClick={(e) => { e.stopPropagation(); setSelectedAdvTasks(adv.name); setSelectedAdvStatus('FINALIZADA'); }}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {adv.tareasFinalizadas}
                      </div>
                      <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded text-[9px] font-bold text-rose-600 cursor-pointer hover:opacity-80" title="Retrasadas" onClick={(e) => { e.stopPropagation(); setSelectedAdvTasks(adv.name); setSelectedAdvStatus('RETRASADA'); }}>
                        <AlertCircle className="w-3 h-3 text-rose-500" /> {adv.tareasRetrasadas}
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-right font-black text-slate-800">
                    S/ {adv.montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                  </td>
                  <td className="p-3.5 text-center">
                    {adv.unit === 'UNIDAD_2' ? (
                      <span className="font-bold text-slate-400">-</span>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full rounded-full ${adv.cumplimiento >= 80 ? 'bg-emerald-500' : adv.cumplimiento >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                            style={{ width: `${adv.cumplimiento}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-700">{adv.cumplimiento}%</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    
      {/* Modal de Tareas */}
      {selectedAdvTasks && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setSelectedAdvTasks(null); setSelectedAdvStatus(null); }}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                {selectedAdvStatus ? (selectedAdvStatus === "FINALIZADA" ? "Completadas" : selectedAdvStatus === "RETRASADA" ? "Retrasadas" : "Pendientes") : "Actividades"} de {selectedAdvTasks}
              </h3>
              <button onClick={() => { setSelectedAdvTasks(null); setSelectedAdvStatus(null); }} className="text-slate-400 hover:bg-slate-200 p-1.5 rounded-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-50/50">
              {tareas
                .filter(t => (t.responsable || '').toLowerCase() === selectedAdvTasks.toLowerCase() || (t.subtareas || []).some((s: any) => (s.responsable || '').toLowerCase() === selectedAdvTasks.toLowerCase()))
                .flatMap(t => {
                   const subs = (t.subtareas || []).filter((s: any) => (s.responsable || t.responsable || '').toLowerCase() === selectedAdvTasks.toLowerCase());
                   return subs.length > 0 ? subs.map((s: any) => ({...s, empresa: t.empresa})) : [t];
                })
                
                .filter(act => {
                   if (!selectedAdvStatus) return true;
                   
                   const hoy = new Date();
                   hoy.setHours(0,0,0,0);
                   let actDate = hoy;
                   if (act.fecha || act.fechaCompromiso) {
                      const f = act.fecha || act.fechaCompromiso;
                      const parts = f.split('/');
                      if (parts.length === 3) actDate = new Date(Number(parts[2]), Number(parts[1])-1, Number(parts[0]));
                      else actDate = new Date(f);
                   }
                   
                   const isFin = act.completada || act.estado === 'FINALIZADA';
                   
                   if (selectedAdvStatus === 'FINALIZADA') return isFin;
                   if (selectedAdvStatus === 'PENDIENTE') return !isFin && (actDate.getTime() >= hoy.getTime());
                   if (selectedAdvStatus === 'RETRASADA') return !isFin && (actDate.getTime() < hoy.getTime());
                   if (selectedAdvStatus === 'EN_PROCESO') return false; // Por ahora no manejamos en proceso en subtasks
                   
                   return true;
                })
                .map((act, idx) => (
                <div key={act.id || idx} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-700 text-sm">{act.empresa}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{act.fecha || act.fechaCompromiso}</span>
                  </div>
                  <p className="text-slate-600 text-xs">{act.texto || act.actividadInmediata || 'Actividad sin descripción'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[10px] font-bold uppercase ${act.estado === 'FINALIZADA' || act.completada ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {act.estado === 'FINALIZADA' || act.completada ? 'FINALIZADA' : 'PENDIENTE'}
                    </span>
                  </div>
                </div>
              ))}
              {tareas.filter(t => (t.responsable || '').toLowerCase() === selectedAdvTasks.toLowerCase() || (t.subtareas || []).some((s: any) => (s.responsable || '').toLowerCase() === selectedAdvTasks.toLowerCase())).length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm font-medium">No hay tareas asignadas a este asesor.</div>
              )}
            </div>
          </div>
        </div>
      )}
</div>
  );
}
