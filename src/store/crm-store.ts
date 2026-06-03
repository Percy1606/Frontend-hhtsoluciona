import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import { useAuthStore } from './auth-store';
import { Client, Interaction, AttachedFile } from '@/types/crm';

export type Quote = {
  id: string;
  clientId: string;
  empresa: string;
  contacto: string;
  monto: number;
  estado: "Pendiente" | "Enviado" | "Aprobado" | "Rechazado" | "Obsoleto" | "Revisado" | "Aprobada";
  fecha: string;
  validez?: string;
  observaciones?: string;
  codigo?: string;
  referencia?: string;
  objetivo?: string;
  alcance?: any;
  consideraciones?: string;
  entregables?: string;
  plazo?: string;
  formaPago?: string;
  version?: number;
  interacciones?: Interaction[];
  documentos?: any[];
};


export const getDaysSinceContact = (ultimoContacto: string | undefined | null): number => {
  if (!ultimoContacto) return 999;
  try {
    const today = new Date();
    // Normalizamos hoy a medianoche local para comparar solo fechas
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Extraemos solo la parte de la fecha YYYY-MM-DD
    const dateStr = ultimoContacto.includes('T') ? ultimoContacto.split('T')[0] : ultimoContacto;
    const [y, m, d] = dateStr.split('-').map(Number);
    
    // Creamos la fecha del último contacto a medianoche local
    const lastDateLocal = new Date(y, m - 1, d);
    
    if (isNaN(lastDateLocal.getTime())) return 999;
    
    // Calculamos la diferencia en milisegundos
    const diffTime = todayLocal.getTime() - lastDateLocal.getTime();
    
    // Convertimos a días (86400000 ms = 1 día)
    // Usamos Math.floor para contar días completos transcurridos
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Si la fecha es hoy, diffTime es 0, days es 0.
    // Si la fecha fue anteayer (01/06) y hoy es (03/06), diffTime es 2 días en ms, days es 2.
    return Math.max(0, days);
  } catch (e) {
    return 999;
  }
};

export const isFollowUpOverdue = (client: { proximoSeguimiento?: string | null; etapaComercial?: string }): boolean => {
  if (client.etapaComercial === "Ganado" || client.etapaComercial === "Perdido") return false;
  if (!client.proximoSeguimiento) return false; 
  
  try {
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const dateStr = client.proximoSeguimiento.includes('T') ? client.proximoSeguimiento.split('T')[0] : client.proximoSeguimiento;
    const [y, m, d] = dateStr.split('-').map(Number);
    const followUpDate = new Date(y, m - 1, d);
    
    if (isNaN(followUpDate.getTime())) return false;
    
    return followUpDate < todayLocal;
  } catch (e) {
    return false;
  }
};

export const calculateClientSemaforo = (client: {
  proximoSeguimiento?: string | null;
  ultimoContacto?: string | null;
  etapaComercial?: string;
}): "Verde" | "Amarillo" | "Rojo" => {
  if (client.etapaComercial === "Ganado" || client.etapaComercial === "Perdido") {
    return "Verde";
  }

  const isOverdue = isFollowUpOverdue(client);
  const daysSinceContact = getDaysSinceContact(client.ultimoContacto);
  
  if (isOverdue || daysSinceContact > 15) {
    return "Rojo";
  }

  if (daysSinceContact <= 7 && daysSinceContact !== 999) {
    return "Verde";
  }

  return "Amarillo";
};

interface CRMFilters {
  searchQuery: string;
  tarifa: string;
  asignadoA: string;
  estado: string;
  etapaComercial: string;
  prioridad: string;
  zona: string;
  tipoCliente: string;
  temperatura: string; 
}

interface CRMState {
  clients: Client[];
  quotes: Quote[];
  loading: boolean;
  view: 'table' | 'kanban';
  filters: CRMFilters;
  
  fetchClients: () => Promise<void>;
  fetchQuotes: () => Promise<void>;
  setView: (view: 'table' | 'kanban') => void;
  setSearchQuery: (query: string) => void;
  setTarifa: (tarifa: string) => void;
  setAsignadoA: (asignadoA: string) => void;
  setEstado: (estado: string) => void;
  setEtapaComercial: (etapaComercial: string) => void;
  setPrioridad: (prioridad: string) => void;
  setZona: (zona: string) => void;
  setTipoCliente: (tipoCliente: string) => void;
  resetFilters: () => void;
  
