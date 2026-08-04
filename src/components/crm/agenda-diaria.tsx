'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Edit2,
  X,
  Save,
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
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CRMHeader } from '@/components/crm/crm-header';

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
  estadoStr?: 'SI' | 'NO' | 'EN_PROCESO';
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

export interface ObsEntry {
  texto: string;
  fecha: string;
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
  const [showFidelizadosModal, setShowFidelizadosModal] = useState(false);

  // PAGINACIÓN Y LÍMITE DE REGISTROS PARA MAS DE 100 TAREAS
  const [taskPage, setTaskPage] = useState(1);
  const [taskLimit, setTaskLimit] = useState(10);

  const [obsVisibleLimit, setObsVisibleLimit] = useState(10);
  const [searchObsQuery, setSearchObsQuery] = useState('');

  // Mapa local para visibilidad instantánea de observaciones recién agregadas (con fecha)
  const [localExtraObs, setLocalExtraObs] = useState<{ [clientId: string]: ObsEntry[] }>({});

  // Formulario desplegable para AGREGAR OBSERVACIÓN A CLIENTE YA REGISTRADO DE LA BD
  const [showAddFidelizadoModal, setShowAddFidelizadoModal] = useState(false);
  const [selectedClientIdDB, setSelectedClientIdDB] = useState('');
  const [searchDBClientQuery, setSearchDBClientQuery] = useState('');
  const [fidelizadoObsText, setFidelizadoObsText] = useState('');
  const [fidelizadoObsFecha, setFidelizadoObsFecha] = useState('');

  // Estado para agregar observación rápida a cliente existente
  const [nuevaObsText, setNuevaObsText] = useState<{ [clientId: string]: string }>({});
  const [nuevaObsFecha, setNuevaObsFecha] = useState<{ [clientId: string]: string }>({});

  // Lista de tareas estratégicas — SINCRONIZADA CON EL SERVIDOR GLOBAL
  const [tareasEstrategicas, setTareasEstrategicas] = useState<TareaEstrategica[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // CARGAR TAREAS GLOBALES AL INICIAR
  useEffect(() => {
    const fetchAgenda = async () => {
      try {
        const response = await api.get('/crm/agenda');
        if (Array.isArray(response)) {
          setTareasEstrategicas(response);
        }
      } catch (err) {
        console.warn('[Agenda] Error cargando tareas de la BD:', err);
      } finally {
        setIsInitialLoad(false);
      }
    };
    fetchAgenda();
  }, []);

  // GUARDAR TAREAS GLOBALES CADA VEZ QUE CAMBIEN
  useEffect(() => {
    if (isInitialLoad) return; 

    const saveAgenda = async () => {
      try {
        await api.post('/crm/agenda', tareasEstrategicas);
      } catch (err) {
        console.warn('[Agenda] Error guardando tareas en la BD:', err);
      }
    };
    
    // Pequeño debounce para no saturar si editan rápido
    const timer = setTimeout(() => {
      saveAgenda();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [tareasEstrategicas, isInitialLoad]);

  // HELPER PARA IDENTIFICAR SOLO CLIENTES GANADOS / FIDELIZADOS
  const isWonClient = (c: Client) => {
    const estadoStr = (c.estado || '').toLowerCase();
    const etapaStr = (c.etapaComercial || '').toLowerCase();
    const tipoStr = (c.tipoCliente || '').toLowerCase();

    return (
      c.esClienteReal ||
      estadoStr.includes('ganad') ||
      estadoStr.includes('cliente') ||
      etapaStr.includes('ganad') ||
      tipoStr === 'cliente'
    );
  };

  // HELPER PARA DETECTAR FECHA EXPIRADA / VENCIDA EN ROJO (USA FECHA DE HOY DINÁMICA)
  const checkIsExpiredDate = useCallback((fechaStr: string, estado: EstadoTareaEstricto) => {
    if (estado === 'RETRASADA') return true;
    if (estado === 'FINALIZADA') return false;
    if (!fechaStr) return false;
    
    if (fechaStr.toLowerCase().includes('vencid')) return true;

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
        // Comparar con HOY a las 00:00:00 (inicio del día actual)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dateObj < today;
      }
    } catch (err) {}

    return false;
  }, []);

  // Formulario para Crear Nueva Tarea Principal
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedTaskClientIdDB, setSelectedTaskClientIdDB] = useState('');
  const [taskEmpresaName, setTaskEmpresaName] = useState('');
  const [taskProyectoName, setTaskProyectoName] = useState('');
  const [searchTaskClientDBQuery, setSearchTaskClientDBQuery] = useState('');
  const [showTaskClientList, setShowTaskClientList] = useState(true);
  const [showObsClientList, setShowObsClientList] = useState(true);

  const [newEtapaProceso, setNewEtapaProceso] = useState('Proyecto en ejecución');
  const [newActividadInmediata, setNewActividadInmediata] = useState('');
  const [newProximoPaso, setNewProximoPaso] = useState('');
  const [newResponsable, setNewResponsable] = useState('Steven');
  // Fecha compromiso por defecto = HOY dinámico (el usuario puede poner fechas pasadas)
  const [newFechaCompromiso, setNewFechaCompromiso] = useState(() => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

  // Estado local para agregar nueva Subtarea / Avance diario
  const [nuevaSubtareaText, setNuevaSubtareaText] = useState<{ [tareaId: string]: string }>({});
  const [nuevaSubtareaFecha, setNuevaSubtareaFecha] = useState<{ [tareaId: string]: string }>({});

  // Estado para EDITAR tarea existente
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editEmpresa, setEditEmpresa] = useState('');
  const [editEtapaProceso, setEditEtapaProceso] = useState('');
  const [editActividadInmediata, setEditActividadInmediata] = useState('');
  const [editProximoPaso, setEditProximoPaso] = useState('');
  const [editResponsable, setEditResponsable] = useState('');
  const [editFechaCompromiso, setEditFechaCompromiso] = useState('');
  const [editEstado, setEditEstado] = useState<EstadoTareaEstricto>('PENDIENTE');

  // Estado para confirmación de eliminación
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Estado para editar actividades
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskFecha, setEditSubtaskFecha] = useState('');
  const [editSubtaskText, setEditSubtaskText] = useState('');

