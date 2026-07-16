import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { useAuthStore } from './auth-store';
import { useNotificationStore } from './notification-store';
import { Client, Interaction, AttachedFile } from '@/types/crm';
import { toast } from 'sonner';

export type Quote = {
  id: string;
  codigo: string;
  clientId: string;
  empresa: string;
  contacto: string;
  referencia: string;
  objetivo?: string;
  alcance: any;
  consideraciones?: string;
  entregables?: string;
  monto: number;
  plazo?: string;
  validez?: string;
  formaPago?: string;
  estado: 'Pendiente' | 'Enviado' | 'Revisado' | 'Aprobado' | 'Aprobada' | 'Rechazado' | 'Rechazada' | 'Obsoleto' | 'Ganada' | 'Perdida' | 'En negociación';
  moneda?: string;
  observaciones?: string;
  cajaId?: string;
  version: number;
  fecha: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  cotizacionPadreId?: string;
  proyectoGeneradoId?: string;
  documentos?: any[];
  interacciones?: any[];
  hitosPago?: any[];
};

export interface CRMFilters {
  searchQuery: string;
  tarifa: string;
  asignadoA: string;
  estado: string;
  etapaComercial: string;
  prioridad: string;
  zona: string;
  tipoCliente: string;
  clasificacion: string;
  temperatura: string; 
  fechaDesde?: string;
  fechaHasta?: string;
}

export const isFollowUpOverdue = (client: Client) => {
  if (!client.proximoSeguimiento) return false;
  return new Date(client.proximoSeguimiento) < new Date();
};

