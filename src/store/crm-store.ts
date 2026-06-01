import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CRM_DATA, Client, Interaction, AttachedFile } from '@/mocks/data';

export type Quote = {
  id: string;
  clientId: string;
  empresa: string;
  contacto: string;
  monto: number;
  estado: "Pendiente" | "Enviado" | "Aprobado" | "Rechazado";
  fecha: string;
  validez?: string;
  observaciones?: string;
};


export const getDaysSinceContact = (ultimoContacto: string | undefined): number => {
  if (!ultimoContacto) return 999;
  const lastDate = new Date(ultimoContacto);
  if (isNaN(lastDate.getTime())) return 999;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parse date manually to avoid timezone shifts
  const [year, month, day] = ultimoContacto.split('-').map(Number);
  const contactDate = new Date(year, month - 1, day);
  contactDate.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - contactDate.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};

export const isFollowUpOverdue = (client: { proximoSeguimiento?: string; etapaComercial?: string }): boolean => {
  if (client.etapaComercial === "Ganado" || client.etapaComercial === "Perdido") return false;
  if (!client.proximoSeguimiento) return true; // Alert if missing
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [year, month, day] = client.proximoSeguimiento.split('-').map(Number);
  const followUpDate = new Date(year, month - 1, day);
  followUpDate.setHours(0, 0, 0, 0);
  
  return followUpDate < today;
};

export const calculateClientSemaforo = (client: {
  proximoSeguimiento?: string;
  ultimoContacto?: string;
  temperatura?: string;
  etapaComercial?: string;
}): "Verde" | "Amarillo" | "Rojo" => {
  if (client.etapaComercial === "Ganado" || client.etapaComercial === "Perdido") {
    return "Verde";
  }

  // 1. Red: overdue follow-up, missing follow-up, or more than 15 days without contact
  const isOverdue = isFollowUpOverdue(client);
  const daysSinceContact = getDaysSinceContact(client.ultimoContacto);
  
  if (isOverdue || !client.proximoSeguimiento || daysSinceContact > 15) {
    return "Rojo";
  }

  // 2. Green: recent contact (<= 7 days) and hot/very hot temperature
  const isHot = client.temperatura === "Caliente" || client.temperatura === "Muy Caliente";
  if (daysSinceContact <= 7 && isHot) {
    return "Verde";
  }

  // 3. Yellow: moderate or other cases
  return "Amarillo";
};

interface CRMFilters {
  searchQuery: string;
  tarifa: string;
  asignadoA: string;
  estado: string;
  etapaComercial: string;
  temperatura: string;
  prioridad: string;
  zona: string;
  tipoCliente: string;
}

interface CRMState {
  clients: Client[];
  quotes: Quote[];
  view: 'table' | 'kanban';
  filters: CRMFilters;
  setView: (view: 'table' | 'kanban') => void;
  setSearchQuery: (query: string) => void;
  setTarifa: (tarifa: string) => void;
  setAsignadoA: (asignadoA: string) => void;
  setEstado: (estado: string) => void;
  setEtapaComercial: (etapaComercial: string) => void;
  setTemperatura: (temperatura: string) => void;
  setPrioridad: (prioridad: string) => void;
  setZona: (zona: string) => void;
  setTipoCliente: (tipoCliente: string) => void;
  resetFilters: () => void;
  