  const handleStartEditSubtask = (subtaskId: string, currentFecha: string, currentText: string) => {
    setEditingSubtaskId(subtaskId);
    setEditSubtaskFecha(currentFecha);
    setEditSubtaskText(currentText);
  };

  const handleSaveEditSubtask = (tareaId: string, subtaskId: string) => {
    if (!editSubtaskText.trim() || !editSubtaskFecha.trim()) {
      toast.error('La fecha y el texto son obligatorios');
      return;
    }
    setTareasEstrategicas(prev => prev.map(t => {
      if (t.id === tareaId) {
        return {
          ...t,
          subtareas: t.subtareas.map(s => s.id === subtaskId ? { ...s, fecha: editSubtaskFecha, texto: editSubtaskText } : s)
        };
      }
      return t;
    }));
    setEditingSubtaskId(null);
    toast.success('Actividad actualizada exitosamente');
  };

  const handleDeleteSubtask = (tareaId: string, subtaskId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta actividad/avance?')) return;
    setTareasEstrategicas(prev => prev.map(t => {
      if (t.id === tareaId) {
        return {
          ...t,
          subtareas: t.subtareas.filter(s => s.id !== subtaskId)
        };
      }
      return t;
    }));
    toast.success('Actividad eliminada exitosamente');
  };

  const handleAdvisorSelect = (adv: string) => {
    setSelectedAdvisor(adv);
    setTaskPage(1);
    if (onAdvisorChange) onAdvisorChange(adv);
  };

  // AGREGAR OBSERVACIÓN RÁPIDA DENTRO DE LA TARJETA DEL CLIENTE (CON FECHA PERSONALIZABLE)
  const handleAddNuevaObs = async (clientId: string) => {
    const text = (nuevaObsText[clientId] || '').trim();
    if (!text) {
      toast.error('Ingresa el texto de la observación.');
      return;
    }

    // Usar fecha personalizada si el usuario la escribió, o la fecha+hora actual
    const customFecha = (nuevaObsFecha[clientId] || '').trim();
    let fechaFormatted: string;
    if (customFecha) {
      fechaFormatted = customFecha;
    } else {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, '0');
      const mi = String(now.getMinutes()).padStart(2, '0');
      fechaFormatted = `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
    }

    setLocalExtraObs(prev => ({
      ...prev,
      [clientId]: [...(prev[clientId] || []), { texto: text, fecha: fechaFormatted }]
    }));

    try {
      await addInteraction(clientId, {
        tipo: 'Nota',
        accion: 'Observación Registrada',
        observaciones: `[${fechaFormatted}] ${text}`,
        usuario: selectedAdvisor !== 'TODOS' ? selectedAdvisor : 'ADMIN'
      });
    } catch (err) {}

    toast.success('¡Observación agregada con fecha!');
    setNuevaObsText(prev => ({ ...prev, [clientId]: '' }));
    setNuevaObsFecha(prev => ({ ...prev, [clientId]: '' }));
  };

  // AGREGAR OBSERVACIÓN A CLIENTE GANADO DE LA BD (CON FECHA Y HORA)
  const handleAddObsToExistingDBClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientIdDB) {
      toast.error('Por favor selecciona un cliente ganado registrado de la base de datos.');
      return;
    }
    if (!fidelizadoObsText.trim()) {
      toast.error('Por favor ingresa el texto de la observación.');
      return;
    }

    const clientMatch = clients.find(c => String(c.id) === String(selectedClientIdDB));
    const text = fidelizadoObsText.trim();

    // Usar fecha personalizada si el usuario la escribió, o la fecha+hora actual
    const customFecha = fidelizadoObsFecha.trim();
    let fechaFormatted: string;
    if (customFecha) {
      fechaFormatted = customFecha;
    } else {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, '0');
      const mi = String(now.getMinutes()).padStart(2, '0');
      fechaFormatted = `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
    }