export const getDaysSinceContact = (dateString?: string) => {
  if (!dateString) return 999;
  const lastDate = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateClientSemaforo = (client: Client) => {
  const days = getDaysSinceContact(client.ultimoContacto);
  const isOverdue = isFollowUpOverdue(client);

  if (client.etapaComercial === 'Ganado' || client.etapaComercial === 'Orden de Servicio') {
    if (isOverdue || days > 120) return 'Rojo';
    if (days > 90) return 'Amarillo';
    return 'Verde';
  }

  if (isOverdue || days > 20) return 'Rojo';
  if (days > 10) return 'Amarillo';
  return 'Verde';
};

const safeNumber = (val: any) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  // Limpieza agresiva: dejar solo números, punto decimal y signo negativo
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

interface CRMState {
  clients: Client[];
  quotes: Quote[];
  totalClients: number;
  totalQuotes: number;
  page: number;
  limit: number;
  totalPages: number;
  quotePage: number;
  quoteLimit: number;
  quoteTotalPages: number;
  loading: boolean;
  view: 'table' | 'kanban';
  filters: CRMFilters;
  zones: string[];
  
  fetchClients: (page?: number, limit?: number, append?: boolean, ignoreFilters?: boolean) => Promise<void>;
  fetchClientById: (id: string) => Promise<Client | null>;
  fetchQuotes: (page?: number, limit?: number) => Promise<void>;
  fetchZones: () => Promise<void>;
  setView: (view: 'table' | 'kanban') => void;
  setSearchQuery: (query: string) => void;
  setTarifa: (tarifa: string) => void;
  setAsignadoA: (asignadoA: string) => void;
  setEstado: (estado: string) => void;
  setEtapaComercial: (etapaComercial: string) => void;
  setPrioridad: (prioridad: string) => void;
  setZona: (zona: string) => void;
  setTipoCliente: (tipoCliente: string) => void;
  setClasificacion: (clasificacion: string) => void;
  setFechaRango: (desde?: string, hasta?: string) => void;
  resetFilters: () => void;
  
  addClient: (client: Omit<Client, 'id' | 'codigo' | 'ventaProyectada' | 'semaforo'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addInteraction: (clientId: string, data: { tipo: string, accion: string, observaciones: string, usuario: string }) => Promise<void>;
  reassignSeller: (clientId: string, seller: string) => Promise<void>;
  attachFile: (clientId: string, file: { nombre: string, url: string, tipo: string, tamano: string, subidoPor: string }) => Promise<void>;
  attachQuoteFile: (cotizacionId: string, clientId: string, file: { nombre: string, url: string, tipo: string, subtype?: string, tamano: string, subidoPor: string }) => Promise<void>;
  uploadClientFile: (file: File) => Promise<any>;
  deleteFile: (clientId: string, fileId: string) => Promise<void>;

  addQuote: (quote: Omit<Quote, 'id'>) => Promise<void>;
  uploadQuoteFile: (file: File) => Promise<any>;
  importQuotes: (quotes: Partial<Quote>[]) => Promise<void>;
  importClients: (clients: Partial<Client>[]) => Promise<void>;
  updateQuote: (quote: Quote) => Promise<any>;
  deleteQuote: (id: string) => Promise<void>;
  cloneQuote: (id: string) => Promise<void>;

  changeStage: (id: string, newStage: Client['etapaComercial']) => Promise<void>;
  scheduleFollowUp: (clientId: string, fecha: string, accion: string, tipo: Interaction['tipo'], uploadedUrl?: string) => Promise<void>;
  scheduleTechnicalVisit: (clientId: string, tecnicoId: string, fecha: string, observaciones: string, adjuntos?: any[]) => Promise<void>;
}

const safeJsonParse = (str: any, fallback: any = []) => {
  if (typeof str !== 'string') return str || fallback;
  if (!str || str.trim() === '') return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn("[CRMStore] Error parsing JSON:", str);
    return fallback;
  }
};

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      clients: [], 
      quotes: [],
      totalClients: 0,
      totalQuotes: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      quotePage: 1,
      quoteLimit: 20,
      quoteTotalPages: 0,
      loading: false,
      view: 'table',
      filters: {
        searchQuery: '',
        tarifa: '',
        asignadoA: '',
        estado: '',
        etapaComercial: '',
        prioridad: '',
        zona: '',
        tipoCliente: '',
        clasificacion: '',
        temperatura: '',
      },
      zones: [],

      fetchClients: async (page = 1, limit = 20, append = false, ignoreFilters = false) => {
        set({ loading: true });
        try {
          get().fetchZones();
          const { filters } = get();
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            _t: Date.now().toString(),
          });

          if (!ignoreFilters) {
            if (filters.searchQuery) queryParams.append('search', filters.searchQuery);
            if (filters.tarifa) queryParams.append('tarifa', filters.tarifa);
            if (filters.zona) queryParams.append('zona', filters.zona);
            if (filters.asignadoA) queryParams.append('asignadoA', filters.asignadoA);
            if (filters.clasificacion) queryParams.append('clasificacion', filters.clasificacion);
            if (filters.estado) queryParams.append('estado', filters.estado);
            if (filters.fechaDesde) queryParams.append('startDate', filters.fechaDesde);
            if (filters.fechaHasta) queryParams.append('endDate', filters.fechaHasta);
          }

          const response = await api.get(`/crm/clientes?${queryParams.toString()}`);
          
          let rawData = [];
          let total = 0;
          let totalP = 1;

          if (response && response.data && Array.isArray(response.data)) {
            rawData = response.data;
            total = response.total || rawData.length;
            totalP = response.totalPages || 1;
          } else if (Array.isArray(response)) {
            rawData = response;
            total = rawData.length;
          }

          const parsedClients = rawData.map((c: any) => ({
            ...c,
            hallazgosTecnicos: safeJsonParse(c.hallazgosTecnicos),
            solucionesPropuestas: safeJsonParse(c.solucionesPropuestas),
            historialInteracciones: c.interacciones || [],
            archivosAdjuntos: c.documentos || []
          }));

          if (append) {
            set((state) => ({
              clients: [...state.clients, ...parsedClients],
              totalClients: total,
              page: page,
              totalPages: totalP,
              loading: false
            }));
          } else {
            set({ 
              clients: parsedClients, 
              totalClients: total,
              page: page,
              totalPages: totalP,
              loading: false 
            });
          }
        } catch (error) {
          console.error("Error fetching clients:", error);
          set({ loading: false });
        }
      },

      fetchQuotes: async (page = 1, limit = 20) => {
        set({ loading: true });
        try {
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });
          
          const response = await api.get(`/crm/cotizaciones?${queryParams.toString()}`);
          
          let rawData = [];
          let total = 0;
          let totalP = 1;

          if (response && response.data && Array.isArray(response.data)) {
            rawData = response.data;
            total = response.total || rawData.length;
            totalP = response.totalPages || 1;
          } else if (Array.isArray(response)) {
            rawData = response;
            total = rawData.length;
          }

          const parsedQuotes = rawData.map((q: any) => ({
            ...q,
            empresa: q.cliente?.empresa || "Sin Empresa",
            contacto: q.cliente?.contacto || "Sin Contacto",
            alcance: safeJsonParse(q.alcance)
          }));
          set({ 
            quotes: parsedQuotes, 
            totalQuotes: total,
            quotePage: page,
            quoteLimit: limit,
            quoteTotalPages: totalP,
            loading: false 
          });
        } catch (error) {
          console.error("Error fetching quotes:", error);
          set({ loading: false });
        }
      },

      fetchClientById: async (id) => {
        try {
          const c = await api.get(`/crm/clientes/${id}`);
          if (!c) return null;

          const parsedClient = {
            ...c,
            hallazgosTecnicos: safeJsonParse(c.hallazgosTecnicos),
            solucionesPropuestas: safeJsonParse(c.solucionesPropuestas),
            historialInteracciones: c.interacciones || [],
            archivosAdjuntos: c.documentos || []
          };

          // Actualizar el cliente en la lista local si existe
          set((state) => ({
            clients: state.clients.map(cl => cl.id === id ? parsedClient : cl)
          }));

          return parsedClient;
        } catch (error) {
          console.error(`Error fetching client ${id}:`, error);
          return null;
        }
      },

      fetchZones: async () => {
        try {
          const zones = await api.get('/crm/zonas');
          if (Array.isArray(zones)) {
            set({ zones });
          }
        } catch (error) {
          console.error("Error fetching zones:", error);
        }
      },

      setView: (view) => set({ view }),
      setSearchQuery: (query) => set((state) => ({ page: 1, filters: { ...state.filters, searchQuery: query } })),
      setTarifa: (tarifa) => set((state) => ({ page: 1, filters: { ...state.filters, tarifa } })),
      setAsignadoA: (asignadoA) => set((state) => ({ page: 1, filters: { ...state.filters, asignadoA } })),
      setEstado: (estado) => set((state) => ({ page: 1, filters: { ...state.filters, estado } })),
      setEtapaComercial: (etapaComercial) => set((state) => ({ page: 1, filters: { ...state.filters, etapaComercial } })),
      setPrioridad: (prioridad) => set((state) => ({ page: 1, filters: { ...state.filters, prioridad } })),
      setZona: (zona) => set((state) => ({ page: 1, filters: { ...state.filters, zona } })),
      setTipoCliente: (tipoCliente) => set((state) => ({ page: 1, filters: { ...state.filters, tipoCliente } })),
      setClasificacion: (clasificacion) => set((state) => ({ page: 1, filters: { ...state.filters, clasificacion } })),
      setFechaRango: (desde, hasta) => set((state) => ({ 
        page: 1,
        filters: { ...state.filters, fechaDesde: desde, fechaHasta: hasta } 
      })),
      resetFilters: () => set({
        page: 1,
        filters: {
          searchQuery: '',
          tarifa: '',
          asignadoA: '',
          estado: '',
          etapaComercial: '',
          prioridad: '',
          zona: '',
          tipoCliente: '',
          clasificacion: '',
          temperatura: '',
        }
      }),

      addClient: async (clientData) => {
        set({ loading: true });
        try {
          const payload = {
            ...clientData,
            semaforo: (clientData as any).semaforo || "Verde",
            temperatura: (clientData as any).temperatura || "Tibio",
            montoEstimado: safeNumber((clientData as any).montoEstimado),
            ventaProyectada: safeNumber((clientData as any).ventaProyectada),
            probabilidad: safeNumber((clientData as any).probabilidad),
          };

          if (!payload.accion) payload.accion = "Sin definir";
          if (!payload.proximoSeguimiento) delete (payload as any).proximoSeguimiento;

          await api.post('/crm/clientes', payload);
          await get().fetchClients(1);
        } catch (error) {
          console.error("Error adding client:", error);
          throw error;
        }
      },

      updateClient: async (client) => {
        set({ loading: true });
        try {
          const { 
            id, 
            interacciones, 
            documentos, 
            proyectos, 
            historialInteracciones, 
            archivosAdjuntos,
            fechaCreacion,
            fechaActualizacion,
            deletedAt,
            _count,
            creadoPor,
            responsable,
            actividadesComerciales,
            fichasTecnicas,
            cotizaciones,
            facturas,
            ...data 
          } = client as any;
          
          const payload = {
            ...data,
            montoEstimado: safeNumber(data.montoEstimado),
            ventaProyectada: safeNumber(data.ventaProyectada),
            probabilidad: safeNumber(data.probabilidad),
          };
          
          if (!payload.accion) payload.accion = "Sin definir";
          if (!payload.proximoSeguimiento) delete (payload as any).proximoSeguimiento;
          
          await api.put(`/crm/clientes/${id}`, payload);
          await get().fetchClients(1);
        } catch (error) {
          console.error("Error updating client:", error);
          throw error;
        }
      },

      deleteClient: async (id) => {
        try {
          await api.delete(`/crm/clientes/${id}`);
          await get().fetchClients(1);
        } catch (error) {
          console.error("Error deleting client:", error);
          throw error;
        }
      },

      addInteraction: async (clientId, data) => {
        try {
          await api.post('/crm/interacciones', { ...data, clientId });
          await get().fetchClients(1);
        } catch (error) {
          console.error("Error adding interaction:", error);
        }
      },

      reassignSeller: async (clientId, seller) => {
        try {
          const client = get().clients.find(c => c.id === clientId);
          if (!client) return;
          
          const { 
            id: _, 
            interacciones, 
            documentos, 
            proyectos, 
            historialInteracciones, 
            archivosAdjuntos,
            fechaCreacion,
            fechaActualizacion,
            deletedAt,
            _count,
            creadoPor,
            responsable,
            actividadesComerciales,
            fichasTecnicas,
            cotizaciones,
            facturas,
            ...data 
          } = client as any;
          
          await api.put(`/crm/clientes/${clientId}`, { 
            ...data, 
            asignadoA: seller,
            montoEstimado: safeNumber(data.montoEstimado),
            ventaProyectada: safeNumber(data.ventaProyectada),
            probabilidad: safeNumber(data.probabilidad),
          });
          
          await get().fetchClients(1);
          toast.success("Asesor Reasignado", { description: `El cliente ahora está asignado a ${seller}.` });
        } catch (error) {
          console.error("Error reassigning seller:", error);
          toast.error("Error al Reasignar", { description: "No se pudo actualizar el asesor." });
        }
      },

      attachFile: async (clientId, fileData) => {
        try {
          await api.post('/crm/documentos', { ...fileData, clientId });
          await get().fetchClients(1);
          toast.success("Archivo Adjunto", { description: "El documento se vinculó al cliente exitosamente." });
        } catch (error) {
          console.error("Error attaching file:", error);
          toast.error("Error al Adjuntar", { description: "No se pudo vincular el archivo." });
        }
      },

      attachQuoteFile: async (cotizacionId, clientId, fileData) => {
        try {
          await api.post('/crm/documentos', { ...fileData, cotizacionId, clientId });
          await get().fetchQuotes();
          toast.success("Documento Contractual", { description: "La Orden de Servicio/Contrato ha sido vinculada." });
        } catch (error) {
          console.error("Error attaching quote file:", error);
          toast.error("Error al Adjuntar", { description: "No se pudo vincular el documento contractual." });
        }
      },

      uploadClientFile: async (file: File) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await api.post('/crm/upload', formData);
          return response;
        } catch (error) {
          console.error("Error uploading client file:", error);
          throw error;
        }
      },

      deleteFile: async (clientId, fileId) => {
        try {
          await api.delete(`/crm/documentos/${fileId}`);
          await get().fetchClients(1);
          toast.success("Archivo Eliminado", { description: "El documento fue removido." });
        } catch (error) {
          console.error("Error deleting file:", error);
          toast.error("Error al Eliminar", { description: "No se pudo borrar el archivo." });
        }
      },

      addQuote: async (quote) => {
        set({ loading: true });
        try {
          const { empresa, contacto, ...cleanData } = quote as any;
          await api.post('/crm/cotizaciones', cleanData);
          await get().fetchQuotes();
        } catch (error) {
          console.error("Error adding quote:", error);
          throw error;
        }
      },

      uploadQuoteFile: async (file: File) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const response = await api.post('/crm/cotizaciones/upload', formData);
          return response;
        } catch (error) {
          console.error("Error uploading quote file:", error);
          throw error;
        }
      },

      importQuotes: async (quotesData) => {
        set({ loading: true });
        try {
          await api.post('/crm/cotizaciones/bulk', quotesData);
          await get().fetchQuotes();
        } catch (error) {
          console.error("Error importing quotes:", error);
        } finally {
          set({ loading: false });
        }
      },

      importClients: async (clientsData) => {
        set({ loading: true });
        try {
          const sanitizedData = clientsData.map(c => ({
            ...c,
            montoEstimado: safeNumber(c.montoEstimado),
            ventaProyectada: safeNumber(c.ventaProyectada),
            probabilidad: safeNumber(c.probabilidad),
          }));
          await api.post('/crm/clientes/bulk', sanitizedData);
          await get().fetchClients(1);
          toast.success(`${clientsData.length} clientes importados.`);
        } catch (error) {
          console.error("Error importing clients:", error);
          toast.error("Error al importar clientes");
        } finally {
          set({ loading: false });
        }
      },

      updateQuote: async (updatedQuote) => {
        try {
          const { 
            id, cliente, documentos, interacciones, empresa, contacto, codigo, fechaCreacion, fechaActualizacion, proyectoGenerado, proyectoGeneradoId, hitosPago, ...cleanData 
          } = updatedQuote as any;
          const payload = {
            ...cleanData,
            fecha: cleanData.fecha ? new Date(cleanData.fecha).toISOString() : new Date().toISOString()
          };
          await api.put(`/crm/cotizaciones/${id}`, payload);
          await get().fetchQuotes();
          return { success: true, quoteStatus: payload.estado };
        } catch (error) {
          console.error("Error updating quote:", error);
          throw error;
        }
      },

      deleteQuote: async (id) => {
        try {
          await api.delete(`/crm/cotizaciones/${id}`);
          await get().fetchQuotes();
        } catch (error: any) {
          console.error("Error deleting quote:", error);
          throw error;
        }
      },

      cloneQuote: async (id) => {
        try {
          const originalQuote = get().quotes.find(q => q.id === id);
          if (!originalQuote) return;
          const newVersion = (originalQuote.version || 1) + 1;
          const { id: _, codigo: __, ...rest } = originalQuote;
          const payload = { ...rest, version: newVersion, cotizacionPadreId: originalQuote.id, fecha: new Date().toISOString() };
          await api.post('/crm/cotizaciones', payload);
          await get().fetchQuotes();
        } catch (error) {
          console.error("Error cloning quote:", error);
          alert("Error al generar la revisión.");
        }
      },

      changeStage: async (id, newStage) => {
        try {
          const client = get().clients.find(c => c.id === id);
          if (!client) return;

          if (client.etapaComercial === 'Ganado' && newStage !== 'Ganado') {
            toast.error("Acción Bloqueada", { 
              description: "No se puede cambiar el estado de un cliente que ya ha sido marcado como GANADO." 
            });
            return;
          }

          const { 
            id: _, 
            interacciones, 
            documentos, 
            proyectos, 
            historialInteracciones, 
            archivosAdjuntos,
            fechaCreacion,
            fechaActualizacion,
            deletedAt,
            _count,
            creadoPor,
            responsable,
            actividadesComerciales,
            fichasTecnicas,
            cotizaciones,
            facturas,
            ...data 
          } = client as any;
          
          const payload: any = { 
            ...data, 
            etapaComercial: newStage, 
            montoEstimado: safeNumber(data.montoEstimado), 
            ventaProyectada: safeNumber(data.ventaProyectada), 
            probabilidad: safeNumber(data.probabilidad) 
          };

          // Programación automática de fidelización si es GANADO
          if (newStage === 'Ganado') {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 30);
            payload.proximoSeguimiento = nextDate.toISOString();
            payload.accion = "Fidelización Mensual (Post-Venta)";
          }

          set((state) => ({ 
            clients: state.clients.map(c => c.id === id ? { 
              ...c, 
              etapaComercial: newStage,
              proximoSeguimiento: payload.proximoSeguimiento || c.proximoSeguimiento,
              accion: payload.accion || c.accion
            } : c) 
          }));

          await api.put(`/crm/clientes/${id}`, payload);
          const response = await api.get(`/crm/clientes/${id}`);
          if (response) { set((state) => ({ clients: state.clients.map(c => c.id === id ? response : c) })); }
        } catch (error) {
          console.error("Error changing stage:", error);
          await get().fetchClients(1);
        }
      },

      scheduleFollowUp: async (clientId, fecha, accion, tipo, uploadedUrl?) => {
        try {
          const user = useAuthStore.getState().user;
          let finalObs = accion;
          if (uploadedUrl) {
            finalObs = `${accion ? accion + '\n' : ''}[IMG]${uploadedUrl}[/IMG]`;
          }
          await api.post('/crm/interacciones', { clientId, fecha: new Date().toISOString(), tipo, accion: 'Seguimiento registrado', observaciones: finalObs, usuario: user?.nombre || 'Admin' });
          const client = get().clients.find(c => c.id === clientId);
          if (client) {
            const { id: _, interacciones, documentos, proyectos, historialInteracciones, archivosAdjuntos, fechaCreacion, fechaActualizacion, deletedAt, _count, ...cleanData } = client as any;
            await api.put(`/crm/clientes/${clientId}`, { ...cleanData, proximoSeguimiento: fecha, accion: accion, ultimoContacto: new Date().toISOString(), montoEstimado: safeNumber(cleanData.montoEstimado), ventaProyectada: safeNumber(cleanData.ventaProyectada), probabilidad: safeNumber(cleanData.probabilidad) });
          }
          await get().fetchClients(1);
        } catch (error) {
          console.error("Error scheduling follow up:", error);
          throw error;
        }
      },

      scheduleTechnicalVisit: async (clientId, tecnicoId, fecha, observaciones, adjuntos) => {
        try {
          const user = useAuthStore.getState().user;
          const client = get().clients.find(c => c.id === clientId);
          await api.post('/crm/actividades', { clienteId: clientId, usuarioId: user?.id || 'Sistema', tipoActividad: 'VISITA_TECNICA', descripcion: observaciones, fechaActividad: fecha, estado: 'PENDIENTE', tecnicoId, clienteNombre: client?.empresa || 'Empresa' });
          await api.post('/operaciones/fichas-tecnicas', { clienteId: clientId, tecnicoId: tecnicoId, fechaVisita: fecha, observaciones: observaciones, estado: 'PENDIENTE', adjuntos: adjuntos || [] });
          // La Bitácora de CRM se registrará automáticamente desde el backend al crear la ficha técnica.

          await get().changeStage(clientId, 'Visita Agendada');
          await get().fetchClients(1);
        } catch (error) {
          console.error("Error scheduling technical visit:", error);
          throw error;
        }
      },
    }),
    {
      name: 'hht-crm-store-db-only', 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ...state,
        quotes: [],
        clients: [],
        filters: {
          searchQuery: '',
          tarifa: '',
          asignadoA: '',
          estado: '',
          etapaComercial: '',
          prioridad: '',
          zona: '',
          tipoCliente: '',
          clasificacion: '',
          temperatura: '',
        }
      }),
    }
  )
);
