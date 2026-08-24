"use client";

import { Client } from "@/types/crm";
import { useCRMStore, isFollowUpOverdue } from "@/store/crm-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MoreVertical, 
  Eye, 
  Calendar, 
  Edit, 
  Trash2, 
  AlertCircle,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ShieldAlert,
  Lock,
  Trophy,
  XCircle,
  Clock,
  User,
  Download,
  FileCheck,
  Plus,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { ClientDetails } from "./client-details";
import { ClientForm } from "./client-form";
import { FollowUpModal } from "./follow-up-modal";
import { cn, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ModernDialog, DialogType } from "@/components/ui/modern-dialog";

const columns = [
  { id: "Prospecto", title: "Prospecto", color: "bg-slate-400" },
  { id: "Visita Comercial", title: "Visita Comercial", color: "bg-indigo-500" },
  { id: "Visita Técnica", title: "Visita Técnica", color: "bg-blue-600" },
  { id: "Cotización", title: "Cotización", color: "bg-violet-500" },
  { id: "Negociación", title: "Negociación", color: "bg-orange-500" },
  { id: "Orden de Servicio", title: "Orden de Servicio", color: "bg-emerald-600" },
  { id: "Perdido", title: "Perdido", color: "bg-error" },
];

export function ClientKanban() {
  const { clients, quotes, fetchQuotes, filters, updateClient, deleteClient, changeStage, addInteraction, fetchClients, loading, page, totalPages } = useCRMStore();

  const { responsables } = useOperacionesStore();
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [osModalClient, setOsModalClient] = useState<{ client: Client; quotes: any[] } | null>(null);
  const [visibleItems, setVisibleItems] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const wonQuotesByClient = useMemo(() => {
    const map = new Map<string, number>();
    quotes.forEach((q) => {
      const isWon = ['Ganada', 'Aprobado', 'Aprobada', 'Ganado', 'Orden de Servicio'].includes(q.estado) || !!(q as any).archivoAdjuntoUrl;
      if (isWon) {
        if (q.clientId) {
          map.set(q.clientId, (map.get(q.clientId) || 0) + 1);
        }
        if (q.empresa) {
          const empKey = q.empresa.trim().toLowerCase();
          map.set(empKey, (map.get(empKey) || 0) + 1);
        }
      }
    });
    return map;
  }, [quotes]);

  const getClientDisplayAmount = (client: Client) => {
    const empKey = client.empresa?.trim().toLowerCase() || '';
    const clientWonQuotes = quotes.filter(q => {
      const matchesClient = q.clientId === client.id || (q.empresa && client.empresa && q.empresa.trim().toLowerCase() === empKey);
      const isWon = ['Ganada', 'Aprobado', 'Aprobada', 'Ganado', 'Orden de Servicio'].includes(q.estado) || !!(q as any).archivoAdjuntoUrl;
      return matchesClient && isWon;
    });
    if (clientWonQuotes.length > 0) {
      return clientWonQuotes.reduce((sum, q) => sum + Number(q.monto || 0), 0);
    }
    return Number(client.ventaProyectada) || Number(client.montoEstimado) || 0;
  };

  const handleOpenDocument = (doc: any) => {
    if (!doc?.url) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const parts = doc.url.split('/').filter(Boolean);
    let folder = 'cotizaciones';
    let filename = parts[parts.length - 1];

    if (parts.length >= 3) {
      folder = parts[1];
      filename = parts[2];
    } else if (parts.length === 2) {
      folder = 'root';
    }

    const { token } = useAuthStore.getState();
    let previewUrl = `${API_URL}/files/preview/${folder}/${filename}?token=${token}`;
    if (folder === 'root') {
      previewUrl = `${API_URL}/uploads/${filename}?token=${token}`;
    }

    const viewerUrl = `/file-viewer?url=${encodeURIComponent(previewUrl)}&name=${encodeURIComponent(doc.nombre || 'Documento')}&token=${token}`;
    window.open(viewerUrl, '_blank');
  };
  
  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!clientToDeleteId) return;
    try {
        setIsDeleting(true);
        await deleteClient(clientToDeleteId); 
        setIsDeleteDialogOpen(false);
        setClientToDeleteId(null);
        showSuccess("Cliente Eliminado", "El registro del cliente ha sido removido exitosamente.");
    } catch (err: any) {
        console.error("Error deleting client:", err);
        showError("Error al Eliminar", err.response?.data?.message || "No se pudo eliminar el cliente. Verifique si tiene proyectos asociados.");
    } finally {
        setIsDeleting(false);
    }
  };

  const [modernDialog, setModernDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: DialogType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "info"
  });

  const showSuccess = (title: string, description: string) => {
    setModernDialog({
      isOpen: true,
      title,
      description,
      type: "success",
      confirmText: "Excelente"
    });
  };

  const showError = (title: string, description: string) => {
    setModernDialog({
      isOpen: true,
      title,
      description,
      type: "error",
      confirmText: "Entendido"
    });
  };


  const getAsignadoName = (val: string) => {
    if (!val) return "SIN ASIGNAR";
    if (val.includes('-') && val.length > 20) {
      const resp = responsables.find(r => r.id === val);
      if (resp) return resp.nombre.toUpperCase();
      return "RESPONSABLE TÉCNICO";
    }
    return val.toUpperCase();
  };

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);

  const filteredData = useMemo(() => {
    return clients.filter((client) => {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch = 
        (client.empresa?.toLowerCase() || "").includes(query) ||
        (client.ruc || "").includes(query) ||
        (client.contacto?.toLowerCase() || "").includes(query) ||
        (client.codigo?.toLowerCase() || "").includes(query);

      const matchesTarifa = !filters.tarifa || client.tarifa === filters.tarifa;
      const matchesAsignado = !filters.asignadoA || client.asignadoA === filters.asignadoA;
      const matchesEstado = !filters.estado || client.estado === filters.estado;
      const matchesEtapa = !filters.etapaComercial || client.etapaComercial === filters.etapaComercial;
      const matchesPrioridad = !filters.prioridad || client.prioridad === filters.prioridad;
      const matchesZona = !filters.zona || client.zona === filters.zona;
      const matchesTipo = !filters.tipoCliente || client.tipoCliente === filters.tipoCliente;

      return matchesSearch && matchesTarifa && matchesAsignado && matchesEstado && 
             matchesEtapa && matchesPrioridad && matchesZona && matchesTipo;
    });
  }, [clients, filters]);

  const handleOpenDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleUpdateClient = async (data: any) => {
    try {
        await updateClient({ ...selectedClient, ...data });
        setIsEditOpen(false);
        showSuccess("Actualización Exitosa", "Los datos se han guardado correctamente.");
    } catch (err: any) {
        showError("Error al Actualizar", "No se pudieron guardar los cambios.");
    }
  };

  const moveStage = (e: React.MouseEvent, client: Client, direction: "prev" | "next") => {
    e.stopPropagation();
    
    const currentIndex = columns.findIndex(c => c.id === client.etapaComercial);
    if (direction === "prev" && currentIndex > 0) {
      changeStage(client.id, columns[currentIndex - 1].id as any);
    } else if (direction === "next" && currentIndex < columns.length - 1) {
      changeStage(client.id, columns[currentIndex + 1].id as any);
    }
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-320px)] min-h-[500px] scrollbar-thin scrollbar-thumb-slate-200 px-1">
        {columns.map((column) => {
          const columnClients = filteredData.filter((client) => client.etapaComercial === column.id);
          const displayLimit = visibleItems[column.id] || 12;
          const paginatedClients = columnClients.slice(0, displayLimit);
          const hasMore = columnClients.length > displayLimit;
          const columnTotal = columnClients.reduce((sum, c) => sum + getClientDisplayAmount(c), 0);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className={cn("w-2.5 h-6 rounded-full shrink-0", column.color)} />
                    <h3 className="font-black text-[11px] uppercase tracking-tight text-primary truncate">
                      {column.title}
                    </h3>
                  </div>
                  <Badge className="font-black text-[9px] h-5 px-2 bg-slate-100 text-slate-600 border-none shadow-none">
                    {columnClients.length}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 bg-slate-100/50 rounded-xl p-2.5 space-y-2.5 overflow-y-auto border border-border/40 scrollbar-thin">
                {paginatedClients.map((client) => {
                  const overdue = isFollowUpOverdue(client);
                  const currentIndex = columns.findIndex(c => c.id === client.etapaComercial);
                  
                  return (
                    <Card 
                      key={client.id} 
                      className="border-none shadow-sm hover:shadow-lg hover:ring-2 hover:ring-primary/20 cursor-pointer transition-all active:scale-[0.98] group bg-white relative overflow-hidden"
                      onClick={() => handleOpenDetails(client)}
                    >
                      {client.prioridad === "Crítica" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-error" />}
                      {client.prioridad === "Alta" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />}

                      <CardContent className="p-3.5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <Badge variant="outline" className="text-[8px] font-black tracking-widest uppercase border-primary/20 bg-primary/5 text-primary h-4 px-1">
                                {client.codigo}
                            </Badge>
                            {(() => {
                              const empKey = client.empresa?.trim().toLowerCase() || '';
                              const count = (client.id ? wonQuotesByClient.get(client.id) : 0) || (empKey ? wonQuotesByClient.get(empKey) : 0) || 0;
                              if (count > 0) {
                                return (
                                  <Badge 
                                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-[8px] font-black uppercase px-2 h-4 gap-1 shadow-none cursor-pointer transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const clientWonQuotes = quotes.filter(q => {
                                        const matchesClient = q.clientId === client.id || (q.empresa && client.empresa && q.empresa.trim().toLowerCase() === client.empresa.trim().toLowerCase());
                                        const isWon = ['Ganada', 'Aprobado', 'Aprobada', 'Ganado', 'Orden de Servicio'].includes(q.estado) || !!(q as any).archivoAdjuntoUrl;
                                        return matchesClient && isWon;
                                      });
                                      setOsModalClient({ client, quotes: clientWonQuotes });
                                    }}
                                    title="Clic para ver las Órdenes de Servicio de este cliente"
                                  >
                                    <Trophy className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600 group-hover:text-white" />
                                    {count} {count === 1 ? 'Orden de Servicio' : 'Órdenes de Servicio'}
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger 
                                className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-primary/10 cursor-pointer outline-none opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 p-1 bg-white border border-border shadow-xl z-50 rounded-xl">
                                <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5 text-primary focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors" onClick={() => handleOpenDetails(client)}>
                                  <Eye className="w-3.5 h-3.5 opacity-80" /> Ver Ficha CRM
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5 text-primary focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setIsEditOpen(true); }}>
                                  <Edit className="w-3.5 h-3.5 opacity-80" /> Editar Registro
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5 text-primary focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setIsFollowUpOpen(true); }}>
                                  <Calendar className="w-3.5 h-3.5 opacity-80" /> Registrar Acción
                                </DropdownMenuItem>
                                <div className="h-px bg-slate-100 my-1" />
                                <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5 text-success focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors" onClick={(e) => { e.stopPropagation(); if (!client.telefono) return alert("Sin teléfono"); window.open(`https://wa.me/51${client.telefono.replace(/\D/g, '')}`, '_blank'); }}>
                                  <MessageSquare className="w-4 h-4 opacity-80" /> WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5 text-error focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors" onClick={(e) => { e.stopPropagation(); setClientToDeleteId(client.id); setIsDeleteDialogOpen(true); }}>
                                  <Trash2 className="w-3.5 h-3.5 opacity-80" /> Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div>
                          <p className="font-black text-[12px] text-primary leading-tight group-hover:text-secondary transition-colors uppercase truncate" title={client.empresa}>
                            {client.empresa}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                             <User className="w-3 h-3 text-slate-400" />
                             <p className="text-[9px] text-slate-600 font-bold uppercase truncate">{client.contacto || "Sin Contacto"}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className={cn(
                            "flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded",
                            overdue ? "bg-red-50 text-error animate-pulse border border-red-100" : "bg-slate-50 text-slate-500"
                          )}>
                            {overdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {formatDate(client.proximoSeguimiento)}
                          </div>
                          {(() => {
                            const amount = getClientDisplayAmount(client);
                            if (amount > 0) {
                              return (
                                <span className="text-[9px] font-black text-secondary">
                                  {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(amount)}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary border border-primary/20">
                              {getAsignadoName(client.asignadoA).charAt(0)}
                            </div>
                            <span className="font-black text-slate-500 uppercase tracking-tighter text-[8px] truncate max-w-[70px]">{getAsignadoName(client.asignadoA)}</span>
                          </div>

                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" disabled={currentIndex === 0 || loading} onClick={(e) => moveStage(e, client, "prev")} className="h-6 w-6 rounded-lg bg-slate-50 hover:bg-slate-200 text-slate-400 disabled:opacity-30">
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                            <div className={cn("w-1.5 h-1.5 rounded-full mx-1 shadow-inner", client.semaforo === "Verde" ? "bg-success" : client.semaforo === "Amarillo" ? "bg-warning" : "bg-error")} />
                            <Button variant="ghost" size="icon" disabled={currentIndex === columns.length - 1 || loading} onClick={(e) => moveStage(e, client, "next")} className="h-6 w-6 rounded-lg bg-slate-50 hover:bg-slate-200 text-slate-400 disabled:opacity-30">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {hasMore && (
                  <Button variant="ghost" className="w-full py-4 text-[8px] font-black uppercase text-primary hover:bg-white/60 border-2 border-dashed border-slate-200 rounded-xl" onClick={() => setVisibleItems(prev => ({ ...prev, [column.id]: displayLimit + 12 }))}>
                    + Cargar {Math.min(12, columnClients.length - displayLimit)} más
                  </Button>
                )}

                {columnClients.length === 0 && !loading && (
                  <div className="h-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-white/40 gap-1.5">
                    <XCircle className="w-4 h-4 text-slate-300" />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vacío</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > page && (
        <div className="flex justify-center pt-2">
            <Button onClick={() => fetchClients(page + 1, undefined, true)} disabled={loading} variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 font-black uppercase text-[10px] h-9 px-8 rounded-2xl transition-all shadow-sm">
                {loading ? "Sincronizando..." : "Ver más clientes en la base de datos"}
            </Button>
        </div>
      )}

      <ClientDetails client={selectedClient} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
      <FollowUpModal client={selectedClient} isOpen={isFollowUpOpen} onClose={() => setIsFollowUpOpen(false)} />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-hidden p-0 border-none bg-white shadow-2xl rounded-2xl">
          <DialogHeader className="p-8 bg-primary text-white rounded-t-xl shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 uppercase">
              <Edit className="w-8 h-8 text-accent" /> Editar Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="p-0 overflow-y-auto flex-1">
            <ClientForm client={selectedClient} onSubmit={handleUpdateClient} onCancel={() => setIsEditOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-error text-white flex flex-col items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full"><Trash2 className="w-12 h-12 text-white" /></div>
            <DialogTitle className="text-2xl font-black uppercase text-center tracking-tight">¿Eliminar Cliente?</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <DialogDescription className="text-center text-slate-600 font-bold text-base leading-relaxed">¿Estás seguro de eliminar este cliente del Pipeline? Esta acción borrará todo su historial y documentos. No se puede deshacer.</DialogDescription>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row justify-center gap-3">
            <Button variant="ghost" onClick={() => { setIsDeleteDialogOpen(false); setClientToDeleteId(null); }} className="h-12 px-8 font-black uppercase text-xs text-slate-500 hover:bg-slate-200" disabled={isDeleting}>Cancelar</Button>
            <Button onClick={handleDeleteConfirm} disabled={isDeleting} className="h-12 px-10 font-black uppercase text-xs text-white bg-error hover:bg-error/90 shadow-lg shadow-error/20">{isDeleting ? "Eliminando..." : "Sí, Eliminar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DETALLE DE ÓRDENES DE SERVICIO AL HACER CLIC EN LA INSIGNIA */}
      {osModalClient && (
        <Dialog open={!!osModalClient} onOpenChange={() => setOsModalClient(null)}>
          <DialogContent className="max-w-2xl w-full p-0 border-none bg-white shadow-2xl rounded-2xl overflow-hidden">
            <DialogHeader className="p-5 bg-slate-900 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500 text-white font-black text-[8px] uppercase border-none px-2 py-0.5">
                      Expediente Comercial
                    </Badge>
                    <span className="text-[9px] text-slate-400 uppercase font-bold">RUC: {osModalClient.client.ruc || "Sin RUC"}</span>
                  </div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">{osModalClient.client.empresa}</DialogTitle>
                  <p className="text-[10px] text-slate-300 font-semibold">{osModalClient.client.contacto ? `Contacto: ${osModalClient.client.contacto}` : 'Órdenes de servicio cerradas'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-slate-400">Total Acumulado</p>
                  <p className="text-lg font-black text-emerald-400">
                    S/ {osModalClient.quotes.reduce((sum, q) => sum + Number(q.monto || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Órdenes de Servicio ({osModalClient.quotes.length})
                </h4>
                <Button 
                  size="sm" 
                  className="h-7 font-black uppercase text-[8px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1 px-2.5"
                  onClick={() => {
                    setOsModalClient(null);
                    window.location.href = `/crm/cotizaciones?newClient=${osModalClient.client.id}`;
                  }}
                >
                  <Plus className="w-3 h-3" /> Nueva Cotización
                </Button>
              </div>

              {osModalClient.quotes.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-xs font-bold uppercase">No se encontraron órdenes cerradas.</p>
              ) : (
                <div className="space-y-2">
                  {osModalClient.quotes.map((q) => (
                    <div key={q.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-primary">{q.codigo || "—"}</span>
                          <Badge className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase border-none px-1.5 py-0">
                            Orden de Servicio
                          </Badge>
                          <span className="text-[8px] text-slate-400 font-bold uppercase flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" /> {formatDate(q.fecha)}
                          </span>
                        </div>
                        <p className="font-black text-xs text-slate-800 uppercase break-words line-clamp-2 leading-snug" title={q.referencia}>
                          {q.referencia || "Servicio Técnico"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <p className="text-xs font-black text-slate-900 whitespace-nowrap">
                          {q.moneda === 'USD' ? '$' : 'S/'} {Number(q.monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 font-black uppercase text-[8px] border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-2"
                            onClick={() => window.open(`/documental/cotizaciones/preview/${q.id}`, '_blank')}
                          >
                            <Eye className="w-3 h-3 mr-1" /> Propuesta
                          </Button>
                          {(q as any).archivoAdjuntoUrl && (
                            <Button 
                              size="sm" 
                              className="h-7 font-black uppercase text-[8px] bg-emerald-600 hover:bg-emerald-700 text-white px-2"
                              onClick={() => window.open(api.getFileUrl((q as any).archivoAdjuntoUrl), '_blank')}
                            >
                              <Download className="w-3 h-3 mr-1" /> OS Firmada
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ModernDialog isOpen={modernDialog.isOpen} onOpenChange={(open) => setModernDialog(prev => ({ ...prev, isOpen: open }))} title={modernDialog.title} description={modernDialog.description} type={modernDialog.type} confirmText={modernDialog.confirmText} cancelText={modernDialog.cancelText} showCancel={modernDialog.showCancel} onConfirm={modernDialog.onConfirm} />
    </>
  );
}