    setLocalExtraObs(prev => ({
      ...prev,
      [selectedClientIdDB]: [...(prev[selectedClientIdDB] || []), { texto: text, fecha: fechaFormatted }]
    }));

    setExpandedClient(selectedClientIdDB);

    try {
      await addInteraction(selectedClientIdDB, {
        tipo: 'Nota',
        accion: 'Observación de Fidelización',
        observaciones: `[${fechaFormatted}] ${text}`,
        usuario: selectedAdvisor !== 'TODOS' ? selectedAdvisor : 'ADMIN'
      });
    } catch (err) {}

    toast.success(`¡Observación registrada con fecha para "${clientMatch?.empresa || 'Cliente Ganado'}"!`);

    setFidelizadoObsText('');
    setFidelizadoObsFecha('');
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

    if (taskProyectoName.trim()) {
      empresaFinal = `${empresaFinal} - ${taskProyectoName.trim()}`;
    }

    if (!empresaFinal) {
      toast.error('Por favor selecciona o ingresa el nombre de la Empresa / Cliente.');
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
      fechaCompromiso: newFechaCompromiso || '',
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
    setTaskProyectoName('');
    setNewActividadInmediata('');
    setNewProximoPaso('');
    setShowCreateTaskModal(false);
  };

  // ELIMINAR TAREA
  const handleDeleteTask = (tareaId: string) => {
    const target = tareasEstrategicas.find(t => t.id === tareaId);
    setTareasEstrategicas(prev => prev.filter(t => t.id !== tareaId));
    setConfirmDeleteId(null);
    if (expandedTareaId === tareaId) setExpandedTareaId(null);
    if (editingTaskId === tareaId) setEditingTaskId(null);
    toast.success(`Tarea "${target?.empresa || ''}" eliminada correctamente.`);
  };

  // INICIAR EDICIÓN DE TAREA
  const handleStartEdit = (tarea: TareaEstrategica) => {
    setEditingTaskId(tarea.id);
    setEditEmpresa(tarea.empresa);
    setEditEtapaProceso(tarea.etapaProceso);
    setEditActividadInmediata(tarea.actividadInmediata);
    setEditProximoPaso(tarea.proximoPaso);
    setEditResponsable(tarea.responsable);
    setEditFechaCompromiso(tarea.fechaCompromiso);
    setEditEstado(tarea.estado);
    setExpandedTareaId(tarea.id);
  };

  // GUARDAR EDICIÓN DE TAREA
  const handleSaveEdit = (tareaId: string) => {
    if (!editEmpresa.trim()) {
      toast.error('El nombre de empresa no puede estar vacío.');
      return;
    }


    setTareasEstrategicas(prev => prev.map(t => {
      if (t.id === tareaId) {
        return {
          ...t,
          empresa: editEmpresa.trim(),
          etapaProceso: editEtapaProceso.trim() || t.etapaProceso,
          actividadInmediata: editActividadInmediata.trim(),
          proximoPaso: editProximoPaso.trim(),
          responsable: editResponsable || t.responsable,
          fechaCompromiso: editFechaCompromiso,
          estado: editEstado,
        };
      }
      return t;
    }));

    toast.success(`Tarea "${editEmpresa.trim()}" actualizada correctamente.`);
    setEditingTaskId(null);
  };

