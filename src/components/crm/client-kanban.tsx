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
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { ClientDetails } from "./client-details";
import { ClientForm } from "./client-form";
import { FollowUpModal } from "./follow-up-modal";
import { cn, formatDate } from "@/lib/utils";
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
  { id: "Contactado", title: "Contactado", color: "bg-cyan-500" },
  { id: "Llamada Realizada", title: "Llamada Realizada", color: "bg-sky-500" },
  { id: "Visita Agendada", title: "Visita Agendada", color: "bg-indigo-500" },
  { id: "Inspección Realizada", title: "Inspección Realizada", color: "bg-amber-500" },
  { id: "Cotización Enviada", title: "Cotización Enviada", color: "bg-violet-500" },
  { id: "Seguimiento", title: "Seguimiento", color: "bg-pink-500" },
  { id: "Negociación", title: "Negociación", color: "bg-orange-500" },
  { id: "Orden de Servicio", title: "Orden de Servicio", color: "bg-emerald-600" },
  { id: "Ganado", title: "Ganado", color: "bg-success" },
  { id: "Perdido", title: "Perdido", color: "bg-error" },
];

export function ClientKanban() {
  const { clients, filters, updateClient, deleteClientSecure, changeStage, addInteraction, fetchClients, loading, page, totalPages } = useCRMStore();
  const { responsables } = useOperacionesStore();
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [visibleItems, setVisibleItems] = useState<Record<string, number>>({});
  
  // Secure Delete State
  const [isSecureDeleteOpen, setIsSecureDeleteOpen] = useState(false);
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Modern Dialog State
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

  const closeModernDialog = () => setModernDialog(prev => ({ ...prev, isOpen: false }));

  const showSuccess = (title: string, description: string) => {
    setModernDialog({ isOpen: true, title, description, type: "success", confirmText: "Excelente" });
  };

  const showError = (title: string, description: string) => {
    setModernDialog({ isOpen: true, title, description, type: "error", confirmText: "Entendido" });
  };

  const handleSecureDelete = async () => {
    if (!clientToDeleteId || !adminPassword) {
        showError("Contraseña Requerida", "Por favor ingrese la contraseña de administrador.");
        return;
    }
    try {
        setIsDeleting(true);
        await deleteClientSecure(clientToDeleteId, adminPassword);
        setIsSecureDeleteOpen(false);
        setClientToDeleteId(null);
        setAdminPassword("");
        showSuccess("Cliente Eliminado", "El registro del cliente ha sido removido exitosamente.");
    } catch (err: any) {
        showError("Acceso Denegado", "La contraseña de administrador es incorrecta.");
        setAdminPassword("");
    } finally {
        setIsDeleting(false);
    }
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
    
    if (client.etapaComercial === 'Ganado') {
      showError("Acción Bloqueada", "No se puede cambiar el estado de un cliente que ya ha sido marcado como GANADO.");
      return;
    }

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
          const columnTotal = columnClients.reduce((sum, c) => sum + (c.ventaProyectada || 0), 0);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
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
                {columnTotal > 0 && (
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Valor Etapa</span>
                        <span className="text-[10px] font-black text-secondary">
                            {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(columnTotal)}
                        </span>
                    </div>
                )}
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
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-[8px] font-black tracking-widest uppercase border-primary/20 bg-primary/5 text-primary h-4 px-1">
                                {client.codigo}
                            </Badge>
                            {client.etapaComercial === 'Ganado' && <Trophy className="w-3 h-3 text-yellow-500" />}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger 
                                className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-slate-100 cursor-pointer outline-none opacity-0 group-hover:opacity-100 transition-opacity text-slate-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 p-1 bg-white border border-border shadow-xl z-50 rounded-xl">
                                <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5" onClick={() => handleOpenDetails(client)}>
                                  <Eye className="w-3.5 h-3.5 text-primary" /> Ver Ficha CRM
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5" onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setIsEditOpen(true); }}>
                                  <Edit className="w-3.5 h-3.5 text-primary" /> Editar Registro
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5" onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setIsFollowUpOpen(true); }}>
                                  <Calendar className="w-3.5 h-3.5 text-primary" /> Registrar Acción
                                </DropdownMenuItem>
                                <div className="h-px bg-slate-100 my-1" />
                                <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer py-2.5 text-success focus:text-success focus:bg-green-50" onClick={(e) => { e.stopPropagation(); if (!client.telefono) return alert("Sin teléfono"); window.open(`https://wa.me/51${client.telefono.replace(/\D/g, '')}`, '_blank'); }}>
                                  <MessageSquare className="w-4 h-4" /> WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 font-black text-[9px] uppercase cursor-pointer text-error focus:text-error focus:bg-red-50 py-2.5" onClick={(e) => { e.stopPropagation(); setClientToDeleteId(client.id); setIsSecureDeleteOpen(true); }}>
                                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
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
                          {client.ventaProyectada > 0 && (
                            <span className="text-[9px] font-black text-secondary">
                                S/ {new Intl.NumberFormat('es-PE').format(client.ventaProyectada)}
                            </span>
                          )}
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

      <Dialog open={isSecureDeleteOpen} onOpenChange={setIsSecureDeleteOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-error text-white flex flex-col items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full"><ShieldAlert className="w-12 h-12 text-white" /></div>
            <DialogTitle className="text-2xl font-black uppercase text-center tracking-tight">Eliminación Restringida</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <DialogDescription className="text-center text-slate-600 font-bold text-base leading-relaxed">Requiere contraseña administrativa para eliminar este registro del Pipeline.</DialogDescription>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type="password" placeholder="••••••••" className="pl-10 h-12 border-slate-200 bg-slate-50 focus:bg-white font-bold text-lg" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSecureDelete()} />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row justify-center gap-3">
            <Button variant="ghost" onClick={() => { setIsSecureDeleteOpen(false); setAdminPassword(""); }} className="h-12 px-8 font-black uppercase text-xs text-slate-500 hover:bg-slate-200" disabled={isDeleting}>Cancelar</Button>
            <Button onClick={handleSecureDelete} disabled={isDeleting || !adminPassword} className="h-12 px-10 font-black uppercase text-xs text-white bg-error hover:bg-error/90 shadow-lg shadow-error/20">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModernDialog isOpen={modernDialog.isOpen} onOpenChange={(open) => setModernDialog(prev => ({ ...prev, isOpen: open }))} title={modernDialog.title} description={modernDialog.description} type={modernDialog.type} confirmText={modernDialog.confirmText} cancelText={modernDialog.cancelText} showCancel={modernDialog.showCancel} onConfirm={modernDialog.onConfirm} />
    </>
  );
}