  addClient: (client: Omit<Client, 'id' | 'codigo' | 'ventaProyectada' | 'semaforo'>) => Promise<void>;
  importClients: (clients: Partial<Client>[]) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  scheduleFollowUp: (id: string, date: string, action: string, type?: Interaction['tipo']) => Promise<void>;
  addInteraction: (clientId: string, type: Interaction['tipo'], action: string, observaciones: string, user: string) => Promise<void>;
  attachFile: (clientId: string, file: Omit<AttachedFile, 'id' | 'fecha'>) => void;
  deleteFile: (clientId: string, fileId: string) => void;
  changeStage: (clientId: string, stage: Client['etapaComercial']) => Promise<void>;
  reassignSeller: (clientId: string, seller: string) => Promise<void>;
  uploadQuoteFile: (file: File) => Promise<any>;

  addQuote: (quote: Omit<Quote, 'id'>) => Promise<void>;
  importQuotes: (quotes: Partial<Quote>[]) => Promise<void>;
  updateQuote: (quote: Quote) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  cloneQuote: (id: string) => Promise<void>;
}

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      clients: [], 
      quotes: [],
      loading: false,
      view: 'table',
      filters: {
        searchQuery: '',
        tarifa: 'all',
        asignadoA: 'all',
        estado: 'all',
        etapaComercial: 'all',
        prioridad: 'all',
        zona: 'all',
        tipoCliente: 'all',
        temperatura: 'all',
      },

      fetchClients: async () => {
        set({ loading: true });
        try {
          const clients = await api.get('/crm/clientes');
          const parsedClients = clients.map((c: any) => ({
            ...c,
            hallazgosTecnicos: typeof c.hallazgosTecnicos === 'string' ? JSON.parse(c.hallazgosTecnicos) : (c.hallazgosTecnicos || []),
            solucionesPropuestas: typeof c.solucionesPropuestas === 'string' ? JSON.parse(c.solucionesPropuestas) : (c.solucionesPropuestas || []),
            historialInteracciones: c.interacciones || [],
            archivosAdjuntos: c.documentos || []
          }));
          set({ clients: parsedClients, loading: false });
        } catch (error) {
          console.error("Error fetching clients:", error);
          set({ loading: false });
        }
      },

      fetchQuotes: async () => {
        set({ loading: true });
        try {
          const quotes = await api.get('/crm/cotizaciones');
          const parsedQuotes = quotes.map((q: any) => ({
            ...q,
            empresa: q.cliente?.empresa || "Sin Empresa",
            contacto: q.cliente?.contacto || "Sin Contacto",
            alcance: typeof q.alcance === 'string' ? JSON.parse(q.alcance) : (q.alcance || [])
          }));
          set({ quotes: parsedQuotes, loading: false });
        } catch (error) {
          console.error("Error fetching quotes:", error);
          set({ loading: false });
        }
      },

      setView: (view) => set({ view }),
      setSearchQuery: (query) => set((state) => ({ filters: { ...state.filters, searchQuery: query } })),
      setTarifa: (tarifa) => set((state) => ({ filters: { ...state.filters, tarifa } })),
      setAsignadoA: (asignadoA) => set((state) => ({ filters: { ...state.filters, asignadoA } })),
      setEstado: (estado) => set((state) => ({ filters: { ...state.filters, estado } })),
      setEtapaComercial: (etapaComercial) => set((state) => ({ filters: { ...state.filters, etapaComercial } })),
      setPrioridad: (prioridad) => set((state) => ({ filters: { ...state.filters, prioridad } })),
      setZona: (zona) => set((state) => ({ filters: { ...state.filters, zona } })),
      setTipoCliente: (tipoCliente) => set((state) => ({ filters: { ...state.filters, tipoCliente } })),
      resetFilters: () => set({
        filters: {
          searchQuery: '',
          tarifa: 'all',
          asignadoA: 'all',
          estado: 'all',
          etapaComercial: 'all',
          prioridad: 'all',
          zona: 'all',
          tipoCliente: 'all',
          temperatura: 'all',
        }
      }),
      
      addClient: async (clientData) => {
        try {
          const today = new Date().toISOString();
          const { id, fechaCreacion, fechaActualizacion, interacciones, historialInteracciones, proyectos, documentos, archivosAdjuntos, ...cleanData } = clientData as any;
          
          const payload = {
            ...cleanData,
            semaforo: "Verde",
            ultimoContacto: today, // NUEVO CLIENTE = CONTACTO HOY
            proximoSeguimiento: cleanData.proximoSeguimiento ? new Date(cleanData.proximoSeguimiento).toISOString() : null,
            ventaProyectada: 0,
            probabilidad: 0,
            montoEstimado: 0,
            temperatura: "Tibio",
          };
          
          await api.post('/crm/clientes', payload);
          await get().fetchClients();
        } catch (error) {
          console.error("Error adding client:", error);
        }
      },

      importClients: async (clientsData) => {
        try {
           // We can use the bulk endpoint if the backend supports it, but for safety, mapping through addClient is also fine or just post to bulk.
           // Since we don't have a specific backend bulk method typed in api.ts, we'll try the bulk endpoint or fallback to individual.
           await api.post('/crm/clientes/bulk', clientsData);
           await get().fetchClients();
        } catch (error) {
           console.error("Error importing clients:", error);
        }
      },

      updateClient: async (updatedClient) => {
        try {
          const { id, fechaCreacion, fechaActualizacion, interacciones, historialInteracciones, proyectos, documentos, archivosAdjuntos, ...cleanData } = updatedClient as any;
          
          // Mantenemos el ultimoContacto que ya tenía el cliente en el store
          const existingClient = get().clients.find(c => c.id === id);
          
          const payload = {
            ...cleanData,
            ultimoContacto: existingClient?.ultimoContacto || cleanData.ultimoContacto,
            proximoSeguimiento: cleanData.proximoSeguimiento ? new Date(cleanData.proximoSeguimiento).toISOString() : null,
          };
          
          // Recalculamos semáforo antes de enviar
          payload.semaforo = calculateClientSemaforo(payload);
          
          await api.put(`/crm/clientes/${id}`, payload);
          await get().fetchClients();
        } catch (error) {
          console.error("Error updating client:", error);
        }
      },

      deleteClient: async (id) => {
        try {
          await api.delete(`/crm/clientes/${id}`);
          await get().fetchClients();
        } catch (error) {
          console.error("Error deleting client:", error);
        }
      },

      scheduleFollowUp: async (id, date, action, type = "Llamada") => {
        try {
          const client = get().clients.find(c => c.id === id);
          if (!client) return;
          const today = new Date().toISOString();
          
          // 1. Guardar la interacción
          await api.post('/crm/interacciones', {
            clientId: id,
            tipo: type,
            accion: action,
            observaciones: `Seguimiento registrado. Próxima acción para el ${date}.`,
            usuario: client.asignadoA || "Sistema",
            fecha: today
          });
          
          // 2. Actualizar el cliente (REINICIANDO DÍAS SIN CONTACTO)
          const updatePayload: any = {
            ultimoContacto: today,
            proximoSeguimiento: new Date(date).toISOString(),
            accion: action,
          };
          updatePayload.semaforo = calculateClientSemaforo({
            ...client,
            ...updatePayload
          });

          await api.put(`/crm/clientes/${id}`, updatePayload);
          
          await get().fetchClients();
        } catch (error) {
          console.error("Error scheduling follow up:", error);
        }
      },

      addInteraction: async (clientId, type, action, observaciones, user) => {
        try {
          const today = new Date().toISOString();
          await api.post('/crm/interacciones', {
            clientId,
            tipo: type,
            accion: action,
            observaciones,
            usuario: user,
            fecha: today
          });
          
          // ACTUALIZAMOS ÚLTIMO CONTACTO AL REGISTRAR INTERACCIÓN
          const client = get().clients.find(c => c.id === clientId);
          const updatePayload: any = {
            ultimoContacto: today,
          };
          if (client) {
            updatePayload.semaforo = calculateClientSemaforo({
              ...client,
              ...updatePayload
            });
          } else {
            updatePayload.semaforo = "Verde";
          }

          await api.put(`/crm/clientes/${clientId}`, updatePayload);
          
          await get().fetchClients();
        } catch (error) {
          console.error("Error adding interaction:", error);
        }
      },

      attachFile: (clientId, fileData) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.id !== clientId) return c;
          const newFile: AttachedFile = {
            ...fileData,
            id: `file_${Date.now()}`,
            fecha: new Date().toISOString()
          };
          return {
            ...c,
            archivosAdjuntos: [newFile, ...(c.archivosAdjuntos || [])]
          };
        })
      })),

      deleteFile: (clientId, fileId) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.id !== clientId) return c;
          return {
            ...c,
            archivosAdjuntos: (c.archivosAdjuntos || []).filter(f => f.id !== fileId)
          };
        })
      })),

      changeStage: async (clientId, stage) => {
        try {
          await api.put(`/crm/clientes/${clientId}`, { etapaComercial: stage });
          await get().fetchClients();
        } catch (error) {
          console.error("Error changing stage:", error);
        }
      },

      reassignSeller: async (clientId, seller) => {
        try {
          await api.put(`/crm/clientes/${clientId}`, { asignadoA: seller });
          await get().fetchClients();
        } catch (error) {
          console.error("Error reassigning seller:", error);
        }
      },

      uploadQuoteFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const response = await api.post('/crm/cotizaciones/upload', formData);
          return response;
        } catch (error) {
          console.error("Error uploading quote file:", error);
          throw error;
        }
      },

      addQuote: async (quoteData) => {
        try {
          const { empresa, contacto, ...cleanData } = quoteData as any;
          const payload = {
            ...cleanData,
            fecha: cleanData.fecha ? new Date(cleanData.fecha).toISOString() : new Date().toISOString()
          };
          await api.post('/crm/cotizaciones', payload);
          await get().fetchQuotes();
        } catch (error) {
          console.error("Error adding quote:", error);
        }
      },

      importQuotes: async (quotesData) => {
        // Implement bulk import logic here if needed
      },

      updateQuote: async (updatedQuote) => {
        try {
          const { 
            id, 
            cliente, 
            documentos, 
            interacciones, 
            empresa, 
            contacto, 
            codigo, 
            fechaCreacion, 
            fechaActualizacion,
            proyectoGeneradoId,
            ...cleanData 
          } = updatedQuote as any;
          const payload = {
            ...cleanData,
            fecha: cleanData.fecha ? new Date(cleanData.fecha).toISOString() : new Date().toISOString()
          };
          
          await api.put(`/crm/cotizaciones/${id}`, payload);
          
          if (payload.estado === "Aprobado") {
            const confirmProj = confirm("¿Deseas registrar este proyecto aprobado en el módulo de Operaciones ahora mismo?");
            if (confirmProj) {
                try {
                    const currentUser = useAuthStore.getState().user;
                    const projectPayload = {
                        clientId: payload.clientId,
                        nombre: `PROYECTO: ${empresa}`,
                        descripcion: `Derivado de Cotización ${updatedQuote.codigo}. ${payload.referencia || ""} ${payload.observaciones || ""}`,
                        estado: "Planificacion",
                        prioridad: "Media",
                        semaforo: "Verde",
                        fechaInicio: new Date().toISOString().split('T')[0],
                        fechaFinEstimada: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                        area: "OperacionesDeCampo",
                        responsablePrincipalId: currentUser?.responsable?.id || currentUser?.id || "",
                    };
                    const newProject = await api.post('/operaciones/proyectos', projectPayload);
                    
                    // VINCULAMOS EL PROYECTO A LA COTIZACIÓN
                    const { 
                        id: qId, 
                        cliente: _c, 
                        documentos: _d, 
                        interacciones: _i, 
                        empresa: _e, 
                        contacto: _con, 
                        codigo: _cod, 
                        fechaCreacion: _fc, 
                        fechaActualizacion: _fa,
                        proyectoGenerado: _pg,
                        ...cleanQuoteData 
                    } = updatedQuote as any;

                    await api.put(`/crm/cotizaciones/${id}`, {
                        ...cleanQuoteData,
                        proyectoGeneradoId: newProject.id,
                        estado: "Aprobado"
                    });

                    alert("¡Proyecto registrado y vinculado exitosamente!");
                } catch (err) {
                    console.error("Error al crear proyecto desde cotización:", err);
                    alert("La cotización se actualizó, pero hubo un error al crear el proyecto en Operaciones.");
                }
            }
          }
          await get().fetchQuotes();
        } catch (error) {
          console.error("Error updating quote:", error);
        }
      },

      deleteQuote: async (id) => {
        try {
          await api.delete(`/crm/cotizaciones/${id}`);
          await get().fetchQuotes();
        } catch (error) {
          console.error("Error deleting quote:", error);
        }
      },

      cloneQuote: async (id) => {
        try {
          const originalQuote = get().quotes.find(q => q.id === id);
          if (!originalQuote) return;

          const newVersion = (originalQuote as any).version ? (originalQuote as any).version + 1 : 2;
          
          const payload = {
            clientId: originalQuote.clientId,
            referencia: originalQuote.referencia,
            objetivo: originalQuote.objetivo,
            alcance: originalQuote.alcance,
            consideraciones: (originalQuote as any).consideraciones,
            entregables: (originalQuote as any).entregables,
            monto: originalQuote.monto,
            plazo: originalQuote.plazo,
            validez: originalQuote.validez,
            formaPago: (originalQuote as any).formaPago,
            observaciones: originalQuote.observaciones,
            estado: "Pendiente", // Reset state for the new revision
            version: newVersion,
            cotizacionPadreId: originalQuote.id,
            fecha: new Date().toISOString()
          };

          await api.post('/crm/cotizaciones', payload);
          await get().fetchQuotes();
          alert(`Revisión v${newVersion} generada con éxito.`);
        } catch (error) {
          console.error("Error cloning quote:", error);
          alert("Error al generar la revisión.");
        }
      },
    }),
    {
      name: 'hht-crm-store-db-only', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);