  // CANCELAR EDICIÓN
  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  // Toggle Checkbox Completo Tarea Principal
  const toggleTaskCompletion = (tareaId: string) => {
    const target = tareasEstrategicas.find(t => t.id === tareaId);
    
    setTareasEstrategicas(prev => prev.map(t => {
      if (t.id === tareaId) {
        if (t.estado === 'FINALIZADA') {
          toast.success(`¡Tarea "${t.empresa}" restaurada a PENDIENTE!`);
          return { ...t, estado: 'PENDIENTE' };
        } else {
          toast.success(`¡Tarea "${t.empresa}" marcada como FINALIZADA ✅!`);
          return { ...t, estado: 'FINALIZADA' };
        }
      }
      return t;
    }));
  };

  // Toggle Checkbox Completo Subtarea
  const toggleSubtaskCompletion = (tareaId: string, subtareaId: string) => {
    setTareasEstrategicas(prev => prev.map(t => {
      if (t.id === tareaId) {
        return {
          ...t,
          subtareas: t.subtareas.map(s => {
            if (s.id === subtareaId) {
              const newState = !s.completada;
              if (newState) {
                toast.success('¡Actividad marcada como realizada ✅!');
              } else {
                toast.success('Actividad restaurada');
              }
              return { ...s, completada: newState, estadoStr: newState ? 'SI' : 'NO' };
            }
            return s;
          })
        };
      }
      return t;
    }));
  };

  const handleSubtaskEstadoChange = (tareaId: string, subtareaId: string, newEstado: 'SI' | 'NO' | 'EN_PROCESO') => {
    setTareasEstrategicas(prev => prev.map(t => {
      if (t.id === tareaId) {
        return {
          ...t,
          subtareas: t.subtareas.map(s => {
            if (s.id === subtareaId) {
              return { 
                ...s, 
                estadoStr: newEstado,
                completada: newEstado === 'SI' ? true : (newEstado === 'NO' ? false : s.completada)
              };
            }
            return s;
          })
        };
      }
      return t;
    }));
  };

