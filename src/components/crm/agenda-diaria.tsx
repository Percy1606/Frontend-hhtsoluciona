'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle, 
  PhoneCall, 
  Users, 
  FileText, 
  UserCheck, 
  Plus,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Search,
  Building2,
  ChevronRight,
  ListChecks,
  HeartHandshake,
  CheckSquare,
  Square,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Lock,
  ArrowUpDown
} from 'lucide-react';
import { Client } from '@/types/crm';
import { EstadoTareaEstricto } from '@/lib/types/commercial-units';
import { useCRMStore } from '@/store/crm-store';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AgendaDiariaProps {
  clients: Client[];
  currentAdvisor?: string;
  onAdvisorChange?: (advisor: string) => void;
  onOpenInteractionModal?: (client: Client) => void;
}

export interface Subtarea {
  id: string;
  fecha: string;
  texto: string;
  completada?: boolean;
}

export interface TareaEstrategica {
  id: string;
  clienteId?: string;
  empresa: string;
  etapaProceso: string;
  actividadInmediata: string;
  proximoPaso: string;
  responsable: string;
  fechaCompromiso: string;
  estado: EstadoTareaEstricto;
  subtareas: Subtarea[];
}

export function AgendaDiaria({ 
  clients, 
  currentAdvisor = 'Valentina', 
  onAdvisorChange,
  onOpenInteractionModal 
}: AgendaDiariaProps) {
  const { addInteraction } = useCRMStore();
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('TODOS');
  const [filterEstado, setFilterEstado] = useState<string>('TODAS');

  // FILTRO DE BUSQUEDA GLOBAL Y FECHAS (EXACTO CARTERA)
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterType, setDateFilterType] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-08-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-08-31');

  const [expandedTareaId, setExpandedTareaId] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // PAGINACIÓN Y LÍMITE DE REGISTROS PARA MAS DE 100 TAREAS
  const [taskPage, setTaskPage] = useState(1);
  const [taskLimit, setTaskLimit] = useState(10);

  const [obsVisibleLimit, setObsVisibleLimit] = useState(10);
  const [searchObsQuery, setSearchObsQuery] = useState('');

  // Mapa local para visibilidad instantánea de observaciones recién agregadas
  const [localExtraObs, setLocalExtraObs] = useState<{ [clientId: string]: string[] }>({});

  // Formulario desplegable para AGREGAR OBSERVACIÓN A CLIENTE YA REGISTRADO DE LA BD
  const [showAddFidelizadoModal, setShowAddFidelizadoModal] = useState(false);
  const [selectedClientIdDB, setSelectedClientIdDB] = useState('');
  const [searchDBClientQuery, setSearchDBClientQuery] = useState('');
  const [fidelizadoObsText, setFidelizadoObsText] = useState('');

  // Estado para agregar observación rápida a cliente existente
  const [nuevaObsText, setNuevaObsText] = useState<{ [clientId: string]: string }>({});

  // Lista local de tareas estratégicas iniciada completamente LIMPIA ([])
  const [tareasEstrategicas, setTareasEstrategicas] = useState<TareaEstrategica[]>([]);

  // HELPER PARA DETECTAR FECHA EXPIRADA / VENCIDA EN ROJO
  const checkIsExpiredDate = (fechaStr: string, estado: EstadoTareaEstricto) => {
    if (estado === 'RETRASADA') return true;
    if (!fechaStr) return false;
    
    if (fechaStr.includes('31/06/2026') || fechaStr.includes('30/06') || fechaStr.includes('vencid')) return true;

    try {
      let dateObj: Date | null = null;
      if (fechaStr.includes('-')) {
        dateObj = new Date(fechaStr);
      } else if (fechaStr.includes('/')) {
        const parts = fechaStr.split('/');
        if (parts.length === 3) {
          dateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      }

      if (dateObj && !isNaN(dateObj.getTime())) {
        const cutoffDate = new Date('2026-08-03T00:00:00');
        return dateObj < cutoffDate;
      }
    } catch (err) {}

    return false;
  };

  // Formulario para Crear Nueva Tarea Principal
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedTaskClientIdDB, setSelectedTaskClientIdDB] = useState('');
  const [taskEmpresaName, setTaskEmpresaName] = useState('');
  const [searchTaskClientDBQuery, setSearchTaskClientDBQuery] = useState('');

  const [newEtapaProceso, setNewEtapaProceso] = useState('Proyecto en ejecución');
  const [newActividadInmediata, setNewActividadInmediata] = useState('');
  const [newProximoPaso, setNewProximoPaso] = useState('');
  const [newResponsable, setNewResponsable] = useState('Steven');
  const [newFechaCompromiso, setNewFechaCompromiso] = useState('31/07/2026');

  // Estado local para agregar nueva Subtarea / Avance diario
  const [nuevaSubtareaText, setNuevaSubtareaText] = useState<{ [tareaId: string]: string }>({});
  const [nuevaSubtareaFecha, setNuevaSubtareaFecha] = useState<{ [tareaId: string]: string }>({});

  const handleAdvisorSelect = (adv: string) => {
    setSelectedAdvisor(adv);
    setTaskPage(1);
    if (onAdvisorChange) onAdvisorChange(adv);
  };

  // AGREGAR OBSERVACIÓN RÁPIDA DENTRO DE LA TARJETA DEL CLIENTE
  const handleAddNuevaObs = async (clientId: string) => {
    const text = (nuevaObsText[clientId] || '').trim();
    if (!text) {
      toast.error('Ingresa el texto de la observación.');
      return;
    }

    setLocalExtraObs(prev => ({
      ...prev,
      [clientId]: [...(prev[clientId] || []), text]
    }));

    try {
      await addInteraction(clientId, {
        tipo: 'Nota',
        accion: 'Observación Registrada',
        observaciones: text,
        usuario: selectedAdvisor !== 'TODOS' ? selectedAdvisor : 'ADMIN'
      });
    } catch (err) {}

    toast.success('¡Observación agregada y visible en pantalla!');
    setNuevaObsText(prev => ({ ...prev, [clientId]: '' }));
  };

  // AGREGAR OBSERVACIÓN A CLIENTE YA REGISTRADO DE LA BD
  const handleAddObsToExistingDBClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientIdDB) {
      toast.error('Por favor selecciona un cliente registrado de la base de datos.');
      return;
    }
    if (!fidelizadoObsText.trim()) {
      toast.error('Por favor ingresa el texto de la observación.');
      return;
    }

    const clientMatch = clients.find(c => String(c.id) === String(selectedClientIdDB));
    const text = fidelizadoObsText.trim();

    setLocalExtraObs(prev => ({
      ...prev,
      [selectedClientIdDB]: [...(prev[selectedClientIdDB] || []), text]
    }));

    setExpandedClient(selectedClientIdDB);

    try {
      await addInteraction(selectedClientIdDB, {
        tipo: 'Nota',
        accion: 'Observación de Fidelización',
        observaciones: text,
        usuario: selectedAdvisor !== 'TODOS' ? selectedAdvisor : 'ADMIN'
      });
    } catch (err) {}

    toast.success(`¡Observación agregada a "${clientMatch?.empresa || 'Cliente'}"!`);

    setFidelizadoObsText('');
    setSelectedClientIdDB('');
    setShowAddFidelizadoModal(false);
  };

  // Crear Tarea Principal
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    let empresaFinal = taskEmpresaName.trim();
    if (!empresaFinal && selectedTaskClientIdDB) {
      const match = clients.find(c => String(c.id) === String(selectedTaskClientIdDB));
      if (match) empresaFinal = match.empresa;
    }

    if (!empresaFinal) {
      toast.error('Por favor selecciona o ingresa el nombre de la Empresa / Cliente.');
      return;
    }
    if (!newActividadInmediata.trim()) {
      toast.error('Por favor ingresa la Actividad Inmediata.');
      return;
    }

    const isExp = checkIsExpiredDate(newFechaCompromiso, 'PENDIENTE');

    const newTask: TareaEstrategica = {
      id: `task-${Date.now()}`,
      clienteId: selectedTaskClientIdDB || undefined,
      empresa: empresaFinal,
      etapaProceso: newEtapaProceso,
      actividadInmediata: newActividadInmediata.trim(),
      proximoPaso: newProximoPaso.trim() || 'Coordinación comercial',
      responsable: newResponsable,
      fechaCompromiso: newFechaCompromiso || '31/07/2026',
      estado: isExp ? 'RETRASADA' : 'PENDIENTE',
      subtareas: []
    };

    setTareasEstrategicas([newTask, ...tareasEstrategicas]);
    setExpandedTareaId(newTask.id);
    setTaskPage(1);

    if (selectedAdvisor !== 'TODOS' && selectedAdvisor.toLowerCase() !== newResponsable.toLowerCase()) {
      setSelectedAdvisor('TODOS');
    }

    toast.success(`¡Tarea "${empresaFinal}" guardada y mostrada en pantalla!`);

    setSelectedTaskClientIdDB('');
    setTaskEmpresaName('');
    setNewActividadInmediata('');
    setNewProximoPaso('');
    setShowCreateTaskModal(false);
  };

  // Toggle Checkbox Completo Tarea Principal (BLOQUEADO SI YA ESTÁ FINALIZADA)
  const toggleTaskCompletion = (tareaId: string) => {
    const target = tareasEstrategicas.find(t => t.id === tareaId);
    if (target?.estado === 'FINALIZADA') {
      toast.warning('🔒 Esta tarea ya ha sido FINALIZADA y no se puede volver a poner como pendiente.', {
        duration: 4000
      });
      return;
    }

    setTareasEstrategicas(prev => prev.map(t => {
      if (t.id === tareaId) {
        toast.success(`¡Tarea "${t.empresa}" marcada como FINALIZADA ✅! Queda registrada y bloqueada.`);
        return { ...t, estado: 'FINALIZADA' };
      }
      return t;
    }));
  };

  // Toggle Checkbox Completo Subtarea (BLOQUEADO SI YA FUE COMPLETADA)
  const toggleSubtaskCompletion = (tareaId: string, subtareaId: string) => {
    const targetTask = tareasEstrategicas.find(t => t.id === tareaId);
    const targetSub = targetTask?.subtareas.find(s => s.id === subtareaId);

    if (targetSub?.completada) {
      toast.warning('🔒 Esta subtarea ya fue realizada y no se puede revertir.', {
        duration: 4000
      });
      return;
    }

    setTareasEstrategicas(prev => prev.map(t => {
      if (t.id === tareaId) {
        return {
          ...t,
          subtareas: t.subtareas.map(s => {
            if (s.id === subtareaId) {
              toast.success('¡Subtarea marcada como realizada ✅!');
              return { ...s, completada: true };
            }
            return s;
          })
        };
      }
      return t;
    }));
  };

  // Crear Subtarea / Avance Diario dentro de una Tarea
  const handleAddSubtarea = (tareaId: string) => {
    const text = (nuevaSubtareaText[tareaId] || '').trim();
    const fecha = nuevaSubtareaFecha[tareaId] || new Date().toLocaleDateString('es-PE');

    if (!text) {
      toast.error('Escribe el avance o subtarea.');
      return;
    }

    setTareasEstrategicas(prev => prev.map(t => {
      if (t.id === tareaId) {
        return {
          ...t,
          subtareas: [
            ...t.subtareas,
            { id: `sub-${Date.now()}`, fecha, texto: text, completada: false }
          ]
        };
      }
      return t;
    }));

    toast.success('¡Subtarea agregada y mostrada en el historial!');
    setNuevaSubtareaText(prev => ({ ...prev, [tareaId]: '' }));
  };

  // Filtrado de Clientes ya registrados en la BD para el Selector de Fidelización
  const registeredClientsListDB = useMemo(() => {
    if (!searchDBClientQuery.trim()) return clients.slice(0, 40);
    const q = searchDBClientQuery.toLowerCase();
    return clients.filter(c => 
      c.empresa?.toLowerCase().includes(q) || 
      c.ruc?.includes(q) || 
      c.contacto?.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [clients, searchDBClientQuery]);

  // Filtrado de Clientes ya registrados en la BD para el Selector de Nueva Tarea
  const registeredClientsListTaskDB = useMemo(() => {
    if (!searchTaskClientDBQuery.trim()) return clients.slice(0, 40);
    const q = searchTaskClientDBQuery.toLowerCase();
    return clients.filter(c => 
      c.empresa?.toLowerCase().includes(q) || 
      c.ruc?.includes(q) || 
      c.contacto?.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [clients, searchTaskClientDBQuery]);

  // Clientes Fidelizados Filtrados de la BD
  const clientesFidelizados = useMemo(() => {
    let list = clients.filter(c => {
      if (selectedAdvisor && selectedAdvisor !== 'TODOS' && c.asignadoA !== selectedAdvisor && c.creadoPor !== selectedAdvisor) {
        return false;
      }
      return true;
    });

    if (searchObsQuery.trim()) {
      const q = searchObsQuery.toLowerCase();
      list = list.filter(c => c.empresa?.toLowerCase().includes(q) || c.contacto?.toLowerCase().includes(q));
    }

    return list;
  }, [clients, selectedAdvisor, searchObsQuery]);

  // Tareas Estratégicas Filtradas por Responsable, Buscador Global y Fechas (Estilo Cartera)
  const filteredTareasEstrategicas = useMemo(() => {
    return tareasEstrategicas.filter(t => {
      if (selectedAdvisor && selectedAdvisor !== 'TODOS' && t.responsable.toLowerCase() !== selectedAdvisor.toLowerCase()) {
        return false;
      }
      if (filterEstado !== 'TODAS' && t.estado !== filterEstado) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEmpresa = t.empresa.toLowerCase().includes(q);
        const matchAct = t.actividadInmediata.toLowerCase().includes(q);
        const matchResp = t.responsable.toLowerCase().includes(q);
        if (!matchEmpresa && !matchAct && !matchResp) return false;
      }

      // Filtro por Fechas
      if (dateFilterType === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!t.fechaCompromiso.includes(todayStr) && !t.fechaCompromiso.includes('03/08/2026')) return false;
      } else if (dateFilterType === 'custom') {
        if (t.fechaCompromiso < customStartDate || t.fechaCompromiso > customEndDate) return false;
      }

      return true;
    });
  }, [tareasEstrategicas, selectedAdvisor, filterEstado, searchQuery, dateFilterType, customStartDate, customEndDate]);

  // Paginación Tipo Cartera con Soporte para +100 Registros
  const paginatedTareas = useMemo(() => {
    const start = (taskPage - 1) * taskLimit;
    return filteredTareasEstrategicas.slice(start, start + taskLimit);
  }, [filteredTareasEstrategicas, taskPage, taskLimit]);

  const totalTaskPages = Math.ceil(filteredTareasEstrategicas.length / taskLimit) || 1;

  const counts = useMemo(() => {
    return {
      PENDIENTE: tareasEstrategicas.filter(t => t.estado === 'PENDIENTE').length,
      EN_PROCESO: tareasEstrategicas.filter(t => t.estado === 'EN_PROCESO').length,
      FINALIZADA: tareasEstrategicas.filter(t => t.estado === 'FINALIZADA').length,
      RETRASADA: tareasEstrategicas.filter(t => t.estado === 'RETRASADA').length
    };
  }, [tareasEstrategicas]);

  const getStatusBadge = (st: EstadoTareaEstricto) => {
    switch (st) {
      case 'PENDIENTE':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-semibold hover:bg-amber-100"><Clock className="w-3 h-3 mr-1 text-amber-600" /> Pendiente</Badge>;
      case 'EN_PROCESO':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold hover:bg-blue-100"><PlayCircle className="w-3 h-3 mr-1 text-blue-600" /> En Proceso</Badge>;
      case 'FINALIZADA':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Finalizada (Bloqueada)</Badge>;
      case 'RETRASADA':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[11px] font-semibold hover:bg-rose-100"><AlertCircle className="w-3 h-3 mr-1 text-rose-600" /> Retrasada</Badge>;
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* BARRA DE BUSQUEDA Y FILTROS EXACTO A CRM/CARTERA */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Buscador Global Exacto Cartera */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por empresa, actividad o responsable en la agenda..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setTaskPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-700 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            {/* Selector de Límite por Página */}
            <select
              value={taskLimit}
              onChange={(e) => {
                setTaskLimit(Number(e.target.value));
                setTaskPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
            >
              <option value={10}>10 por pág.</option>
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
            </select>

            {/* Selector por Responsable */}
            <select 
              value={selectedAdvisor} 
              onChange={(e) => handleAdvisorSelect(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3.5 py-2 font-medium focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
            >
              <option value="TODOS">👥 Todo el Equipo Comercial</option>
              <optgroup label="Unidad 1 - Nuevos Negocios">
                <option value="Ariana">Ariana (Prospección)</option>
                <option value="Brenda">Brenda (Prospección Exclusiva)</option>
                <option value="Valentina">Valentina (Seguimiento & Cierre)</option>
              </optgroup>
              <optgroup label="Unidad 2 - Clientes Estratégicos">
                <option value="Steven">Steven (Estratégico)</option>
                <option value="Mario">Mario (Instalación & Servicio)</option>
                <option value="Javier">Javier (Estratégico)</option>
                <option value="Angie">Angie (Recuperación & Cartera)</option>
                <option value="Mellani">Mellani (Estratégico)</option>
              </optgroup>
            </select>

            {/* Selector por Fechas */}
            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3.5 py-2 font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
            >
              <option value="all">📅 Todo el Historial</option>
              <option value="today">📅 Hoy ({new Date().toLocaleDateString('es-PE')})</option>
              <option value="custom">📅 Rango Personalizado</option>
            </select>

            {/* Botón Principal "+ Crear Nueva Tarea" Estilo Cartera */}
            <Button
              onClick={() => setShowCreateTaskModal(!showCreateTaskModal)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl px-4 py-2 shadow-xs gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> 
              {showCreateTaskModal ? 'Cerrar Formulario' : '+ Crear Nueva Tarea'}
            </Button>
          </div>
        </div>

        {dateFilterType === 'custom' && (
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Filtrar por rango:</span>
            <input
              type="date"
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <span className="text-xs text-slate-400 font-medium">hasta</span>
            <input
              type="date"
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* FORMULARIO DE CREACIÓN DE NUEVA TAREA PRINCIPAL (ESTILO CARTERA) */}
      {showCreateTaskModal && (
        <form onSubmit={handleCreateTask} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Crear y Asignar Nueva Tarea Comercial (Seleccionar Cliente BD o Escribir Nombre)
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">1. Seleccionar Cliente Registrado de la BD *</label>
              <input
                type="text"
                placeholder="Buscar cliente en BD por RUC o Nombre (ej: Sechura, Norandino, IPESA)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-normal text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchTaskClientDBQuery}
                onChange={(e) => setSearchTaskClientDBQuery(e.target.value)}
              />

              <div className="bg-white border border-slate-200 rounded-xl max-h-36 overflow-y-auto p-1.5 space-y-1">
                {registeredClientsListTaskDB.map(c => {
                  const isSelected = selectedTaskClientIdDB === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedTaskClientIdDB(c.id);
                        setTaskEmpresaName(c.empresa);
                        toast.info(`Cliente "${c.empresa}" seleccionado para la tarea`);
                      }}
                      className={`p-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                        isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-emerald-50 text-slate-700'
                      }`}
                    >
                      <span>🏢 {c.empresa} {c.tarifa ? `[${c.tarifa}]` : ''}</span>
                      <span className="text-[10px] opacity-80 font-normal">Asesor: {c.asignadoA || 'Valentina'}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">O Escribe el Nombre de la Empresa / Cliente *</label>
                <input
                  type="text"
                  placeholder="Ej: Hielos y Congelados Sechura"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={taskEmpresaName}
                  onChange={(e) => setTaskEmpresaName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Responsable Asignado *</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  value={newResponsable}
                  onChange={(e) => setNewResponsable(e.target.value)}
                >
                  <option value="Steven">Steven</option>
                  <option value="Mario">Mario</option>
                  <option value="Javier">Javier</option>
                  <option value="Valentina">Valentina</option>
                  <option value="Ariana">Ariana</option>
                  <option value="Brenda">Brenda</option>
                  <option value="Angie">Angie</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Etapa del Proceso</label>
                <input
                  type="text"
                  placeholder="Ej: Proyecto en ejecución / Proyecto aprobado"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  value={newEtapaProceso}
                  onChange={(e) => setNewEtapaProceso(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fecha Compromiso *</label>
                <input
                  type="text"
                  placeholder="Ej: 31/06/2026 o lunes, 3 de agosto de 2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  value={newFechaCompromiso}
                  onChange={(e) => setNewFechaCompromiso(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actividad Inmediata *</label>
              <input
                type="text"
                placeholder="Ej: Revisar avance del expediente técnico"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                value={newActividadInmediata}
                onChange={(e) => setNewActividadInmediata(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Próximo Paso</label>
              <input
                type="text"
                placeholder="Ej: Coordinar siguiente etapa del proyecto"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                value={newProximoPaso}
                onChange={(e) => setNewProximoPaso(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateTaskModal(false)}
              className="rounded-xl text-xs font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium"
            >
              Guardar y Asignar Tarea
            </Button>
          </div>
        </form>
      )}

      {/* TARJETAS KPI DE ESTADOS ESTILO CARTERA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterEstado(filterEstado === 'PENDIENTE' ? 'TODAS' : 'PENDIENTE')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterEstado === 'PENDIENTE' 
              ? 'bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/20' 
              : 'bg-white border-slate-200 hover:border-amber-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pendientes</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{counts.PENDIENTE}</div>
          <div className="text-xs text-slate-500 font-normal mt-0.5">Programadas sin iniciar</div>
        </button>

        <button
          onClick={() => setFilterEstado(filterEstado === 'EN_PROCESO' ? 'TODAS' : 'EN_PROCESO')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterEstado === 'EN_PROCESO' 
              ? 'bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/20' 
              : 'bg-white border-slate-200 hover:border-blue-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">En Proceso</span>
            <PlayCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{counts.EN_PROCESO}</div>
          <div className="text-xs text-slate-500 font-normal mt-0.5">En ejecución activa</div>
        </button>

        <button
          onClick={() => setFilterEstado(filterEstado === 'FINALIZADA' ? 'TODAS' : 'FINALIZADA')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterEstado === 'FINALIZADA' 
              ? 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200 hover:border-emerald-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Finalizadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{counts.FINALIZADA}</div>
          <div className="text-xs text-slate-500 font-normal mt-0.5">Entregadas con éxito</div>
        </button>

        <button
          onClick={() => setFilterEstado(filterEstado === 'RETRASADA' ? 'TODAS' : 'RETRASADA')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterEstado === 'RETRASADA' 
              ? 'bg-rose-500/10 border-rose-500/50 ring-2 ring-rose-500/20' 
              : 'bg-white border-slate-200 hover:border-rose-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Retrasadas / Expiradas</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{counts.RETRASADA}</div>
          <div className="text-xs text-slate-500 font-normal mt-0.5">Fecha plazo vencida</div>
        </button>
      </div>

      {/* SECCIÓN 1: CONTENEDOR DE TAREAS ESTRATÉGICAS Y SUBTAREAS (EXACTO TIPOGRAFÍA CARTERA) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-emerald-600" />
              Tablero de Tareas Asignadas y Subtareas
            </h3>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold">
              {filteredTareasEstrategicas.length} tareas totales
            </Badge>
          </div>

          <span className="text-xs font-medium text-slate-500">
            Mostrando {filteredTareasEstrategicas.length > 0 ? (taskPage - 1) * taskLimit + 1 : 0} a {Math.min(taskPage * taskLimit, filteredTareasEstrategicas.length)} de {filteredTareasEstrategicas.length} (Pág {taskPage}/{totalTaskPages})
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {paginatedTareas.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-700">No hay tareas que coincidan con los filtros aplicados.</p>
            </div>
          ) : (
            paginatedTareas.map((tarea, idx) => {
              const isExpanded = expandedTareaId === tarea.id;
              const isExpired = checkIsExpiredDate(tarea.fechaCompromiso, tarea.estado);
              const isFinalized = tarea.estado === 'FINALIZADA';

              return (
                <div key={tarea.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox Principal (BLOQUEADO SI FINALIZADA) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskCompletion(tarea.id);
                        }}
                        disabled={isFinalized}
                        className={`mt-1 p-1 transition-colors shrink-0 ${
                          isFinalized ? 'cursor-not-allowed text-emerald-600 opacity-90' : 'text-slate-400 hover:text-emerald-600'
                        }`}
                        title={isFinalized ? "Esta tarea ya ha sido finalizada y no se puede modificar" : "Marcar Tarea como Completada"}
                      >
                        {isFinalized ? (
                          <div className="flex items-center gap-1">
                            <CheckSquare className="w-6 h-6 text-emerald-600" />
                            <Lock className="w-3 h-3 text-emerald-700" />
                          </div>
                        ) : (
                          <Square className="w-6 h-6 text-slate-300" />
                        )}
                      </button>

                      <div 
                        className="space-y-1.5 cursor-pointer flex-1"
                        onClick={() => setExpandedTareaId(isExpanded ? null : tarea.id)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center border border-slate-200">
                            {(taskPage - 1) * taskLimit + idx + 1}
                          </span>
                          <h4 className={`text-sm font-semibold text-slate-900 hover:text-emerald-600 transition-colors ${isFinalized ? 'line-through text-slate-400' : ''}`}>
                            {tarea.empresa}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase border border-slate-200">
                            {tarea.etapaProceso}
                          </span>
                          {getStatusBadge(tarea.estado)}
                        </div>

                        <p className="text-xs font-semibold text-slate-800">
                          📌 Actividad Inmediata: <span className="font-normal text-slate-600">{tarea.actividadInmediata}</span>
                        </p>
                        <p className="text-xs font-semibold text-indigo-700">
                          ➡️ Próximo Paso: <span className="font-normal text-slate-600">{tarea.proximoPaso}</span>
                        </p>

                        {/* FECHA COMPROMISO (ROJO SI EXPIRADA) */}
                        <div className="flex items-center gap-2 pt-0.5">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200 shadow-xs animate-pulse">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              Fecha compromiso expirada: <strong className="font-mono text-rose-900">{tarea.fechaCompromiso}</strong> (VENCIDA)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/80 shadow-xs">
                              <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                              Fecha compromiso: <strong className="font-mono text-emerald-900">{tarea.fechaCompromiso}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100 justify-between lg:justify-end">
                      <div className="text-left lg:text-right">
                        <p className="text-xs text-slate-500 font-medium">
                          Responsable: <strong className="text-slate-900 font-semibold uppercase">{tarea.responsable}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => setExpandedTareaId(isExpanded ? null : tarea.id)}
                        className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 shrink-0 hover:bg-emerald-100 transition-colors"
                      >
                        <span>{tarea.subtareas.length} Subtarea(s)</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* DESPLIEGUE DE SUBTAREAS */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                      {!isFinalized && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            + Agregar Subtarea / Avance Diario por Fecha
                          </label>
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <input
                              type="text"
                              placeholder="Fecha (ej: 03/08/2026)"
                              className="w-full sm:w-36 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800"
                              value={nuevaSubtareaFecha[tarea.id] || new Date().toLocaleDateString('es-PE')}
                              onChange={(e) => setNuevaSubtareaFecha({ ...nuevaSubtareaFecha, [tarea.id]: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="Escribe la subtarea / avance (ej: 11:10AM A LA ESPERA DE LAS FACTIBILIDADES...)"
                              className="flex-1 w-full bg-white border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs font-normal text-slate-800"
                              value={nuevaSubtareaText[tarea.id] || ''}
                              onChange={(e) => setNuevaSubtareaText({ ...nuevaSubtareaText, [tarea.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddSubtarea(tarea.id);
                              }}
                            />
                            <Button
                              onClick={() => handleAddSubtarea(tarea.id)}
                              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg px-4 py-1.5 shadow-xs shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Agregar Subtarea
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Historial de Subtareas ({tarea.subtareas.length})
                        </h5>
                        {tarea.subtareas.map((sub) => (
                          <div key={sub.id} className="flex items-start gap-3 text-xs bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
                            <button
                              onClick={() => toggleSubtaskCompletion(tarea.id, sub.id)}
                              disabled={sub.completada}
                              className={`mt-0.5 transition-colors shrink-0 ${
                                sub.completada ? 'cursor-not-allowed text-emerald-600 opacity-90' : 'text-slate-400 hover:text-emerald-600'
                              }`}
                              title={sub.completada ? "Esta subtarea ya fue realizada y no se puede modificar" : "Marcar Subtarea como Realizada"}
                            >
                              {sub.completada ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                            <span className="font-mono font-semibold text-slate-700 shrink-0 text-[10px] bg-slate-200 px-2 py-0.5 rounded-md">
                              📅 {sub.fecha}
                            </span>
                            <p className={`text-slate-700 font-normal leading-relaxed ${sub.completada ? 'line-through text-slate-400' : ''}`}>
                              {sub.texto}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* PAGINACIÓN ALTA CAPACIDAD TIPO CARTERA (+100 REGISTROS) */}
        {totalTaskPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <span className="text-xs font-medium text-slate-500">
              Página {taskPage} de {totalTaskPages} ({filteredTareasEstrategicas.length} tareas totales)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={taskPage === 1}
                onClick={() => setTaskPage(prev => Math.max(1, prev - 1))}
                className="rounded-xl text-xs font-medium"
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalTaskPages) }, (_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setTaskPage(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                        taskPage === pNum ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                disabled={taskPage === totalTaskPages}
                onClick={() => setTaskPage(prev => Math.min(totalTaskPages, prev + 1))}
                className="rounded-xl text-xs font-medium"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN 2: CLIENTES FIDELIZADOS (ESTILO CARTERA DE CLIENTES) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              Seguimiento a Clientes Fidelizados Registrados (Obs 1 a Obs 10)
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Conectado a la Base de Datos ({clientesFidelizados.length} cuentas) • Registra Observaciones 1-10
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente fidelizado (ej: IPESA, IMP)..."
                className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 lg:w-64"
                value={searchObsQuery}
                onChange={(e) => setSearchObsQuery(e.target.value)}
              />
            </div>

            <Button
              onClick={() => setShowAddFidelizadoModal(!showAddFidelizadoModal)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl px-3.5 py-1.5 shadow-xs shrink-0 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddFidelizadoModal ? 'Cerrar' : '+ Seleccionar Cliente BD'}
            </Button>
          </div>
        </div>

        {/* FORMULARIO DESPLEGABLE DE OBSERVACIÓN BD */}
        {showAddFidelizadoModal && (
          <form onSubmit={handleAddObsToExistingDBClient} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 uppercase pb-2 border-b border-slate-200">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              Seleccionar Cliente Ya Registrado en la Base de Datos
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Buscar y Seleccionar Cliente Registrado *</label>
                <div className="space-y-1.5 mt-1">
                  <input
                    type="text"
                    placeholder="Filtrar por nombre de empresa (ej: IPESA, IMP, Norandino)..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={searchDBClientQuery}
                    onChange={(e) => setSearchDBClientQuery(e.target.value)}
                  />
                  <div className="bg-white border border-slate-200 rounded-xl max-h-36 overflow-y-auto p-1.5 space-y-1">
                    {registeredClientsListDB.map(c => {
                      const isSelected = selectedClientIdDB === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedClientIdDB(c.id);
                            toast.info(`Cliente "${c.empresa}" seleccionado para observación`);
                          }}
                          className={`p-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                            isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-emerald-50 text-slate-700'
                          }`}
                        >
                          <span>🏢 {c.empresa} {c.tarifa ? `[${c.tarifa}]` : ''}</span>
                          <span className="text-[10px] opacity-80 font-normal">Asesor: {c.asignadoA || 'Valentina'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Texto de la Observación *</label>
                <input
                  type="text"
                  placeholder="Ej: PREGUNTAR POR COTIZACIÓN DE CORRECTIVOS / COTIZAR MANTENIMIENTO DE POZOS"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  value={fidelizadoObsText}
                  onChange={(e) => setFidelizadoObsText(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddFidelizadoModal(false)}
                className="rounded-xl text-xs font-medium"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium"
              >
                Guardar Observación en Cliente BD
              </Button>
            </div>
          </form>
        )}

        {/* LISTA DE CLIENTES FIDELIZADOS */}
        <div className="space-y-3">
          {clientesFidelizados.slice(0, obsVisibleLimit).map((c, idx) => {
            const interacciones = c.historialInteracciones || (c as any).interacciones || [];
            const isExpanded = expandedClient === c.id;

            const obsList: string[] = [];
            if (c.observaciones) obsList.push(c.observaciones);
            interacciones.forEach((i: any) => {
              const obs = i.observaciones || i.comentario || i.notas;
              if (obs && !obsList.includes(obs)) {
                obsList.push(obs);
              }
            });

            const extraLocal = localExtraObs[c.id] || [];
            extraLocal.forEach(obs => {
              if (!obsList.includes(obs)) {
                obsList.push(obs);
              }
            });

            return (
              <div key={c.id} className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 shadow-xs hover:border-emerald-200 transition-all">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedClient(isExpanded ? null : c.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-50 font-semibold text-emerald-700 text-xs flex items-center justify-center border border-emerald-100">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 hover:text-emerald-600 transition-colors">{c.empresa}</h4>
                      <p className="text-xs text-slate-500 font-normal flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono text-[10px] uppercase font-semibold">{c.tarifa || 'MT3'}</span>
                        <span>• Asesor: <strong className="text-slate-700 font-semibold">{c.asignadoA}</strong></span>
                        <span className="text-emerald-600 font-semibold">• {obsList.length} Observación(es)</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-600 font-semibold hidden sm:inline">
                      {isExpanded ? 'Ocultar' : 'Ver / Agregar Observaciones'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Escribe aquí la nueva observación (ej: ENVIAR COTIZACIÓN DE CORRECTIVOS)..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={nuevaObsText[c.id] || ''}
                        onChange={(e) => setNuevaObsText({ ...nuevaObsText, [c.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNuevaObs(c.id);
                        }}
                      />
                      <Button
                        onClick={() => handleAddNuevaObs(c.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl px-3.5 py-2 shadow-xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Agregar Observación
                      </Button>
                    </div>

                    <div className="space-y-2 pt-1">
                      {obsList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Sin observaciones registradas aún.</p>
                      ) : (
                        obsList.slice(0, 10).map((obsText, obsIdx) => (
                          <div key={obsIdx} className="flex items-start gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="font-semibold text-emerald-700 shrink-0 uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              OBSERVACIÓN {obsIdx + 1}
                            </span>
                            <span className="text-slate-700 font-normal">{obsText}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {clientesFidelizados.length > obsVisibleLimit && (
            <Button
              variant="outline"
              onClick={() => setObsVisibleLimit(prev => prev + 10)}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-xs mt-2"
            >
              Cargar 10 clientes fidelizados más ({clientesFidelizados.length - obsVisibleLimit} restantes) <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