  // Client Actions
  addClient: (client: Omit<Client, 'id' | 'codigo' | 'ventaProyectada' | 'semaforo'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  scheduleFollowUp: (id: string, date: string, action: string) => void;
  addInteraction: (clientId: string, type: Interaction['tipo'], action: string, observations: string, user: string) => void;
  attachFile: (clientId: string, file: Omit<AttachedFile, 'id' | 'fecha'>) => void;
  deleteFile: (clientId: string, fileId: string) => void;
  importClients: (newClients: Client[]) => void;
  changeStage: (clientId: string, stage: Client['etapaComercial']) => void;
  reassignSeller: (clientId: string, seller: string) => void;

  // Quote Actions
  addQuote: (quote: Omit<Quote, 'id'>) => void;
  updateQuote: (quote: Quote) => void;
  deleteQuote: (id: string) => void;
  importQuotes: (newQuotes: (Omit<Quote, 'id'>)[]) => void;
}

export const useCRMStore = create<CRMState>()(
  persist(
    (set) => ({
      clients: CRM_DATA,
      quotes: [
        { id: "Q-001", clientId: "1", empresa: "RIO VERDE", contacto: "Juan Perez", monto: 15000, estado: "Enviado", fecha: "2026-05-20" },
        { id: "Q-002", clientId: "2", empresa: "TALLANES PACKERS", contacto: "Maria Garcia", monto: 25000, estado: "Pendiente", fecha: "2026-05-22" }
      ],
      view: 'table',
      filters: {
        searchQuery: '',
        tarifa: 'all',
        asignadoA: 'all',
        estado: 'all',
        etapaComercial: 'all',
        temperatura: 'all',
        prioridad: 'all',
        zona: 'all',
        tipoCliente: 'all',
      },
      setView: (view) => set({ view }),
      setSearchQuery: (query) => set((state) => ({
        filters: { ...state.filters, searchQuery: query }
      })),
      setTarifa: (tarifa) => set((state) => ({
        filters: { ...state.filters, tarifa }
      })),
      setAsignadoA: (asignadoA) => set((state) => ({
        filters: { ...state.filters, asignadoA }
      })),
      setEstado: (estado) => set((state) => ({
        filters: { ...state.filters, estado }
      })),
      setEtapaComercial: (etapaComercial) => set((state) => ({
        filters: { ...state.filters, etapaComercial }
      })),
      setTemperatura: (temperatura) => set((state) => ({
        filters: { ...state.filters, temperatura }
      })),
      setPrioridad: (prioridad) => set((state) => ({
        filters: { ...state.filters, prioridad }
      })),
      setZona: (zona) => set((state) => ({
        filters: { ...state.filters, zona }
      })),
      setTipoCliente: (tipoCliente) => set((state) => ({
        filters: { ...state.filters, tipoCliente }
      })),
      resetFilters: () => set({
        filters: {
          searchQuery: '',
          tarifa: 'all',
          asignadoA: 'all',
          estado: 'all',
          etapaComercial: 'all',
          temperatura: 'all',
          prioridad: 'all',
          zona: 'all',
          tipoCliente: 'all',
        }
      }),
      addClient: (clientData) => set((state) => {
        const nextId = (Math.max(...state.clients.map(c => parseInt(c.id) || 0), 0) + 1).toString();
        const code = `HHT-CRM-${nextId.padStart(3, '0')}`;
        const ventaProyectada = (clientData.montoEstimado || 0) * (clientData.probabilidad || 0);
        
        const newClient: Client = {
          ...clientData,
          id: nextId,
          codigo: code,
          ventaProyectada,
          semaforo: calculateClientSemaforo({
            proximoSeguimiento: clientData.proximoSeguimiento,
            ultimoContacto: clientData.ultimoContacto,
            temperatura: clientData.temperatura,
            etapaComercial: clientData.etapaComercial
          }),
          historialInteracciones: clientData.historialInteracciones || [],
          archivosAdjuntos: clientData.archivosAdjuntos || []
        };
        return { clients: [newClient, ...state.clients] };
      }),
      updateClient: (updatedClient) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.id !== updatedClient.id) return c;
          const ventaProyectada = (updatedClient.montoEstimado || 0) * (updatedClient.probabilidad || 0);
          const semaforo = calculateClientSemaforo({
            proximoSeguimiento: updatedClient.proximoSeguimiento,
            ultimoContacto: updatedClient.ultimoContacto,
            temperatura: updatedClient.temperatura,
            etapaComercial: updatedClient.etapaComercial
          });
          return {
            ...updatedClient,
            ventaProyectada,
            semaforo
          };
        })
      })),
      deleteClient: (id) => set((state) => ({
        clients: state.clients.filter((c) => c.id !== id)
      })),
      scheduleFollowUp: (id, date, action) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.id !== id) return c;
          
          const today = new Date().toISOString().split('T')[0];
          const newInteraction: Interaction = {
            id: `int_${Date.now()}`,
            fecha: today,
            tipo: "Llamada",
            accion: `Seguimiento programado: ${action}`,
            observaciones: `Se agendó próxima acción para el ${date}.`,
            usuario: c.asignadoA || "Sistema"
          };
          
          const updatedClient = {
            ...c,
            ultimoContacto: today,
            proximoSeguimiento: date,
            accion: action,
            historialInteracciones: [newInteraction, ...(c.historialInteracciones || [])]
          };
          
          const semaforo = calculateClientSemaforo(updatedClient);
          return { ...updatedClient, semaforo };
        })
      })),
      addInteraction: (clientId, type, action, observations, user) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.id !== clientId) return c;
          const today = new Date().toISOString().split('T')[0];
          const newInteraction: Interaction = {
            id: `int_${Date.now()}`,
            fecha: today,
            tipo: type,
            accion: action,
            observaciones: observations,
            usuario: user
          };
          
          const updatedClient = {
            ...c,
            ultimoContacto: today,
            historialInteracciones: [newInteraction, ...(c.historialInteracciones || [])]
          };
          
          const semaforo = calculateClientSemaforo(updatedClient);
          return { ...updatedClient, semaforo };
        })
      })),
      attachFile: (clientId, fileData) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.id !== clientId) return c;
          const newFile: AttachedFile = {
            ...fileData,
            id: `file_${Date.now()}`,
            fecha: new Date().toISOString().split('T')[0]
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
      importClients: (newClients) => set((state) => {
        // Build map of existing RUCs to avoid duplicates, or merge them.
        // Let's merge or replace if RUC matches, otherwise append.
        const existingRucs = new Map(state.clients.map(c => [c.ruc, c]));
        let lastId = Math.max(...state.clients.map(c => parseInt(c.id) || 0), 0);
        
        const processedClients = newClients.map((client) => {
          const existing = existingRucs.get(client.ruc);
          if (existing) {
            // Update existing client
            const merged = {
              ...existing,
              ...client,
              id: existing.id,
              codigo: existing.codigo,
              ventaProyectada: (client.montoEstimado || 0) * (client.probabilidad || 0),
              semaforo: calculateClientSemaforo(client)
            };
            existingRucs.set(client.ruc, merged);
            return null; // will filter out
          } else {
            lastId += 1;
            const newId = lastId.toString();
            const code = `HHT-CRM-${newId.padStart(3, '0')}`;
            return {
              ...client,
              id: newId,
              codigo: code,
              ventaProyectada: (client.montoEstimado || 0) * (client.probabilidad || 0),
              semaforo: calculateClientSemaforo(client),
              historialInteracciones: client.historialInteracciones || [],
              archivosAdjuntos: client.archivosAdjuntos || []
            };
          }
        }).filter((c) => c !== null) as Client[];
        
        // Combine unchanged/updated existing clients with new ones
        const updatedExisting = Array.from(existingRucs.values());
        return { clients: [...processedClients, ...updatedExisting] };
      }),
      changeStage: (clientId, stage) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.id !== clientId) return c;
          const updatedClient = { ...c, etapaComercial: stage };
          const semaforo = calculateClientSemaforo(updatedClient);
          return { ...updatedClient, semaforo };
        })
      })),
      reassignSeller: (clientId, seller) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.id !== clientId) return c;
          return { ...c, asignadoA: seller };
        })
      })),
      addQuote: (quoteData) => set((state) => {
        const nextId = (Math.max(...state.quotes.map(q => parseInt(q.id.replace('Q-', '')) || 0), 0) + 1).toString();
        const newQuote: Quote = {
          ...quoteData,
          id: `Q-${nextId.padStart(3, '0')}`
        };
        return { quotes: [newQuote, ...state.quotes] };
      }),
      updateQuote: (updatedQuote) => set((state) => ({
        quotes: state.quotes.map((q) => q.id === updatedQuote.id ? updatedQuote : q)
      })),
      deleteQuote: (id) => set((state) => ({
        quotes: state.quotes.filter((q) => q.id !== id)
      })),
      importQuotes: (newQuotes) => set((state) => {
        let lastId = Math.max(...state.quotes.map(q => parseInt(q.id.replace('Q-', '')) || 0), 0);
        const processedQuotes = newQuotes.map(q => {
          lastId += 1;
          return { ...q, id: `Q-${lastId.toString().padStart(3, '0')}` } as Quote;
        });
        return { quotes: [...processedQuotes, ...state.quotes] };
      }),
    }),
    {
      name: 'hht-crm-store',
    }
  )
);