  const isSubtaskPastDue = (fechaStr: string) => {
    const parts = fechaStr.split('/');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d < today;
    }
    return false;
  };

  // Crear Subtarea / Avance Diario dentro de una Tarea
  const handleAddSubtarea = (tareaId: string) => {
    const text = (nuevaSubtareaText[tareaId] || '').trim();
    // Fecha de subtarea: usa la que escribió el usuario, o la fecha de HOY
    const now = new Date();
    const defaultFecha = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const fecha = nuevaSubtareaFecha[tareaId] || defaultFecha;

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

  // Filtrado de Clientes GANADOS de la BD para el Selector de Fidelización
  const registeredClientsListDB = useMemo(() => {
    const wonClients = clients.filter(isWonClient);
    if (!searchDBClientQuery.trim()) return wonClients.slice(0, 40);
    const q = searchDBClientQuery.toLowerCase();
    return wonClients.filter(c => 
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

  // SOLO CLIENTES GANADOS / FIDELIZADOS
  const clientesFidelizados = useMemo(() => {
    let list = clients.filter(c => {
      if (!isWonClient(c)) return false;
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
    <div className="space-y-6 text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <CRMHeader 
        title="Agenda Diaria, Tareas Estratégicas y Fidelización" 
        subtitle="Panel exclusivo para creación de Tareas, Subtareas por fecha y seguimiento a Clientes Fidelizados."
        actions={
          <Button onClick={() => setShowFidelizadosModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm h-9 gap-1.5">
            <HeartHandshake className="w-4 h-4" />
            Fidelizados ({clientesFidelizados.length})
          </Button>
        }
      />

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
              <option value="TODOS">Todo el Equipo Comercial</option>
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
              <option value="all">Todo el Historial</option>
              <option value="today">Hoy ({new Date().toLocaleDateString('es-PE')})</option>
              <option value="custom">Rango Personalizado</option>
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

              {selectedTaskClientIdDB && !showTaskClientList ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                  <span className="text-xs font-semibold text-emerald-800">{taskEmpresaName}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedTaskClientIdDB(''); setTaskEmpresaName(''); setShowTaskClientList(true); setSearchTaskClientDBQuery(''); }}
                    className="text-[11px] font-medium text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Buscar cliente en BD por RUC o Nombre (ej: Sechura, Norandino, IPESA)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-normal text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={searchTaskClientDBQuery}
                    onChange={(e) => { setSearchTaskClientDBQuery(e.target.value); setShowTaskClientList(true); }}
                  />

                  <div className="bg-white border border-slate-200 rounded-xl max-h-36 overflow-y-auto p-1.5 space-y-1">
                    {registeredClientsListTaskDB.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedTaskClientIdDB(c.id);
                          setTaskEmpresaName(c.empresa);
                          setShowTaskClientList(false);
                          setSearchTaskClientDBQuery('');
                          toast.info(`Cliente "${c.empresa}" seleccionado`);
                        }}
                        className="p-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-between hover:bg-emerald-50 text-slate-700"
                      >
                        <span>{c.empresa} {c.tarifa ? `[${c.tarifa}]` : ''}</span>
                        <span className="text-[10px] opacity-80 font-normal">Asesor: {c.asignadoA || 'Valentina'}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="pt-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">O Escribe el Nombre de la Empresa / Cliente *</label>
                <input
                  type="text"
                  placeholder="Ej: Hielos y Congelados Sechura"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={taskEmpresaName}
                  onChange={(e) => setTaskEmpresaName(e.target.value)}
                />
              </div>
              <div className="pt-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Nombre del Proyecto (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Instalación de Sistema Frigorífico"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={taskProyectoName}
                  onChange={(e) => setTaskProyectoName(e.target.value)}
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

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Observación (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: A la espera de respuesta del cliente..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                value={newActividadInmediata}
                onChange={(e) => setNewActividadInmediata(e.target.value)}
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

      {/* SECCIÓN 1: CONTENEDOR DE TAREAS ESTRATÉGICAS Y ACTIVIDADES (EXACTO TIPOGRAFÍA CARTERA) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-emerald-600" />
              Tablero de Tareas Asignadas y Actividades
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


                      <div 
                        className="space-y-1.5 cursor-pointer flex-1"
                        onClick={() => setExpandedTareaId(isExpanded ? null : tarea.id)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center border border-slate-200">
                            {(taskPage - 1) * taskLimit + idx + 1}
                          </span>
                          {(() => {
                            const parts = tarea.empresa.split(' - ');
                            const cliente = parts[0];
                            const proyecto = parts.slice(1).join(' - ');
                            return (
                              <div className="flex flex-col">
                                <h4 className={`text-sm font-semibold text-slate-900 hover:text-emerald-600 transition-colors ${isFinalized ? 'line-through text-slate-400' : ''}`}>
                                  {cliente}
                                </h4>
                                {proyecto && (
                                  <span className={`text-xs font-medium text-slate-600 mt-0.5 ${isFinalized ? 'line-through text-slate-400' : ''}`}>
                                    Proyecto: <strong className="text-slate-800">{proyecto}</strong>
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                          <div className="flex gap-2 items-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase border border-slate-200">
                              {tarea.etapaProceso}
                            </span>
                            {getStatusBadge(tarea.estado)}
                          </div>
                        </div>

                        {tarea.actividadInmediata && tarea.actividadInmediata.trim() !== '' && (
                          <p className="text-xs font-semibold text-slate-800">
                            Observación: <span className="font-normal text-slate-600">{tarea.actividadInmediata}</span>
                          </p>
                        )}


                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100 justify-between lg:justify-end flex-wrap">
                      <div className="text-left lg:text-right">
                        <p className="text-xs text-slate-500 font-medium">
                          Responsable: <strong className="text-slate-900 font-semibold uppercase">{tarea.responsable}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Botón EDITAR */}
                        {!isFinalized && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(tarea);
                            }}
                            className="flex items-center gap-1 text-xs text-indigo-700 font-medium bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
                            title="Editar tarea"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                        )}

                        {/* Botón ELIMINAR con confirmación */}
                        {confirmDeleteId === tarea.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(tarea.id);
                              }}
                              className="flex items-center gap-1 text-xs text-white font-medium bg-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-500 transition-colors"
                            >
                              Sí, Eliminar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="flex items-center gap-1 text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(tarea.id);
                            }}
                            className="flex items-center gap-1 text-xs text-rose-700 font-medium bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedTareaId(isExpanded ? null : tarea.id)}
                          className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 shrink-0 hover:bg-emerald-100 transition-colors"
                        >
                          <span>{tarea.subtareas.length} Actividad(es)</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DESPLIEGUE DE SUBTAREAS */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">

                      {/* FORMULARIO DE EDICIÓN INLINE */}
                      {editingTaskId === tarea.id && (
                        <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 uppercase pb-2 border-b border-indigo-200">
                            <Edit className="w-4 h-4 text-indigo-600" />
                            Editando Tarea: {tarea.empresa}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Empresa *</label>
                              <input
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={editEmpresa}
                                onChange={(e) => setEditEmpresa(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Etapa del Proceso</label>
                              <input
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={editEtapaProceso}
                                onChange={(e) => setEditEtapaProceso(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Responsable</label>
                              <select
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={editResponsable}
                                onChange={(e) => setEditResponsable(e.target.value)}
                              >
                                <option value="Steven">Steven</option>
                                <option value="Mario">Mario</option>
                                <option value="Javier">Javier</option>
                                <option value="Valentina">Valentina</option>
                                <option value="Ariana">Ariana</option>
                                <option value="Brenda">Brenda</option>
                                <option value="Angie">Angie</option>
                                <option value="Mellani">Mellani</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Observación (Opcional)</label>
                              <input
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={editActividadInmediata}
                                onChange={(e) => setEditActividadInmediata(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fecha Compromiso</label>
                              <input
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={editFechaCompromiso}
                                onChange={(e) => setEditFechaCompromiso(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estado</label>
                              <select
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={editEstado}
                                onChange={(e) => setEditEstado(e.target.value as EstadoTareaEstricto)}
                              >
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="EN_PROCESO">En Proceso</option>
                                <option value="RETRASADA">Retrasada</option>
                                <option value="FINALIZADA">Finalizada</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t border-indigo-200">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="rounded-lg text-xs font-medium"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleSaveEdit(tarea.id)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
                            >
                              Guardar Cambios
                            </Button>
                          </div>
                        </div>
                      )}

                      {!isFinalized && editingTaskId !== tarea.id && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            + Agregar Actividad / Avance Diario
                          </label>
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <input
                              type="text"
                              placeholder="Fecha (ej: 03/08/2026)"
                              className="w-full sm:w-36 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800"
                              value={nuevaSubtareaFecha[tarea.id] || (() => { const n = new Date(); return `${String(n.getDate()).padStart(2,'0')}/${String(n.getMonth()+1).padStart(2,'0')}/${n.getFullYear()}`; })()}
                              onChange={(e) => setNuevaSubtareaFecha({ ...nuevaSubtareaFecha, [tarea.id]: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="Escribe la actividad / avance (ej: 11:10AM A LA ESPERA DE LAS FACTIBILIDADES...)"
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
                              <Plus className="w-3.5 h-3.5 mr-1" /> Agregar Actividad
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Historial de Actividades ({tarea.subtareas.length})
                        </h5>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 mt-2">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                              <tr>
                                <th className="w-10 px-2 py-3 border-b border-slate-200 text-center"></th>
                                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Fecha de Actividad</th>
                                <th className="px-4 py-3 border-b border-slate-200 min-w-[200px]">Actividad</th>
                                <th className="px-4 py-3 border-b border-slate-200">Responsable</th>
                                <th className="px-4 py-3 border-b border-slate-200">¿Se culminó?</th>
                                <th className="px-4 py-3 border-b border-slate-200 text-center">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {[...tarea.subtareas].reverse().map((sub) => (
                                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                                  {editingSubtaskId === sub.id ? (
                                    <>
                                      <td className="px-2 py-2 align-top text-center"></td>
                                      <td className="px-3 py-2 align-top">
                                        <input
                                          type="text"
                                          className="w-full bg-white border border-indigo-200 rounded-md px-2 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-400"
                                          value={editSubtaskFecha}
                                          onChange={(e) => setEditSubtaskFecha(e.target.value)}
                                        />
                                      </td>
                                      <td className="px-3 py-2 align-top">
                                        <textarea
                                          className="w-full bg-white border border-indigo-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 min-h-[40px] resize-y"
                                          value={editSubtaskText}
                                          onChange={(e) => setEditSubtaskText(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault();
                                              handleSaveEditSubtask(tarea.id, sub.id);
                                            }
                                          }}
                                        />
                                      </td>
                                      <td className="px-4 py-3 align-top font-semibold text-slate-600 uppercase">
                                        {tarea.responsable}
                                      </td>
                                      <td className="px-4 py-3 align-top"></td>
                                      <td className="px-3 py-2 align-top text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                          <button onClick={() => handleSaveEditSubtask(tarea.id, sub.id)} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md font-medium transition-colors w-full justify-center">
                                            <Save className="w-3.5 h-3.5" /> Guardar
                                          </button>
                                          <button onClick={() => setEditingSubtaskId(null)} className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-md font-medium transition-colors w-full justify-center">
                                            <X className="w-3.5 h-3.5" /> Cancelar
                                          </button>
                                        </div>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-2 py-3 align-top text-center">
                                        <button
                                          onClick={() => toggleSubtaskCompletion(tarea.id, sub.id)}
                                          className={`transition-colors shrink-0 ${
                                            sub.completada ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'
                                          }`}
                                        >
                                          {sub.completada ? (
                                            <CheckSquare className="w-5 h-5" />
                                          ) : (
                                            <Square className="w-5 h-5" />
                                          )}
                                        </button>
                                      </td>
                                      <td className="px-4 py-3 font-mono font-medium text-slate-700 whitespace-nowrap align-top">
                                        <div className="flex items-center gap-1.5">
                                          <CalendarIcon className={`w-4 h-4 ${!sub.completada && isSubtaskPastDue(sub.fecha) ? 'text-rose-500' : 'text-emerald-500'}`} />
                                          <span className={!sub.completada && isSubtaskPastDue(sub.fecha) ? 'text-rose-600 font-bold' : ''}>{sub.fecha}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 align-top">
                                        <p className={`font-medium leading-relaxed ${sub.completada ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                                          {sub.texto}
                                        </p>
                                      </td>
                                      <td className="px-4 py-3 align-top font-semibold text-slate-600 uppercase whitespace-nowrap">
                                        {tarea.responsable}
                                      </td>
                                      <td className="px-4 py-3 align-top whitespace-nowrap">
                                        <select
                                          value={sub.estadoStr || (sub.completada ? 'SI' : 'EN_PROCESO')}
                                          onChange={(e) => handleSubtaskEstadoChange(tarea.id, sub.id, e.target.value as 'SI' | 'NO' | 'EN_PROCESO')}
                                          className={`bg-white border rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                                            (sub.estadoStr === 'SI' || sub.completada) ? 'border-emerald-200 text-emerald-700' : 
                                            sub.estadoStr === 'NO' ? 'border-rose-200 text-rose-700' : 
                                            'border-amber-200 text-amber-600'
                                          }`}
                                        >
                                          <option value="SI">Sí</option>
                                          <option value="EN_PROCESO">En proceso</option>
                                          <option value="NO">No</option>
                                        </select>
                                      </td>
                                      <td className="px-4 py-3 align-top text-center">
                                        <div className="flex flex-col items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                            onClick={() => handleStartEditSubtask(sub.id, sub.fecha, sub.texto)} 
                                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" /> Editar
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteSubtask(tarea.id, sub.id)} 
                                            className="flex items-center gap-1 text-rose-600 hover:text-rose-800 font-medium transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                          </button>
                                        </div>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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

      {/* MODAL SECCIÓN 2: CLIENTES GANADOS Y FIDELIZADOS */}
      {showFidelizadosModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 p-5 bg-slate-50/80">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-indigo-600" />
                  Seguimiento a Clientes Ganados y Fidelizados ({clientesFidelizados.length} Cuentas Ganadas)
                </h2>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Exclusivo para clientes en estado Ganado / Cartera Fidelizada — Observaciones con Fecha
                </p>
              </div>
              <button onClick={() => setShowFidelizadosModal(false)} className="text-slate-400 hover:bg-slate-200 p-1.5 rounded-lg transition-colors self-start lg:self-auto border border-slate-200 bg-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3">

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente ganado (ej: IPESA, IMP)..."
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
              {showAddFidelizadoModal ? 'Cerrar' : '+ Seleccionar Cliente Ganado'}
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
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Buscar y Seleccionar Cliente Ganado *</label>
                <div className="space-y-1.5 mt-1">
                  {selectedClientIdDB && !showObsClientList ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                      <span className="text-xs font-semibold text-emerald-800">{clients.find(c => String(c.id) === String(selectedClientIdDB))?.empresa || 'Cliente seleccionado'}</span>
                      <button
                        type="button"
                        onClick={() => { setSelectedClientIdDB(''); setShowObsClientList(true); setSearchDBClientQuery(''); }}
                        className="text-[11px] font-medium text-slate-500 hover:text-rose-600 transition-colors"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Filtrar por nombre de empresa ganada (ej: IPESA, IMP, Norandino)..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={searchDBClientQuery}
                        onChange={(e) => { setSearchDBClientQuery(e.target.value); setShowObsClientList(true); }}
                      />
                      <div className="bg-white border border-slate-200 rounded-xl max-h-36 overflow-y-auto p-1.5 space-y-1">
                        {registeredClientsListDB.map(c => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedClientIdDB(c.id);
                              setShowObsClientList(false);
                              setSearchDBClientQuery('');
                              toast.info(`Cliente "${c.empresa}" seleccionado`);
                            }}
                            className="p-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-between hover:bg-emerald-50 text-slate-700"
                          >
                            <span>{c.empresa} {c.tarifa ? `[${c.tarifa}]` : ''}</span>
                            <span className="text-[10px] opacity-80 font-normal">Asesor: {c.asignadoA || 'Valentina'}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fecha de la Observación</label>
                  <input
                    type="text"
                    placeholder={(() => { const n = new Date(); return `${String(n.getDate()).padStart(2,'0')}/${String(n.getMonth()+1).padStart(2,'0')}/${n.getFullYear()}`; })()}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                    value={fidelizadoObsFecha}
                    onChange={(e) => setFidelizadoObsFecha(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Vacío = fecha y hora actual</span>
                </div>
                <div className="sm:col-span-3">
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

        {/* LISTA DE CLIENTES GANADOS CON OBSERVACIONES Y FECHAS */}
        <div className="space-y-3">
          {clientesFidelizados.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <HeartHandshake className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-700">No hay clientes en estado "Ganado" para este filtro de asesor.</p>
              <p className="text-xs text-slate-500 mt-1">Los clientes deben estar marcados como Ganados en la Cartera para aparecer en este apartado.</p>
            </div>
          ) : (
            clientesFidelizados.slice(0, obsVisibleLimit).map((c, idx) => {
              const interacciones = c.historialInteracciones || (c as any).interacciones || [];
              const isExpanded = expandedClient === c.id;

              const obsList: ObsEntry[] = [];

              if (c.observaciones) {
                const dateFromClient = c.ultimoContacto || c.fechaCreacion || new Date().toLocaleDateString('es-PE');
                obsList.push({ texto: c.observaciones, fecha: dateFromClient });
              }

              interacciones.forEach((i: any) => {
                const obs = i.observaciones || i.comentario || i.notas;
                if (obs && !obsList.some(o => o.texto === obs)) {
                  const dateFromInt = i.fecha ? new Date(i.fecha).toLocaleDateString('es-PE') : new Date().toLocaleDateString('es-PE');
                  obsList.push({ texto: obs, fecha: dateFromInt });
                }
              });

              const extraLocal = localExtraObs[c.id] || [];
              extraLocal.forEach(obsObj => {
                if (!obsList.some(o => o.texto === obsObj.texto)) {
                  obsList.push(obsObj);
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
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 hover:text-emerald-600 transition-colors">{c.empresa}</h4>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                            Cliente Ganado
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-normal flex items-center gap-2 mt-0.5">
                          <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono text-[10px] uppercase font-semibold">{c.tarifa || 'MT3'}</span>
                          <span>• Asesor: <strong className="text-slate-700 font-semibold">{c.asignadoA}</strong></span>
                          <span className="text-emerald-600 font-semibold">• {obsList.length} Observación(es) con fecha</span>
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
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          placeholder={(() => { const n = new Date(); return `${String(n.getDate()).padStart(2,'0')}/${String(n.getMonth()+1).padStart(2,'0')}/${n.getFullYear()}`; })()}
                          className="w-full sm:w-36 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={nuevaObsFecha[c.id] || ''}
                          onChange={(e) => setNuevaObsFecha({ ...nuevaObsFecha, [c.id]: e.target.value })}
                          title="Fecha de la observación (vacío = hoy con hora actual)"
                        />
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
                          obsList.slice(0, 10).map((obsItem, obsIdx) => (
                            <div key={obsIdx} className="flex items-start gap-2.5 text-xs bg-white p-3 rounded-xl border border-slate-200/80">
                              <span className="font-semibold text-emerald-800 shrink-0 uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3 text-emerald-600" />
                                {obsItem.fecha}
                              </span>
                              <div className="flex-1">
                                <span className="font-semibold text-slate-800 text-[11px] block mb-0.5">
                                  OBSERVACIÓN {obsIdx + 1}:
                                </span>
                                <p className="text-slate-700 font-normal leading-relaxed">
                                  {obsItem.texto}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {clientesFidelizados.length > obsVisibleLimit && (
            <Button
              variant="outline"
              onClick={() => setObsVisibleLimit(prev => prev + 10)}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-xs mt-2"
            >
              Cargar 10 clientes ganados más ({clientesFidelizados.length - obsVisibleLimit} restantes) <ChevronRight className="w-4 h-4" />
            </Button>
          )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
