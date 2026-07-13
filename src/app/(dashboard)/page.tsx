"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { KPIStats } from "@/components/dashboard/kpi-stats";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Briefcase, 
  ClipboardList, 
  FileCheck, 
  Truck, 
  Flame,
  MapPin,
  PhoneCall,
  FileText,
  TrendingUp,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  Users,
  Target,
  ArrowUpRight,
  Activity,
  Layers,
  Inbox,
  Trophy,
  DollarSign,
  Calculator,
  TrendingDown
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, getPeruDateString } from "@/lib/utils";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { api } from "@/lib/api";

import { useOperacionesStore } from "@/store/operaciones-store";
import { useCRMStore } from "@/store/crm-store";
import { useAuthStore } from "@/store/auth-store";
import { useLogisticaStore } from "@/store/logistica-store";
import { useDocumentalStore } from "@/store/documental-store";
import { useNotificationStore } from "@/store/notification-store";
import { useFinanzasStore } from "@/store/finanzas-store";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const parseSafeDate = (dateVal: any): Date | null => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal;
  
  let str = String(dateVal).trim();
  if (!str) return null;

  // Check if it's a simple YYYY-MM-DD string without time
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    str = `${str}T00:00:00`;
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    // Handle DD/MM/YYYY format
    const parts = str.split('/');
    str = `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`;
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    // Handle DD-MM-YYYY format
    const parts = str.split('-');
    str = `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`;
  }

  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d;
};

const getCloseDate = (c: any) => {
  const interacciones = c.historialInteracciones || c.interacciones || [];
  if (interacciones.length > 0) {
    const wonInt = interacciones.find((i: any) => 
      i.accion === 'Cotización Ganada' || 
      i.tipo === 'Venta' ||
      (i.observaciones && i.observaciones.toLowerCase().includes('ha pasado a etapa "ganado"'))
    );
    if (wonInt) return wonInt.fecha || wonInt.createdAt;
  }
  return c.fechaCreacion || c.createdAt;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    proyectos, 
    fetchProyectos, 
    fetchResponsables, 
    getTimelineEvents,
    getValidaciones,
  } = useOperacionesStore();
  
  const { 
    clients, 
    quotes,
    fetchClients,
    fetchQuotes
  } = useCRMStore();

  const {
    ordenes,
    insumos,
    personal,
    proveedores,
    fetchOrdenes,
    fetchInsumos,
    fetchPersonal,
    fetchProveedores
  } = useLogisticaStore();

  const {
    documentos,
  } = useDocumentalStore();

  const { fetchUnreadCount } = useNotificationStore();
  const { globalKPIs, fetchGlobalKPIs } = useFinanzasStore();

  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [dateRangeType, setDateRangeType] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [cierresModalOpen, setCierresModalOpen] = useState(false);
  const [cierresList, setCierresList] = useState<any[]>([]);
  const [contactosModalOpen, setContactosModalOpen] = useState(false);
  const [contactosList, setContactosList] = useState<any[]>([]);
  const [prospectosModalOpen, setProspectosModalOpen] = useState(false);
  const [prospectosList, setProspectosList] = useState<any[]>([]);
  const [visitasModalOpen, setVisitasModalOpen] = useState(false);
  const [visitasList, setVisitasList] = useState<any[]>([]);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const data = await api.get("/config/usuarios/online");
      setOnlineUsers(data || []);
    } catch (error) {
      console.error("Error fetching online users:", error);
    }
  }, []);

  useEffect(() => {
    const checkAccessAndLoad = async () => {
      if (!user) {
        router.replace("/login");
        return;
      }

      const userModules = user.modulos || [];
      const hasDashboardAccess = user.rol === "ADMIN" || userModules.includes("dashboard");

      if (!hasDashboardAccess) {
        setAccessDenied(true);
        // Redirigir al primer módulo disponible
        if (userModules.includes("crm")) {
          router.replace("/crm/cartera");
        } else if (userModules.includes("operaciones")) {
          router.replace("/operaciones/proyectos");
        } else if (userModules.includes("logistica")) {
          router.replace("/logistica/ordenes");
        } else if (userModules.includes("finanzas")) {
          router.replace("/finanzas/bandeja");
        } else {
          // Fallback
          router.replace("/perfil"); 
        }
        return; 
      }

      // Cargar datos asíncronamente para que el dashboard no se quede congelado
      setLoading(false);
      
      Promise.allSettled([
        fetchProyectos(1, 1000), 
        fetchResponsables(),
        fetchClients(1, 1000),
        fetchQuotes(1, 1000),
        fetchOrdenes(1, 1000),
        fetchInsumos(1, 1000),
        fetchPersonal(1, 1000),
        fetchProveedores(),
        fetchUnreadCount(),
        fetchOnlineUsers(),
        fetchGlobalKPIs(),
        api.get('/finanzas/facturas'),
        api.get('/finanzas/gastos?limit=1000')
      ]).then(results => {
        const facturasResult = results[11];
        if (facturasResult && facturasResult.status === 'fulfilled') {
          const data = facturasResult.value;
          setFacturas(Array.isArray(data) ? data : (data?.data || []));
        }

        const gastosResult = results[12];
        if (gastosResult && gastosResult.status === 'fulfilled') {
          const data = gastosResult.value;
          setGastos(Array.isArray(data) ? data : (data?.data || []));
        }
      }).catch(error => {
        console.error("Error durante la carga del dashboard:", error);
      });
    };

    checkAccessAndLoad();

    // Poll online users every 30 seconds
    let interval: NodeJS.Timeout;
    if (!accessDenied) {
      interval = setInterval(fetchOnlineUsers, 30000);
    }
    return () => clearInterval(interval);
  }, [user, fetchProyectos, fetchResponsables, fetchClients, fetchQuotes, fetchOrdenes, fetchInsumos, fetchPersonal, fetchProveedores, fetchUnreadCount, fetchOnlineUsers, fetchGlobalKPIs, router, accessDenied]);

  // Áreas Operativas
  const areas = [
    { id: 'Logística y Recursos', name: 'Steven', color: 'bg-blue-500', role: 'Logística', icon: Truck },
    { id: 'Ingeniería y Supervisión Técnica', name: 'Diego', color: 'bg-purple-500', role: 'Ingeniería', icon: Briefcase },
    { id: 'Gestión Documentaria y Expedientes Técnicos', name: 'Guillermo', color: 'bg-green-500', role: 'Documentación', icon: FileCheck },
    { id: 'Operaciones de Campo y Control de Obra', name: 'Mario', color: 'bg-yellow-500', role: 'Campo', icon: ClipboardList },
  ];

  // Equipo Comercial
  const sellers = [
    { name: 'Angie', color: 'bg-blue-600', role: 'Asesora' },
    { name: 'Valentina', color: 'bg-violet-600', role: 'Asesora' },
    { name: 'Ariana', color: 'bg-orange-600', role: 'Asesora' },
  ];

  const today = new Date();
  const dayName = today.toLocaleDateString('es-ES', { weekday: 'long' });
  const isReviewDay = dayName.toLowerCase().includes('martes') || dayName.toLowerCase().includes('jueves');
  const currentReviewDay = dayName.charAt(0).toUpperCase() + dayName.slice(1).split(',')[0];

  // Calcular filtros de fecha
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (dateRangeType === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    if (dateRangeType === "yesterday") {
      const start = new Date();
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    if (dateRangeType === "week") {
      const start = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    if (dateRangeType === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { startDate: start, endDate: end };
    }
    if (dateRangeType === "30days") {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      start.setHours(0,0,0,0);
      return { startDate: start, endDate: now };
    }
    if (dateRangeType === "year") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { startDate: start, endDate: end };
    }
    if (dateRangeType === "custom" && customStartDate) {
      const start = new Date(`${customStartDate}T00:00:00`);
      const end = customEndDate ? new Date(`${customEndDate}T23:59:59`) : now;
      return { startDate: start, endDate: end };
    }
    return { startDate: null, endDate: null };
  }, [dateRangeType, customStartDate, customEndDate]);

  // Aplicar filtros en memoria localmente
  const filteredClients = useMemo(() => {
    if (!startDate && !endDate) return clients;
    return clients.filter((c: any) => {
      const d = parseSafeDate(c.fechaCreacion);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [clients, startDate, endDate]);

  const filteredProyectos = useMemo(() => {
    if (!startDate && !endDate) return proyectos;
    return proyectos.filter((p: any) => {
      const d = parseSafeDate(p.fechaInicio);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [proyectos, startDate, endDate]);

  const filteredOrdenes = useMemo(() => {
    if (!startDate && !endDate) return ordenes;
    return ordenes.filter((o: any) => {
      const d = parseSafeDate(o.fechaEmision);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [ordenes, startDate, endDate]);

  const filteredQuotes = useMemo(() => {
    if (!startDate && !endDate) return quotes;
    return quotes.filter((q: any) => {
      const dateStr = q.fechaCreacion || q.fecha;
      const d = parseSafeDate(dateStr);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [quotes, startDate, endDate]);

  const totalMontoCotizado = useMemo(() => {
    return filteredQuotes.reduce((acc: number, q: any) => acc + Number(q.monto || 0), 0);
  }, [filteredQuotes]);

  const totalMontoCompras = useMemo(() => {
    return filteredOrdenes.reduce((acc: number, o: any) => acc + Number(o.montoTotal || 0), 0);
  }, [filteredOrdenes]);

  const proyectosPorEstado = useMemo(() => {
    return {
      ejecucion: filteredProyectos.filter((p: any) => p.estado === 'En Ejecución' || p.estado === 'EnEjecucion').length,
      planificacion: filteredProyectos.filter((p: any) => p.estado === 'Planificación' || p.estado === 'Planificacion').length,
      detenidos: filteredProyectos.filter((p: any) => p.estado === 'Detenido').length,
      finalizados: filteredProyectos.filter((p: any) => p.estado === 'Finalizado').length,
      rojos: filteredProyectos.filter((p: any) => p.semaforo === 'Rojo').length,
      amarillos: filteredProyectos.filter((p: any) => p.semaforo === 'Amarillo').length,
      verdes: filteredProyectos.filter((p: any) => p.semaforo === 'Verde').length,
    };
  }, [filteredProyectos]);

  const avancePromedioProyectos = useMemo(() => {
    if (filteredProyectos.length === 0) return 0;
    const sum = filteredProyectos.reduce((acc: number, p: any) => acc + (p.avance || p.avanceCalculado || 0), 0);
    return Math.round(sum / filteredProyectos.length);
  }, [filteredProyectos]);

  const comercialStats = useMemo(() => {
    const isInRange = (dateStr: string) => {
      const d = parseSafeDate(dateStr);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };

    return {
      totalLeads: filteredClients.length,
      ganados: clients.filter((c: any) => ['Ganado', 'Orden de Servicio'].includes(c.etapaComercial) && isInRange(getCloseDate(c))).length,
      perdidos: clients.filter((c: any) => c.etapaComercial === 'Perdido' && isInRange(c.fechaActualizacion || c.updatedAt || c.fechaCreacion || c.createdAt)).length,
      enNegociacion: filteredClients.filter((c: any) => ['Negociación', 'Cotización Enviada', 'Seguimiento'].includes(c.etapaComercial)).length,
      contactados: filteredClients.filter((c: any) => ['Prospecto', 'Contactado', 'Llamada Realizada', 'Visita Agendada', 'Inspección Realizada'].includes(c.etapaComercial)).length,
    };
  }, [filteredClients, clients, startDate, endDate]);

  const filteredDocumentos = useMemo(() => {
    if (!startDate && !endDate) return documentos;
    return documentos.filter((d: any) => {
      const date = parseSafeDate(d.fechaCreacion);
      if (!date) return false;
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    });
  }, [documentos, startDate, endDate]);

  const kpis = useMemo(() => {
    return {
      proyectos: {
        total: filteredProyectos.length,
        activos: filteredProyectos.filter((p: any) => p.estado === 'En Ejecución').length,
        rojos: filteredProyectos.filter((p: any) => p.semaforo === 'Rojo').length
      },
      actividades: {
        vencidas: filteredProyectos.reduce((acc: any, p: any) => acc + (p.actividades?.filter((a: any) => {
          if (!a.fechaVencimiento || a.estado === 'Completada' || a.estado === 'Validada') return false;
          return new Date(a.fechaVencimiento) < new Date();
        }).length || 0), 0)
      },
      crm: {
        totalHoy: filteredClients.filter((c: any) => {
          if (!c.proximoSeguimiento) return false;
          const fs = c.proximoSeguimiento.split('T')[0];
          const hoy = getPeruDateString();
          return fs === hoy && !['Ganado', 'Orden de Servicio', 'Perdido'].includes(c.etapaComercial);
        }).length,
        vencidos: filteredClients.filter((c: any) => {
          if (!c.proximoSeguimiento || ['Ganado', 'Orden de Servicio', 'Perdido'].includes(c.etapaComercial)) return false;
          const fs = new Date(c.proximoSeguimiento.split('T')[0]);
          const hoy = new Date();
          hoy.setHours(0,0,0,0);
          return fs < hoy;
        }).length
      },
      logistica: {
        ordenesPendientes: filteredOrdenes.filter((o: any) => o.estado === 'PENDIENTE').length,
        stockBajo: insumos.filter((i: any) => i.stockActual <= i.stockMinimo).length
      },
      documental: {
        pendientesRevision: filteredDocumentos.filter((d: any) => d.estado === 'Pendiente Revisión').length
      }
    };
  }, [filteredClients, filteredProyectos, filteredOrdenes, filteredDocumentos, insumos]);

  const timelineOperativo = useMemo(() => {
    let list = getTimelineEvents();
    if (startDate || endDate) {
      list = list.filter(e => {
        const d = parseSafeDate(e.fecha);
        if (!d) return false;
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });
    }
    return list.slice(0, 5).map(e => ({
      id: e.id,
      descripcion: e.actividadDescripcion || e.campo,
      proyecto: { codigo: e.proyectoCodigo, nombre: e.proyectoNombre },
      fecha: e.fecha,
      usuario: e.usuario
    }));
  }, [getTimelineEvents, startDate, endDate]);

  const proximosSeguimientos = useMemo(() => {
    let list = clients.filter(c => c.proximoSeguimiento && !['Ganado', 'Orden de Servicio', 'Perdido'].includes(c.etapaComercial));
    if (startDate || endDate) {
      list = list.filter(c => {
        const d = parseSafeDate(c.proximoSeguimiento);
        if (!d) return false;
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });
    }
    return list
      .sort((a, b) => new Date(a.proximoSeguimiento).getTime() - new Date(b.proximoSeguimiento).getTime());
  }, [clients, startDate, endDate]);

  const distribucionPorArea = useMemo(() => {
    return areas.reduce((acc, area) => {
      acc[area.name] = filteredProyectos.filter(p => p.area === area.id).length;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredProyectos]);

  const vendedorStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const getRealCreator = (c: any) => {
      if (c.creadoPor) return c.creadoPor;
      const interacciones = c.historialInteracciones || c.interacciones || [];
      if (interacciones.length > 0) {
        const sorted = [...interacciones].sort((a: any, b: any) => new Date(a.fecha || a.createdAt).getTime() - new Date(b.fecha || b.createdAt).getTime());
        if (sorted[0]?.usuario) return sorted[0].usuario;
      }
      return c.asignadoA;
    };

    return sellers.reduce((acc, s) => {
      // Para métricas de prospectos captados (prospectadosEstaSemana, totalProspectos), se debe respetar a quien lo originó.
      // Para cartera activa (totalClientes, totalLeads), se respeta a quien lo tiene asignadoActualmente.
      const sellerClientsFilteredByCreator = filteredClients.filter(c => getRealCreator(c)?.toLowerCase().includes(s.name.toLowerCase().trim()));
      const sellerClientsAllByCreator = clients.filter(c => getRealCreator(c)?.toLowerCase().includes(s.name.toLowerCase().trim()));

      const sellerClientsAll = clients.filter(c => c.asignadoA === s.name);
      const sellerClientsFiltered = filteredClients.filter(c => c.asignadoA === s.name);

      const totalClientes = sellerClientsFiltered.filter(c => ['Ganado', 'Orden de Servicio'].includes(c.etapaComercial)).length;

      // Un prospecto "ganado" a un vendedor cuenta a quien lo prospectó
      const totalProspectos = sellerClientsFilteredByCreator.filter(c => !['Ganado', 'Orden de Servicio', 'Perdido'].includes(c.etapaComercial)).length;

      const prospectadosEstaSemana = sellerClientsAllByCreator.filter(c => {
        const d = parseSafeDate(c.fechaCreacion);
        if (!d) return false;
        return d >= startOfWeek && d <= endOfWeek;
      }).length;

      acc[s.name] = {
        totalClientes,
        totalProspectos,
        prospectadosEstaSemana,
        totalLeads: sellerClientsFiltered.length
      };
      return acc;
    }, {} as Record<string, { totalClientes: number; totalProspectos: number; prospectadosEstaSemana: number; totalLeads: number }>);
  }, [clients, filteredClients, sellers]);

  const { diasSinIngresos, diasSinEgresos, fechaUltimoIngreso, fechaUltimoEgreso } = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const facturasConIngreso = facturas.filter((f: any) => f.estado === 'PAGADA' || f.estado === 'PAGO_PARCIAL' || (f.montoTotal - f.saldoPendiente) > 0);
    
    let lastIncomeDate: Date | null = null;
    facturasConIngreso.forEach((f: any) => {
      const d = parseSafeDate(f.updatedAt || f.createdAt || f.fechaEmision);
      if (d) {
        if (!lastIncomeDate || d > lastIncomeDate) {
          lastIncomeDate = d;
        }
      }
    });

    const gastosPagados = gastos.filter((g: any) => g.estado === 'PAGADO');
    let lastExpenseDate: Date | null = null;
    gastosPagados.forEach((g: any) => {
      const d = parseSafeDate(g.fechaPago || g.fechaEmision || g.createdAt);
      if (d) {
        if (!lastExpenseDate || d > lastExpenseDate) {
          lastExpenseDate = d;
        }
      }
    });

    const getDaysBetween = (d1: Date | null, d2: Date) => {
      if (!d1) return null;
      const d1Copy = new Date(d1);
      d1Copy.setHours(0,0,0,0);
      const diffTime = Math.abs(d2.getTime() - d1Copy.getTime());
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    const diffIngresos = getDaysBetween(lastIncomeDate, today);
    const diffEgresos = getDaysBetween(lastExpenseDate, today);

    return {
      diasSinIngresos: diffIngresos,
      diasSinEgresos: diffEgresos,
      fechaUltimoIngreso: lastIncomeDate ? (lastIncomeDate as Date).toLocaleDateString('es-PE') : null,
      fechaUltimoEgreso: lastExpenseDate ? (lastExpenseDate as Date).toLocaleDateString('es-PE') : null,
    };
  }, [facturas, gastos]);

  const recentWins = useMemo(() => {
    return [...filteredClients].filter(c => ['Ganado', 'Orden de Servicio', 'Cotización Enviada', 'Cotizacion Enviada', 'Inspección Realizada', 'Inspeccion Realizada'].includes(c.etapaComercial) || c.estado === 'Ganado').slice(0, 1);
  }, [filteredClients]);

  const filteredFacturas = useMemo(() => {
    if (!startDate && !endDate) return facturas;
    return facturas.filter((f: any) => {
      const d = parseSafeDate(f.fechaEmision);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [facturas, startDate, endDate]);

  const filteredGastos = useMemo(() => {
    if (!startDate && !endDate) return gastos;
    return gastos.filter((g: any) => {
      const d = parseSafeDate(g.fechaEmision || g.createdAt);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [gastos, startDate, endDate]);

  const { igvVentas, igvCompras } = useMemo(() => {
    const ventas = filteredFacturas.filter((f: any) => f.estado !== 'ANULADA').reduce((acc: number, f: any) => acc + (Number(f.montoTotal || 0) / 1.18) * 0.18, 0);
    const compras = filteredGastos.filter((g: any) => g.estado !== 'ANULADA' && g.estado !== 'RECHAZADO' && g.tipoDocumento === 'FACTURA').reduce((acc: number, g: any) => acc + (Number(g.montoTotal || 0) / 1.18) * 0.18, 0);
    return { igvVentas: ventas, igvCompras: compras };
  }, [filteredFacturas, filteredGastos]);

  const filteredPersonal = useMemo(() => {
    if (!startDate && !endDate) return personal;
    return personal.filter((p: any) => {
      const d = parseSafeDate(p.createdAt || p.fechaInicio);
      if (!d) return false;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [personal, startDate, endDate]);

  const filteredValidaciones = useMemo(() => {
    let list = getValidaciones();
    if (startDate || endDate) {
      list = list.filter((v: any) => {
        const dateStr = v.fecha || v.createdAt || v.validacion?.fechaCreacion || v.validacion?.createdAt;
        const d = parseSafeDate(dateStr);
        if (!d) return false;
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });
    }
    return list;
  }, [getValidaciones, startDate, endDate]);

  const { facturadoCalculado, cobradoCalculado, porcentajeCobranzaCalculado } = useMemo(() => {
    const activeFacturas = filteredFacturas.filter((f: any) => f.estado !== 'ANULADA');
    const facturado = activeFacturas.reduce((acc: number, f: any) => acc + Number(f.montoTotal || 0), 0);
    const cobrado = activeFacturas.reduce((acc: number, f: any) => acc + (Number(f.montoTotal || 0) - Number(f.saldoPendiente || 0)), 0);
    const rawPct = facturado > 0 ? (cobrado / facturado) * 100 : 0;
    const pct = Math.min(rawPct, 100); // Nunca permitir más del 100%
    return {
      facturadoCalculado: facturado,
      cobradoCalculado: cobrado,
      porcentajeCobranzaCalculado: pct
    };
  }, [filteredFacturas]);

  const showCalculatedFinances = dateRangeType !== "all";
  const totalFacturado = showCalculatedFinances ? facturadoCalculado : ((globalKPIs as any)?.totalFacturado ?? 0);
  const totalCobrado = showCalculatedFinances ? cobradoCalculado : ((globalKPIs as any)?.totalCobrado ?? 0);
  const porcentajeCobranza = showCalculatedFinances ? porcentajeCobranzaCalculado : Math.min(((globalKPIs as any)?.porcentajeCobranza ?? 0), 100);

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 text-slate-500">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium animate-pulse">Redirigiendo a su área de trabajo...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-slate-100 rounded-full animate-pulse" />
          <div className="absolute w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800 uppercase tracking-[0.2em] mb-1">Cargando Inteligencia</p>
          <p className="text-xs text-muted-foreground font-medium animate-pulse uppercase tracking-widest">Sincronizando módulos de HH T Soluciona</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto px-4 md:px-6">
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-white p-5 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20 group hover:scale-105 transition-transform">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Panel de Control</h1>
              <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-600 font-bold py-0 px-1.5 text-[8px] h-4">LIVE</Badge>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> HH T Soluciona S.A.C.</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>Resumen Ejecutivo</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {isReviewDay && (
            <div className="bg-amber-50 border border-amber-100 text-amber-700 font-bold py-1.5 px-3 rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-right-4 duration-700">
              <Calendar className="w-3 h-3" />
              <div className="text-left">
                <p className="text-[9px] uppercase leading-none opacity-70 mb-0.5">Comité Comercial</p>
                <p className="text-[11px]">{currentReviewDay}</p>
              </div>
            </div>
          )}

          {recentWins.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold py-1.5 px-3 rounded-xl flex items-center gap-2 shadow-sm animate-in zoom-in-90 slide-in-from-bottom-2 duration-700 hover:scale-105 transition-transform cursor-default">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse shrink-0">
                <Trophy className="w-3 h-3 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-[9px] uppercase leading-none opacity-80 mb-0.5 tracking-widest text-emerald-600/80">¡Nuevo Logro!</p>
                <p className="text-[11px] uppercase tracking-tight truncate max-w-[150px]">{recentWins[0].empresa || (recentWins[0] as any).nombre}</p>
              </div>
            </div>
          )}



          <div className="bg-slate-50 border border-slate-100 text-slate-600 font-bold py-1.5 px-3 rounded-xl flex items-center gap-2 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="text-left">
              <p className="text-[9px] uppercase leading-none opacity-70 mb-0.5">Estado Global</p>
              <p className="text-[11px] uppercase">Activo</p>
            </div>
          </div>
        </div>

        {/* Decoración abstracta */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-slate-50 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Panel Principal */}
      <div className="w-full space-y-8">
        {/* Barra de Filtros de Fecha */}
        <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Período de Análisis:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Select value={dateRangeType} onValueChange={(val) => setDateRangeType(val || "all")}>
              <SelectTrigger className="w-[180px] h-9 text-xs font-bold border-slate-200">
                <SelectValue placeholder="Seleccionar Período">
                  {dateRangeType === "all" && "Todo el Historial"}
                  {dateRangeType === "today" && "Hoy"}
                  {dateRangeType === "yesterday" && "Ayer"}
                  {dateRangeType === "week" && "Esta Semana"}
                  {dateRangeType === "month" && "Este Mes"}
                  {dateRangeType === "30days" && "Últimos 30 Días"}
                  {dateRangeType === "year" && "Este Año"}
                  {dateRangeType === "custom" && "Rango Personalizado"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el Historial</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="yesterday">Ayer</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="30days">Últimos 30 Días</SelectItem>
                <SelectItem value="year">Este Año</SelectItem>
                <SelectItem value="custom">Rango Personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            {dateRangeType === "custom" && (
              <div className="flex items-center gap-2 animate-in fade-in duration-300">
                <input
                  type="date"
                  className="h-9 px-3 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
                <span className="text-xs font-bold text-slate-400">al</span>
                <input
                  type="date"
                  className="h-9 px-3 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* KPIs de Salud de la Empresa (Vital Signs) */}
        <KPIStats 
          clients={filteredClients} 
          proyectos={filteredProyectos}
          cotizacionesCount={filteredQuotes.length}
          proyectosActivosCount={undefined}
          totalFacturado={totalFacturado}
          totalCobrado={totalCobrado}
          porcentajeCobranza={porcentajeCobranza}
        />

        <Tabs defaultValue="general" className="w-full space-y-8 outline-none">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2">
            <TabsList className="bg-slate-100/80 p-1.5 flex h-auto gap-2 w-full md:w-auto overflow-x-auto no-scrollbar justify-start rounded-2xl border border-slate-200/60 shadow-inner">
              <TabsTrigger
                value="general"
                className="relative rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 data-[state=active]:bg-white data-active:bg-white data-[state=active]:text-indigo-700 data-active:text-indigo-700 data-[state=active]:shadow-sm data-active:shadow-sm transition-all gap-2 flex items-center cursor-pointer group border-transparent outline-none ring-0"
              >
                <div className="p-1.5 rounded-lg bg-white/50 group-hover:bg-white group-data-[state=active]:bg-indigo-50 text-slate-500 group-hover:text-slate-700 group-data-[state=active]:text-indigo-600 transition-all">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold tracking-tight">Visión Global</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="comercial"
                className="relative rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 data-[state=active]:bg-white data-active:bg-white data-[state=active]:text-indigo-700 data-active:text-indigo-700 data-[state=active]:shadow-sm data-active:shadow-sm transition-all gap-2 flex items-center cursor-pointer group border-transparent outline-none ring-0"
              >
                <div className="p-1.5 rounded-lg bg-white/50 group-hover:bg-white group-data-[state=active]:bg-indigo-50 text-slate-500 group-hover:text-slate-700 group-data-[state=active]:text-indigo-600 transition-all">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold tracking-tight">Comercial</span>
              </TabsTrigger>

              <TabsTrigger
                value="operaciones"
                className="relative rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 data-[state=active]:bg-white data-active:bg-white data-[state=active]:text-indigo-700 data-active:text-indigo-700 data-[state=active]:shadow-sm data-active:shadow-sm transition-all gap-2 flex items-center cursor-pointer group border-transparent outline-none ring-0"
              >
                <div className="p-1.5 rounded-lg bg-white/50 group-hover:bg-white group-data-[state=active]:bg-indigo-50 text-slate-500 group-hover:text-slate-700 group-data-[state=active]:text-indigo-600 transition-all">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold tracking-tight">Operaciones</span>
              </TabsTrigger>

              <TabsTrigger
                value="logistica"
                className="relative rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 data-[state=active]:bg-white data-active:bg-white data-[state=active]:text-indigo-700 data-active:text-indigo-700 data-[state=active]:shadow-sm data-active:shadow-sm transition-all gap-2 flex items-center cursor-pointer group border-transparent outline-none ring-0"
              >
                <div className="p-1.5 rounded-lg bg-white/50 group-hover:bg-white group-data-[state=active]:bg-indigo-50 text-slate-500 group-hover:text-slate-700 group-data-[state=active]:text-indigo-600 transition-all">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold tracking-tight">Logística</span>
              </TabsTrigger>

              <TabsTrigger
                value="finanzas"
                className="relative rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 data-[state=active]:bg-white data-active:bg-white data-[state=active]:text-indigo-700 data-active:text-indigo-700 data-[state=active]:shadow-sm data-active:shadow-sm transition-all gap-2 flex items-center cursor-pointer group border-transparent outline-none ring-0"
              >
                <div className="p-1.5 rounded-lg bg-white/50 group-hover:bg-white group-data-[state=active]:bg-indigo-50 text-slate-500 group-hover:text-slate-700 group-data-[state=active]:text-indigo-600 transition-all">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold tracking-tight">Finanzas</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="hidden lg:flex items-center gap-4 bg-white border px-5 py-2.5 rounded-2xl shadow-sm">
              <div className="flex -space-x-2">
                {onlineUsers.length > 0 ? (
                  onlineUsers.slice(0, 5).map((u) => (
                    <div 
                      key={u.id} 
                      className={cn(
                        "w-8 h-8 rounded-full border-2 border-white text-[10px] flex items-center justify-center text-white font-bold", 
                        u.responsable?.color || "bg-slate-400"
                      )}
                      title={`${u.nombre} (${u.rol})`}
                    >
                      {u.nombre[0]}
                    </div>
                  ))
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                      <Users className="w-3 h-3 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Equipo en Línea</span>
                  <span className="text-[9px] font-bold text-emerald-500 uppercase">{onlineUsers.length} activos ahora</span>
              </div>
            </div>
          </div>

          <TabsContent value="general" className="space-y-8 outline-none">
            {/* Resumen Completo de la Operación de la Empresa (Full Width) */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Resumen Ejecutivo Multimodular</h3>
                  <p className="text-xs text-muted-foreground font-medium">Consolidado dinámico del estado operativo, comercial, logístico y financiero.</p>
                </div>
                <Badge variant="outline" className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[9px] px-2.5 py-1">
                  Métricas Filtradas
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* CARD 1: GESTIÓN COMERCIAL (CRM) */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold">Comercial</Badge>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Embudo de Ventas</h4>
                      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed mt-0.5">Captación de prospectos y envío de propuestas de servicios.</p>
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Leads en Cartera:</span>
                        <span>{comercialStats.totalLeads}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Contactos Activos:</span>
                        <span>{comercialStats.contactados}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Cotizaciones Generadas:</span>
                        <span>{filteredQuotes.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t pt-1.5 mt-1">
                        <span className="text-slate-800 font-bold uppercase text-[10px]">Monto Cotizado:</span>
                        <span className="text-blue-600 font-black">S/ {totalMontoCotizado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <Link href="/crm/cartera" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                      Cartera de Clientes <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                    <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">{comercialStats.ganados} Órdenes de Servicio</span>
                  </div>
                </div>

                {/* CARD 2: FINANZAS Y GESTIÓN CALIDAD/DOCUMENTOS */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">Administración</Badge>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Finanzas y Calidad</h4>
                      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed mt-0.5">Control de facturación, cobranzas, expedientes técnicos y calidad.</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Facturado Total:</span>
                        <span className="font-bold">S/ {totalFacturado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Recaudado Total:</span>
                        <span className="text-emerald-600 font-black">S/ {totalCobrado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Sin Ingresos:</span>
                        <span className={cn(
                          "font-bold",
                          diasSinIngresos !== null && diasSinIngresos > 15 ? "text-amber-600 animate-pulse" : "text-slate-700"
                        )}>
                          {diasSinIngresos !== null ? `${diasSinIngresos} días (${fechaUltimoIngreso})` : 'Sin ingresos'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Sin Egresos:</span>
                        <span className={cn(
                          "font-bold",
                          diasSinEgresos !== null && diasSinEgresos > 15 ? "text-amber-600" : "text-slate-700"
                        )}>
                          {diasSinEgresos !== null ? `${diasSinEgresos} días (${fechaUltimoEgreso})` : 'Sin egresos'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <Link href="/finanzas/ingresos" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
                      Flujo de Cobros <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                    <span className="text-[9px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-full">
                      {filteredValidaciones.filter(v => v.validacion.estado === "Pendiente").length} Val. Calidad
                    </span>
                  </div>
                </div>

                {/* CARD 3: OPERACIONES Y PROYECTOS */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                      </div>
                      <Badge className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold">Operaciones</Badge>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Control de Proyectos</h4>
                      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed mt-0.5">Control de avance físico de obras, cronogramas y tareas críticas.</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Proyectos en Ejecución:</span>
                        <span>{proyectosPorEstado.ejecucion}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Proyectos Finalizados:</span>
                        <span>{proyectosPorEstado.finalizados}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Tareas Vencidas:</span>
                        <span className={kpis.actividades.vencidas > 0 ? "text-rose-600 font-black" : "text-slate-700"}>{kpis.actividades.vencidas}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t pt-1.5 mt-1">
                        <span className="text-slate-800 font-bold uppercase text-[10px]">Avance Físico Promedio:</span>
                        <span className="text-purple-600 font-black">{avancePromedioProyectos}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <Link href="/operaciones/proyectos" className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1">
                      Gestionar Proyectos <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title={`${proyectosPorEstado.verdes} Verdes`} />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" title={`${proyectosPorEstado.amarillos} Amarillos`} />
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" title={`${proyectosPorEstado.rojos} Rojos`} />
                    </div>
                  </div>
                </div>

                {/* CARD 4: LOGÍSTICA Y ABASTECIMIENTO */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                        <Truck className="w-5 h-5 text-amber-600" />
                      </div>
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold">Logística</Badge>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Compras e Inventario</h4>
                      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed mt-0.5">Control de órdenes de compra, stock de insumos y personal de obra.</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Requerimientos Emitidos:</span>
                        <span>{filteredOrdenes.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Insumos Críticos (Stock):</span>
                        <span className={kpis.logistica.stockBajo > 0 ? "text-rose-600 font-black animate-pulse" : "text-slate-700"}>{kpis.logistica.stockBajo}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="text-slate-500 font-medium">Mano de Obra en Obra:</span>
                        <span>{filteredPersonal.length} Operarios</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t pt-1.5 mt-1">
                        <span className="text-slate-800 font-bold uppercase text-[10px]">Inversión en Compras:</span>
                        <span className="text-amber-600 font-black">S/ {totalMontoCompras.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <Link href="/logistica/ordenes" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1">
                      Órdenes de Compra <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                    <span className="text-[9px] font-bold text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded-full">{proveedores.length} Prov.</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Layout Principal de Dos Columnas (Visión Global) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* COLUMNA IZQUIERDA: Visión del Negocio (2/3 de ancho) */}
              <div className="lg:col-span-2 space-y-8">
                {/* Gráficos del Negocio */}
                <div className="bg-white border rounded-3xl p-6 shadow-sm">
                  <DashboardCharts clients={filteredClients} proyectos={filteredProyectos} />
                </div>
              </div>

              {/* COLUMNA DERECHA: Foco y Acción Rápida (1/3 de ancho) */}
              <div className="lg:col-span-1 space-y-8">
                
                {/* Acciones Pendientes Directivas (2x2 Grid) */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Agenda Comercial', val: kpis.crm.totalHoy, subtitle: 'Leads hoy', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100', href: '/crm/seguimiento' },
                    { label: 'Requerimientos', val: kpis.logistica.ordenesPendientes, subtitle: 'Compras pend.', icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50/50', border: 'border-purple-100', href: '/logistica/ordenes' },
                    { label: 'Docs. por Revisar', val: kpis.documental.pendientesRevision, subtitle: 'Docs. pend.', icon: Inbox, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100', href: '/documental' },
                    { label: 'Stock Crítico', val: kpis.logistica.stockBajo, subtitle: 'Insumos alerta', icon: Layers, color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100', href: '/logistica/inventario' },
                  ].map((item, idx) => (
                    <Link 
                      key={idx} 
                      href={item.href} 
                      className={cn(
                        "p-3.5 rounded-2xl border shadow-sm flex flex-col justify-between bg-white hover:shadow-md transition-all hover:-translate-y-0.5 group", 
                        item.bg
                      )}
                    >
                      <div>
                        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center mb-1.5 border", item.border)}>
                          <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-800 mb-0.5 block group-hover:text-primary transition-colors">{item.label}</span>
                        <span className="text-[7px] text-muted-foreground font-semibold block leading-tight mb-1.5">{item.subtitle}</span>
                      </div>
                      <div>
                        <div className="flex items-end gap-1.5">
                          <span className={cn("text-base font-black leading-none", item.color)}>{item.val}</span>
                          <ArrowUpRight className={cn("w-3 h-3 mb-0.5 opacity-40 group-hover:opacity-100 transition-opacity", item.color)} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                {/* Bloque 1: Validaciones de Obra Pendientes (Calidad) */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-10 w-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none font-bold text-white">
                        {filteredValidaciones.filter(v => v.validacion.estado === "Pendiente").length} Pendientes
                      </Badge>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Validación de Actividades</h4>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-relaxed">
                      Tareas técnicas finalizadas en obra por los operarios que requieren revisión técnica, calidad o conformidad documental del supervisor antes de darse por cerradas.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <Link href="/operaciones/validaciones" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
                      Ver Validaciones <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Bloque 2: Próximos Seguimientos y Compromisos */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-slate-800" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Próximos Seguimientos</h4>
                    </div>
                    <Link href="/crm/seguimiento" className="text-[9px] font-bold text-primary uppercase hover:underline">Ver Todo</Link>
                  </div>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {proximosSeguimientos.slice(0, 4).map((client) => {
                      const isOverdue = new Date(client.proximoSeguimiento || '') < new Date(new Date().setHours(0,0,0,0));
                      return (
                        <div key={client.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100/50 transition-colors flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{client.empresa}</p>
                            <p className="text-[9px] text-muted-foreground truncate italic" title={client.accion}>"{client.accion}"</p>
                            <p className="text-[8px] text-slate-400 font-medium uppercase mt-0.5">Asesor: {client.asignadoA}</p>
                          </div>
                          <Badge className={cn("text-[8px] font-bold uppercase border-none", isOverdue ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700")}>
                            {new Date(client.proximoSeguimiento || '').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </Badge>
                        </div>
                      );
                    })}
                    {proximosSeguimientos.length === 0 && (
                      <p className="text-[10px] text-slate-400 text-center py-6 font-medium">Sin compromisos agendados</p>
                    )}
                  </div>
                </div>

                {/* Bloque 3: Timeline Operativo en Tiempo Real */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-slate-800" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Timeline Operativo</h4>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-bold text-slate-400 uppercase">Historial</Badge>
                  </div>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {timelineOperativo.slice(0, 3).map((item, idx) => (
                      <div key={item.id} className="flex gap-3 relative">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-800 z-10" />
                          {idx !== timelineOperativo.slice(0, 3).length - 1 && <div className="w-0.5 h-full bg-slate-100 absolute top-2" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">{item.descripcion}</p>
                          <p className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
                            {item.proyecto?.codigo} · <span className="text-primary font-semibold">{item.proyecto?.nombre}</span>
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[8px] text-slate-400 font-bold uppercase">{item.usuario}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                            <span className="text-[8px] text-slate-400">{new Date(item.fecha).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {timelineOperativo.length === 0 && (
                      <p className="text-[10px] text-slate-400 text-center py-6 font-medium">Sin actividad reciente</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </TabsContent>

          {/* TAB: COMERCIAL */}
          <TabsContent value="comercial" className="space-y-6 outline-none">
            {(() => {
              // Filtrado por fecha estricta para acciones (productividad)
              const isInRange = (dateStr: string) => {
                const d = parseSafeDate(dateStr);
                if (!d) return false;
                if (startDate && d < startDate) return false;
                if (endDate && d > endDate) return false;
                return true;
              };

              // Métricas globales del periodo filtrado
              const prospectosNuevosTotal = filteredClients.length; 
              const cotizacionesTotal = filteredQuotes.length;
              const seguimientosTotal = clients.filter((c: any) => c.ultimoContacto && isInRange(c.ultimoContacto)).length;

              const getRealCreator = (c: any) => {
                if (c.creadoPor) return c.creadoPor;
                const interacciones = c.historialInteracciones || c.interacciones || [];
                if (interacciones.length > 0) {
                  const sorted = [...interacciones].sort((a: any, b: any) => new Date(a.fecha || a.createdAt).getTime() - new Date(b.fecha || b.createdAt).getTime());
                  if (sorted[0]?.usuario) return sorted[0].usuario;
                }
                return c.asignadoA;
              };

              // Datos para el gráfico
              const chartData = sellers.map(seller => {
                const contactosPeriodoList = clients.reduce((acc: any[], c: any) => {
                  const interacciones = c.historialInteracciones || c.interacciones || [];
                  
                  interacciones.forEach((int: any) => {
                    const isOwner = c.asignadoA?.toLowerCase().trim() === seller.name.toLowerCase().trim();
                    const isCreator = int.usuario?.toLowerCase().includes(seller.name.toLowerCase().trim());
                    const belongsToSeller = int.usuario ? isCreator : isOwner;
                    const hasText = !!(int.comentario || int.notas || int.observaciones);
                    const isVisit = int.tipo?.toLowerCase().includes('visit');
                    
                    if (belongsToSeller && (hasText || isVisit)) {
                      if (isInRange(int.fecha || int.createdAt)) {
                        acc.push({ ...int, clienteNombre: c.empresa || c.nombre, esLegacy: false });
                      }
                    }
                  });
                  
                  return acc;
                }, []).sort((a: any, b: any) => new Date(b.fecha || b.createdAt).getTime() - new Date(a.fecha || a.createdAt).getTime());

                const contactosHoyList = clients.reduce((acc: any[], c: any) => {
                  const interacciones = c.historialInteracciones || c.interacciones || [];
                  const hoyStr = getPeruDateString();
                  
                  interacciones.forEach((int: any) => {
                    const isOwner = c.asignadoA?.toLowerCase().trim() === seller.name.toLowerCase().trim();
                    const isCreator = int.usuario?.toLowerCase().includes(seller.name.toLowerCase().trim());
                    const belongsToSeller = int.usuario ? isCreator : isOwner;
                    const hasText = !!(int.comentario || int.notas || int.observaciones);
                    const isVisit = int.tipo?.toLowerCase().includes('visit');
                    
                    if (belongsToSeller && (hasText || isVisit)) {
                      if ((int.fecha || int.createdAt)?.startsWith(hoyStr)) {
                        acc.push({ ...int, clienteNombre: c.empresa || c.nombre, esLegacy: false });
                      }
                    }
                  });
                  
                  return acc;
                }, []);

                return {
                  name: seller.name.split(' ')[0], 
                  prospectos: filteredClients.filter((c: any) => {
                    const creador = getRealCreator(c);
                    return creador?.toLowerCase().includes(seller.name.toLowerCase().trim());
                  }).length,
                  prospectosPeriodo: clients.filter((c: any) => {
                     const creador = getRealCreator(c);
                     if (!creador?.toLowerCase().includes(seller.name.toLowerCase().trim())) return false;
                     return c.fechaCreacion?.startsWith(getPeruDateString());
                  }).length,
                  cotizaciones: filteredQuotes.filter((q: any) => {
                    const clienteCot = clients.find((c: any) => c.id === q.clientId);
                    return clienteCot?.asignadoA?.toLowerCase().trim() === seller.name.toLowerCase().trim();
                  }).length,
                  contactos: contactosPeriodoList.filter((int: any) => !int.tipo?.toLowerCase().includes('visit')).length,
                  contactosHoy: contactosHoyList.filter((int: any) => !int.tipo?.toLowerCase().includes('visit')).length,
                  contactosPeriodoList: contactosPeriodoList,
                  visitas: contactosPeriodoList.filter((int: any) => int.tipo?.toLowerCase().includes('visit')).length,
                  fallidos: contactosPeriodoList.filter((int: any) => int.tipo === 'No Contesta').length,
                  clientesAtendidos: new Set(contactosPeriodoList.filter((int: any) => int.tipo !== 'No Contesta').map((int: any) => int.clienteId || int.clienteNombre)).size,
                };
              });

              // Datos de tendencia (Últimos 5 días hábiles, Lunes a Viernes)
              const trendData = (() => {
                const data = [];
                let daysAdded = 0;
                let i = 0;
                // Recorremos hacia atrás hasta encontrar 5 días que no sean fin de semana
                while (daysAdded < 5) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  const dayOfWeek = d.getDay(); // 0 = Domingo, 6 = Sábado
                  
                  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    const dateStr = getPeruDateString(d);
                    const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
                    const contactosDia = clients.reduce((acc: number, c: any) => acc + (c.historialInteracciones || c.interacciones || []).filter((i: any) => (i.fecha || i.createdAt)?.startsWith(dateStr) && !i.tipo?.toLowerCase().includes('visit')).length, 0);
                    const visitasDia = clients.reduce((acc: number, c: any) => acc + (c.historialInteracciones || c.interacciones || []).filter((i: any) => (i.fecha || i.createdAt)?.startsWith(dateStr) && i.tipo?.toLowerCase().includes('visit')).length, 0);
                    
                    data.unshift({ // unshift para mantener el orden cronológico
                      name: dayName,
                      prospectos: clients.filter((c: any) => c.fechaCreacion?.startsWith(dateStr)).length,
                      contactos: contactosDia,
                      visitas: visitasDia,
                      cotizaciones: quotes.filter((q: any) => q.fechaCreacion?.startsWith(dateStr)).length,
                    });
                    daysAdded++;
                  }
                  i++;
                }
                return data;
              })();

              return (
                <div className="space-y-6">
                  {/* LIVE PULSE DEL PERIODO */}
                  {(() => {
                    const prospectosPeriodo = filteredClients.length;
                    const seguimientosPeriodo = clients.reduce((acc: number, c: any) => acc + (c.historialInteracciones || c.interacciones || []).filter((i: any) => isInRange(i.fecha || i.createdAt)).length, 0);
                    const visitasPeriodo = clients.reduce((acc: number, c: any) => acc + (c.historialInteracciones || c.interacciones || []).filter((i: any) => isInRange(i.fecha || i.createdAt) && i.tipo?.toLowerCase().includes('visit')).length, 0);
                    const cierresPeriodo = clients.filter((c: any) => ['Ganado', 'Orden de Servicio'].includes(c.etapaComercial) && isInRange(getCloseDate(c))).length;

                    return (
                      <div className="bg-slate-900 rounded-2xl px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between text-white shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all cursor-pointer gap-4 border border-slate-800" onClick={() => router.push('/crm/cartera')}>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="bg-rose-500/20 p-2 rounded-xl">
                            <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                          </div>
                          <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Actividad del Periodo</span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5">
                          {/* Prospectos */}
                          <div className="flex items-center gap-2.5 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/50">
                            <Users className="w-4 h-4 text-blue-400" />
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-white text-base font-black leading-none">{prospectosPeriodo}</span>
                              <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Prospectos</span>
                            </div>
                          </div>
                          
                          {/* Visitas */}
                          <div className="flex items-center gap-2.5 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/50">
                            <MapPin className="w-4 h-4 text-purple-400" />
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-white text-base font-black leading-none">{visitasPeriodo}</span>
                              <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Visitas</span>
                            </div>
                          </div>

                          {/* Seguimientos */}
                          <div className="flex items-center gap-2.5 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/50">
                            <PhoneCall className="w-4 h-4 text-emerald-400" />
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-white text-base font-black leading-none">{seguimientosPeriodo}</span>
                              <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Contactos</span>
                            </div>
                          </div>


                          {/* Cierres */}
                          <div className="flex items-center gap-2.5 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/50">
                            <Trophy className="w-4 h-4 text-rose-400" />
                            <div className="flex items-baseline gap-1.5">
                              <span className={cierresPeriodo > 0 ? "text-emerald-400 text-base font-black leading-none" : "text-white text-base font-black leading-none"}>{cierresPeriodo}</span>
                              <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Órdenes Serv.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* CUMPLIMIENTO DE METAS DEL PERIODO */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Rendimiento del Periodo</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {chartData.map((data, idx) => {
                        const isValentina = data.name.toLowerCase() === 'valentina';
                        const isAriana = data.name.toLowerCase() === 'ariana';
                        const meta = 15; 
                        
                        let avance = 0;
                        let labelTipo = "";
                        
                        if (isAriana) {
                          avance = data.prospectos;
                          labelTipo = "Nuevos Prospectos";
                        } else if (isValentina) {
                          avance = data.contactos + data.visitas;
                          labelTipo = "Seguimientos y Visitas";
                        } else {
                          avance = data.prospectos + data.contactos + data.visitas;
                          labelTipo = "Prospectos, Seguim. y Visitas";
                        }
                        
                        const porcentaje = Math.min((avance / meta) * 100, 100);
                        const isSuccess = avance >= meta;
                        return (
                          <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold uppercase text-slate-700">{data.name}</span>
                              <Badge className={cn("text-[9px] font-bold border-none uppercase", isSuccess ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                                {avance} / {meta}
                              </Badge>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                              <div className={cn("h-2 rounded-full transition-all duration-1000", isSuccess ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${porcentaje}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[9px] text-slate-500 font-medium">{labelTipo}</span>
                              <span className="text-[9px] text-slate-500 font-medium">Progreso: {Math.round(porcentaje)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* NIVEL 2: GRÁFICO COMPARATIVO Y ALERTAS */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Activity className="w-4 h-4 text-slate-800" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Comparativa de Productividad (Periodo)</h3>
                      </div>
                      <Card className="border border-slate-100 shadow-sm bg-white rounded-3xl p-5 h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                            <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} 
                            />
                            <Bar dataKey="prospectos" name="Nuevos Prospectos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                            <Bar dataKey="visitas" name="Visitas" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} />
                            <Bar dataKey="contactos" name="Seguimientos (Otros)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />

                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    </div>

                    {/* ALERTAS COMPACTADAS */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Clock className="w-4 h-4 text-slate-800" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Alertas Operativas</h3>
                      </div>
                      {(() => {
                        const hoy = new Date();
                        hoy.setHours(0,0,0,0);
                        const seguimientosVencidos = clients.filter((c: any) => c.proximoSeguimiento && new Date(c.proximoSeguimiento) < hoy && !['Ganado', 'Orden de Servicio', 'Perdido'].includes(c.etapaComercial));
                        const congelados = clients.filter((c: any) => {
                          if (!c.ultimoContacto) return false; 
                          const days = Math.floor((new Date().getTime() - new Date(c.ultimoContacto).getTime()) / (1000 * 3600 * 24));
                          return days > 15 && !['Ganado', 'Orden de Servicio', 'Perdido'].includes(c.etapaComercial);
                        });

                        return (
                          <div className="flex flex-col gap-3">
                            <Card className="border border-red-100 shadow-sm bg-red-50/50 rounded-2xl hover:bg-red-50 transition-colors cursor-pointer" onClick={() => router.push('/crm/seguimiento')}>
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-red-900 leading-tight">Seguimientos Vencidos</p>
                                    <p className="text-[9px] text-red-600/80 font-bold uppercase mt-0.5">Requiere contacto</p>
                                  </div>
                                </div>
                                <span className="text-2xl font-black text-red-600">{seguimientosVencidos.length}</span>
                              </CardContent>
                            </Card>

                            <Card className="border border-blue-100 shadow-sm bg-blue-50/50 rounded-2xl hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => router.push('/crm/cartera')}>
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                    <Inbox className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-blue-900 leading-tight">Sin Movimiento</p>
                                    <p className="text-[9px] text-blue-600/80 font-bold uppercase mt-0.5">+15 Días estancados</p>
                                  </div>
                                </div>
                                <span className="text-2xl font-black text-blue-600">{congelados.length}</span>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* NIVEL 2.5: TENDENCIA OPERATIVA */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <TrendingUp className="w-4 h-4 text-slate-800" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Tendencia Operativa (Últimos 5 Días Hábiles)</h3>
                    </div>
                    <Card className="border border-slate-100 shadow-sm bg-white rounded-3xl p-5 h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} width={40} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} 
                          />
                          <Bar dataKey="prospectos" name="Nuevos Prospectos" stackId="a" fill="#3b82f6" barSize={24} />
                          <Bar dataKey="visitas" name="Visitas" stackId="a" fill="#8b5cf6" />
                          <Bar dataKey="contactos" name="Seguimientos (Otros)" stackId="a" fill="#10b981" />

                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </div>

                  {/* NIVEL 3: TABLA DE RENDIMIENTO (DATA TABLE) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Target className="w-4 h-4 text-slate-800" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Tabla de Rendimiento por Asesora</h3>
                    </div>
                    <Card className="border border-slate-100 shadow-sm bg-white rounded-3xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Asesora</th>
                              <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Nuevos Prospectos</th>
                              <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Visitas</th>
                              <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Contactos/Seg.</th>
                              <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">No Contesta</th>
                              <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Clientes Atendidos</th>
                              <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Órdenes de Servicio</th>
                              <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Efectividad %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {sellers.map((seller) => {
                              const data = chartData.find(d => d.name === seller.name.split(' ')[0]) || { prospectos: 0, cotizaciones: 0, contactos: 0, visitas: 0, fallidos: 0, clientesAtendidos: 0, contactosPeriodoList: [] };
                              
                              const clientesGanados = clients.filter((c: any) => c.asignadoA?.toLowerCase().trim() === seller.name.toLowerCase().trim() && ['Ganado', 'Orden de Servicio'].includes(c.etapaComercial) && isInRange(getCloseDate(c)));
                              const ganadosEnPeriodo = clientesGanados.length;
                              const cierresNames = clientesGanados.map((c: any) => c.empresa || c.nombre).join(', ') || 'Sin cierres';
                              
                              const isValentina = seller.name.toLowerCase() === 'valentina';
                              const isAriana = seller.name.toLowerCase() === 'ariana';
                              
                              const meta = 15;
                              let progreso = 0;
                              if (isAriana) {
                                progreso = data.prospectos;
                              } else if (isValentina) {
                                progreso = data.contactos + data.visitas;
                              } else {
                                progreso = data.prospectos + data.contactos + data.visitas;
                              }
                              
                              const efectividad = Math.round((progreso / meta) * 100);
                              const efectividadReal = Math.min(efectividad, 100);

                              return (
                                <tr key={seller.name} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => router.push('/crm/cartera')}>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8 border border-slate-100 shadow-sm shrink-0">
                                        <AvatarFallback className={cn("text-white font-black text-[10px]", seller.color)}>
                                          {seller.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <span className="font-bold text-slate-800 block">{seller.name}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">{seller.role}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center font-black text-slate-700">
                                    {isValentina ? '-' : (
                                      <div className="flex items-center justify-center gap-1">
                                        {data.prospectos}
                                        {data.prospectos > 0 && (
                                          <Badge 
                                            className="bg-slate-100 text-slate-700 border-none px-1.5 py-0 h-5 text-[9px] hover:bg-slate-200 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const prospectosPeriodoList = filteredClients.filter((c: any) => getRealCreator(c)?.toLowerCase().includes(seller.name.toLowerCase().trim()));
                                              setProspectosList(prospectosPeriodoList);
                                              setProspectosModalOpen(true);
                                            }}
                                          >
                                            Ver
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-center font-black text-purple-600">
                                    {isAriana ? '-' : (
                                      <div className="flex items-center justify-center gap-1">
                                        {data.visitas}
                                        {data.visitas > 0 && (
                                          <Badge 
                                            className="bg-purple-100 text-purple-700 border-none px-1.5 py-0 h-5 text-[9px] hover:bg-purple-200 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const visitasPeriodoList = data.contactosPeriodoList?.filter((int: any) => int.tipo?.toLowerCase().includes('visit')) || [];
                                              setVisitasList(visitasPeriodoList);
                                              setVisitasModalOpen(true);
                                            }}
                                          >
                                            Ver
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-center font-black text-emerald-600">
                                    {isAriana ? '-' : (
                                      <div className="flex items-center justify-center gap-1">
                                        {data.contactos}
                                        {data.contactos > 0 && (
                                          <Badge 
                                            className="bg-emerald-100 text-emerald-700 border-none px-1.5 py-0 h-5 text-[9px] hover:bg-emerald-200 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setContactosList(data.contactosPeriodoList?.filter((int: any) => !int.tipo?.toLowerCase().includes('visit')) || []);
                                              setContactosModalOpen(true);
                                            }}
                                          >
                                            Ver
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-center font-black text-red-500">
                                    {isAriana ? '-' : (
                                      <div className="flex items-center justify-center gap-1">
                                        {data.fallidos}
                                        {data.fallidos > 0 && (
                                          <Badge 
                                            className="bg-red-100 text-red-700 border-none px-1.5 py-0 h-5 text-[9px] hover:bg-red-200 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setContactosList(data.contactosPeriodoList?.filter((int: any) => int.tipo === 'No Contesta') || []);
                                              setContactosModalOpen(true);
                                            }}
                                          >
                                            Ver
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-center font-black text-blue-600">
                                    {isAriana ? '-' : (
                                      <div className="flex items-center justify-center gap-1">
                                        {data.clientesAtendidos}
                                        {data.clientesAtendidos > 0 && (
                                          <Badge 
                                            className="bg-blue-100 text-blue-700 border-none px-1.5 py-0 h-5 text-[9px] hover:bg-blue-200 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setContactosList(data.contactosPeriodoList?.filter((int: any) => int.tipo !== 'No Contesta') || []);
                                              setContactosModalOpen(true);
                                            }}
                                          >
                                            Ver
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-center font-black text-blue-600" title={cierresNames}>
                                    {isAriana ? '-' : (
                                      <div className="flex items-center justify-center gap-1">
                                        {ganadosEnPeriodo}
                                        {ganadosEnPeriodo > 0 && (
                                          <Badge 
                                            className="bg-blue-100 text-blue-700 border-none px-1.5 py-0 h-5 text-[9px] hover:bg-blue-200 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCierresList(clientesGanados);
                                              setCierresModalOpen(true);
                                            }}
                                          >
                                            Ver
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <span className="font-black text-slate-800 w-8">{`${efectividadReal}%`}</span>
                                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                                        <div 
                                          className={cn("h-full rounded-full", efectividadReal >= 100 ? "bg-emerald-500" : efectividadReal >= 50 ? "bg-amber-500" : "bg-blue-500")} 
                                          style={{ width: `${efectividadReal}%` }} 
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          {/* TAB: OPERACIONES */}
          <TabsContent value="operaciones" className="space-y-8 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Operational Areas */}
              <div className="lg:col-span-1 space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <Briefcase className="w-5 h-5 text-slate-800" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Carga por Área</h3>
                </div>
                <div className="space-y-4">
                  {areas.map((area) => (
                    <Card key={area.id} className="border-none shadow-sm overflow-hidden hover:scale-[1.02] transition-all bg-white rounded-3xl">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("h-12 w-12 rounded-2xl text-white flex items-center justify-center shadow-lg", area.color)}>
                            <area.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{area.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter opacity-70">{area.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-slate-800 leading-none">{distribucionPorArea[area.name] || 0}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-50">proyectos</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Operational Timeline */}
              <div className="lg:col-span-3 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-800" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Timeline de Ejecución</h3>
                  </div>
                  <Badge className="bg-slate-900 text-white border-none text-[10px] font-bold">ÚLTIMAS 5 ACCIONES</Badge>
                </div>
                
                <div className="bg-white border rounded-[2.5rem] shadow-sm overflow-hidden relative">
                  <div className="divide-y divide-slate-100">
                    {timelineOperativo.map((item, idx) => (
                      <div key={item.id} className="p-6 flex items-start gap-6 hover:bg-slate-50 transition-colors relative">
                        <div className="relative flex flex-col items-center h-full">
                          <div className="w-4 h-4 rounded-full bg-slate-900 ring-8 ring-slate-100 shrink-0 z-10" />
                          {idx !== timelineOperativo.length - 1 && <div className="w-0.5 h-full bg-slate-100 absolute top-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm font-bold text-slate-800 truncate leading-none mb-1.5">{item.descripcion}</p>
                            <Badge variant="outline" className="text-[9px] font-bold text-slate-400 uppercase border-slate-200">{new Date(item.fecha).toLocaleDateString()}</Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-xs text-slate-500 font-medium">
                              {item.proyecto?.codigo} · <span className="text-primary font-bold">{item.proyecto?.nombre}</span>
                            </p>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Avatar className="w-5 h-5 border-none">
                              <AvatarFallback className="bg-slate-100 text-[8px] font-bold text-slate-500 uppercase">{item.usuario[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Responsable: {item.usuario}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {timelineOperativo.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <Briefcase className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Sin actividad reciente</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB: LOGÍSTICA */}
          <TabsContent value="logistica" className="space-y-8 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Column 1: Inventory & Workforce (1/3) */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-slate-800" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Insumos Críticos</h3>
                  </div>
                  <Badge className="bg-rose-50 text-rose-700 border-none font-bold">ALERTA: {kpis.logistica.stockBajo}</Badge>
                </div>

                <div className="bg-white border rounded-[2.5rem] p-6 shadow-sm space-y-4">
                  {insumos.filter((i: any) => i.stockActual <= i.stockMinimo).slice(0, 5).map((insumo: any) => (
                    <div key={insumo.id} className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="truncate max-w-[150px]">{insumo.nombre}</span>
                        <span className="text-rose-600 font-extrabold">{insumo.stockActual} / {insumo.stockMinimo} {insumo.unidadMedida || 'und'}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-rose-500 h-full rounded-full" 
                          style={{ width: `${Math.min(100, (insumo.stockActual / (insumo.stockMinimo || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {insumos.filter((i: any) => i.stockActual <= i.stockMinimo).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">Todos los insumos con stock suficiente.</p>
                  )}
                </div>

                {/* Workforce */}
                <div className="flex items-center justify-between px-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-800" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Mano de Obra</h3>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-none font-bold">{filteredPersonal.length} Activos</Badge>
                </div>

                <div className="bg-white border rounded-[2.5rem] p-6 shadow-sm space-y-4">
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {filteredPersonal.slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{p.nombre}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-black">{p.cargo || 'Operario'}</p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 font-bold border-none text-[8px]">
                          EN OBRA
                        </Badge>
                      </div>
                    ))}
                    {filteredPersonal.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">Sin mano de obra registrada en este periodo.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 2: Purchase Orders (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-slate-800" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Órdenes de Compra</h3>
                  </div>
                  <Link href="/logistica/ordenes" className="text-[10px] font-bold text-primary uppercase flex items-center gap-1 hover:underline">Ver Todo <ArrowUpRight className="w-3.5 h-3.5" /></Link>
                </div>

                <div className="bg-white border rounded-[2.5rem] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Código</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Proveedor</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Fecha</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Monto</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredOrdenes.slice(0, 6).map((o: any) => (
                          <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-xs font-bold text-primary">{o.codigo || 'O/C'}</td>
                            <td className="p-4 text-xs font-bold text-slate-800 truncate max-w-[150px]">{o.proveedor?.razonSocial || 'Varios'}</td>
                            <td className="p-4 text-xs font-medium text-slate-500">{new Date(o.fechaEmision).toLocaleDateString()}</td>
                            <td className="p-4 text-xs font-black text-slate-800">S/ {Number(o.montoTotal || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                            <td className="p-4 text-xs">
                              <Badge className={cn(
                                "text-[8px] font-black border-none px-2 py-0.5",
                                o.estado === 'PENDIENTE' ? "bg-amber-50 text-amber-700" :
                                o.estado === 'APROBADA' ? "bg-blue-50 text-blue-700" :
                                o.estado === 'COMPLETADA' ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700"
                              )}>
                                {o.estado}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {filteredOrdenes.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-xs text-slate-400">Sin órdenes de compra registradas en este período.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB: FINANZAS */}
          <TabsContent value="finanzas" className="space-y-8 outline-none">
            
            {/* Quick KPI Row para Impuestos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border border-indigo-100 shadow-sm bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors cursor-pointer rounded-2xl" onClick={() => router.push('/finanzas/impuestos')}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-800">Declaración</p>
                    <p className="text-[9px] text-indigo-600/80 font-bold mt-0.5">Impuestos SUNAT</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-emerald-100 shadow-sm bg-emerald-50/30 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">IGV Ventas</p>
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                  </div>
                  <p className="text-lg font-black text-emerald-700">S/ {igvVentas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>

              <Card className="border border-rose-100 shadow-sm bg-rose-50/30 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-800">IGV Compras</p>
                    <TrendingDown className="w-3 h-3 text-rose-600" />
                  </div>
                  <p className="text-lg font-black text-rose-700">S/ {igvCompras.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>

              <Card className="border border-blue-100 shadow-sm bg-blue-50/30 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-800">Saldo IGV</p>
                    <Activity className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-lg font-black text-blue-700">S/ {(igvVentas - igvCompras).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Facturas (Incomes) */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-slate-800" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Control de Facturas</h3>
                  </div>
                  <Link href="/finanzas/ingresos" className="text-[10px] font-bold text-primary uppercase flex items-center gap-1 hover:underline">Gestionar Ingresos <ArrowUpRight className="w-3.5 h-3.5" /></Link>
                </div>

                <div className="bg-white border rounded-[2.5rem] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Factura</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Cliente</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Monto</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredFacturas.slice(0, 6).map((f: any) => (
                          <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-xs font-bold text-primary">{f.codigo}</td>
                            <td className="p-4 text-xs font-bold text-slate-800 truncate max-w-[150px]">{f.cliente?.empresa || 'Varios'}</td>
                            <td className="p-4 text-xs font-black text-slate-800">
                              S/ {Number(f.montoTotal || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 text-xs">
                              <Badge className={cn(
                                "text-[8px] font-black border-none px-2 py-0.5",
                                f.estado === 'PAGADA' ? "bg-emerald-50 text-emerald-700" :
                                f.estado === 'PAGO_PARCIAL' ? "bg-blue-50 text-blue-700" :
                                f.estado === 'ANULADA' ? "bg-red-50 text-red-700 line-through" : "bg-amber-50 text-amber-700"
                              )}>
                                {f.estado}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {filteredFacturas.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-xs text-slate-400">Sin facturas registradas en este período.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Gastos (Expenses) */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-800" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Control de Gastos</h3>
                  </div>
                  <Link href="/finanzas/egresos" className="text-[10px] font-bold text-primary uppercase flex items-center gap-1 hover:underline">Gestionar Egresos <ArrowUpRight className="w-3.5 h-3.5" /></Link>
                </div>

                <div className="bg-white border rounded-[2.5rem] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Concepto</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Monto</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredGastos.slice(0, 6).map((g: any) => (
                          <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-xs font-bold text-slate-800 truncate max-w-[150px]">{g.concepto}</td>
                            <td className="p-4 text-[9px] font-black text-slate-500 uppercase">{g.tipo}</td>
                            <td className="p-4 text-xs font-black text-slate-800">
                              S/ {Number(g.montoTotal || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 text-xs">
                              <Badge className={cn(
                                "text-[8px] font-black border-none px-2 py-0.5",
                                g.estado === 'PAGADO' ? "bg-emerald-50 text-emerald-700" :
                                g.estado === 'APROBADO' ? "bg-blue-50 text-blue-700" :
                                g.estado === 'SOLICITADO' ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-700"
                              )}>
                                {g.estado}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {filteredGastos.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-xs text-slate-400">Sin egresos registrados en este período.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL DE CIERRES COMERCIALES */}
      <Dialog open={cierresModalOpen} onOpenChange={setCierresModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-500" />
              Órdenes de Servicio Logradas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {cierresList.length > 0 ? (
              cierresList.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{c.empresa || c.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">
                      {c.fechaActualizacion || c.updatedAt || c.fechaCreacion || c.createdAt
                        ? new Date(c.fechaActualizacion || c.updatedAt || c.fechaCreacion || c.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) 
                        : 'Sin Fecha'}
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px]">GANADO</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No hay órdenes de servicio para mostrar.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONTACTOS / SEGUIMIENTOS */}
      <Dialog open={contactosModalOpen} onOpenChange={setContactosModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Auditoría de Seguimientos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {contactosList.length > 0 ? (
              contactosList.map((int: any, i: number) => {
                const tipo = int.tipo || 'Seguimiento';
                const esLlamada = tipo.toLowerCase().includes('llamad');
                const esWhatsApp = tipo.toLowerCase().includes('whatsapp') || tipo.toLowerCase().includes('wsp');
                const esCorreo = tipo.toLowerCase().includes('correo') || tipo.toLowerCase().includes('email');
                const esVisita = tipo.toLowerCase().includes('visit');
                
                let colorClass = "bg-slate-100 text-slate-700";
                if (esLlamada) colorClass = "bg-blue-100 text-blue-700";
                if (esWhatsApp) colorClass = "bg-emerald-100 text-emerald-700";
                if (esCorreo) colorClass = "bg-orange-100 text-orange-700";
                if (esVisita) colorClass = "bg-purple-100 text-purple-700";

                return (
                  <div key={i} className="flex items-start justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800 truncate">{int.clienteNombre || 'Sin Nombre'}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {int.fecha || int.createdAt ? new Date(int.fecha || int.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin Fecha'}
                          </p>
                        </div>
                        <Badge className={cn("border-none text-[9px] uppercase shrink-0 ml-2", colorClass)}>
                          {tipo}
                        </Badge>
                      </div>
                      {(() => {
                        const obsText = int.comentario || int.notas || int.observaciones || '';
                        const cleanObs = obsText.replace(/\[IMG\].*?\[\/IMG\]/, '').trim();
                        
                        if (!cleanObs) return null;
                        return (
                          <div className="mt-2 text-xs text-slate-600 italic line-clamp-2">
                            "{cleanObs}"
                          </div>
                        );
                      })()}
                    </div>
                    {(() => {
                      const obsText = int.comentario || int.notas || int.observaciones || '';
                      const imgMatch = obsText.match(/\[IMG\](.*?)\[\/IMG\]/);
                      const imgUrl = imgMatch ? imgMatch[1] : (int.imagenAdjunta || null);

                      if (!imgUrl) return null;
                      return (
                        <div className="shrink-0 flex flex-col items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start">
                          <span className="text-[7px] font-black uppercase text-slate-400 mb-0.5 tracking-wider">Evidencia</span>
                          <img src={imgUrl.startsWith('http') ? imgUrl : api.getFileUrl(imgUrl)} alt="Evidencia" className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover cursor-pointer border border-slate-100 hover:opacity-80 transition-opacity" onClick={() => window.open(imgUrl.startsWith('http') ? imgUrl : api.getFileUrl(imgUrl), '_blank')} title="Ver imagen completa" />
                        </div>
                      );
                    })()}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No hay seguimientos registrados.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE VISITAS */}
      <Dialog open={visitasModalOpen} onOpenChange={setVisitasModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-500" />
              Auditoría de Visitas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {visitasList.length > 0 ? (
              visitasList.map((int: any, i: number) => {
                const obsText = int.comentario || int.notas || int.observaciones || '';
                const imgMatch = obsText.match(/\[IMG\](.*?)\[\/IMG\]/);
                const cleanObs = obsText.replace(/\[IMG\].*?\[\/IMG\]/, '').trim();
                const imgUrl = imgMatch ? imgMatch[1] : (int.imagenAdjunta || null);

                return (
                  <div key={i} className="flex items-start justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{int.clienteNombre || 'Sin Nombre'}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {int.fecha || int.createdAt ? new Date(int.fecha || int.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin Fecha'}
                          </p>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700 border-none text-[9px] uppercase shrink-0">
                          {int.accion?.toLowerCase().includes('técnica') || int.accion?.toLowerCase().includes('tecnica') ? 'VISITA TÉCNICA' : (int.tipo || 'VISITA')}
                        </Badge>
                      </div>
                      {cleanObs && (
                        <div className="mt-2 text-xs text-slate-600 italic line-clamp-2">
                          "{cleanObs}"
                        </div>
                      )}
                    </div>
                    {imgUrl && (
                      <div className="shrink-0 flex flex-col items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start">
                        <span className="text-[7px] font-black uppercase text-slate-400 mb-0.5 tracking-wider">Evidencia</span>
                        <img src={imgUrl.startsWith('http') ? imgUrl : api.getFileUrl(imgUrl)} alt="Evidencia" className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover cursor-pointer border border-slate-100 hover:opacity-80 transition-opacity" onClick={() => window.open(imgUrl.startsWith('http') ? imgUrl : api.getFileUrl(imgUrl), '_blank')} title="Ver imagen completa" />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No hay visitas registradas.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE NUEVOS PROSPECTOS */}
      <Dialog open={prospectosModalOpen} onOpenChange={setProspectosModalOpen}>
        <DialogContent className="max-w-md bg-white shadow-2xl border border-slate-200 opacity-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Nuevos Prospectos Registrados
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {prospectosList.length > 0 ? (
              prospectosList.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{c.empresa || c.nombre || 'Sin Nombre'}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {c.fechaCreacion || c.createdAt
                        ? new Date(c.fechaCreacion || c.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
                        : 'Sin Fecha'}
                    </p>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 border-none text-[9px] uppercase">
                    {c.etapaComercial || 'PROSPECTO'}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No hay prospectos para mostrar.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
