"use client";

import { Client } from "@/mocks/data";
import { useCRMStore, isFollowUpOverdue } from "@/store/crm-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Flame, 
  MoreVertical, 
  Eye, 
  Calendar, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ClientDetails } from "./client-details";
import { ClientForm } from "./client-form";
import { FollowUpModal } from "./follow-up-modal";
import { cn } from "@/lib/utils";
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
} from "@/components/ui/dialog";

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

const tempColors: Record<string, string> = {
  "Frío": "text-blue-500 bg-blue-50",
  "Tibio": "text-yellow-600 bg-yellow-50",
  "Caliente": "text-orange-600 bg-orange-50",
  "Muy Caliente": "text-red-600 bg-red-50",
};

export function ClientKanban() {
  const { clients, filters, updateClient, deleteClient, changeStage, addInteraction } = useCRMStore();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);

  const filteredData = clients.filter((client) => {
    const matchesSearch = 
      client.empresa.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      client.ruc.includes(filters.searchQuery) ||
      (client.contacto && client.contacto.toLowerCase().includes(filters.searchQuery.toLowerCase())) ||
      (client.codigo && client.codigo.toLowerCase().includes(filters.searchQuery.toLowerCase()));

    const matchesTarifa = filters.tarifa === "all" || client.tarifa === filters.tarifa;
    const matchesAsignado = filters.asignadoA === "all" || client.asignadoA === filters.asignadoA;
    const matchesEstado = filters.estado === "all" || client.estado === filters.estado;
    const matchesEtapa = filters.etapaComercial === "all" || client.etapaComercial === filters.etapaComercial;
    const matchesTemperatura = filters.temperatura === "all" || client.temperatura === filters.temperatura;
    const matchesPrioridad = filters.prioridad === "all" || client.prioridad === filters.prioridad;
    const matchesZona = filters.zona === "all" || client.zona === filters.zona;
    const matchesTipo = filters.tipoCliente === "all" || client.tipoCliente === filters.tipoCliente;

    return matchesSearch && matchesTarifa && matchesAsignado && matchesEstado && 
           matchesEtapa && matchesTemperatura && matchesPrioridad && matchesZona && matchesTipo;
  });

  const handleOpenDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setSelectedClient(client);
    setIsEditOpen(true);
  };

  const handleOpenFollowUp = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setSelectedClient(client);
    setIsFollowUpOpen(true);
  };

  const handleUpdateClient = (data: any) => {
    updateClient({ ...selectedClient, ...data });
    setIsEditOpen(false);
  };

  const handleDeleteClient = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("¿Estás seguro de eliminar este cliente?")) {
      deleteClient(id);
    }
  };

  const handleWhatsAppContact = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    if (!client.telefono) {
      alert("Este cliente no tiene un teléfono registrado.");
      return;
    }
    
    const cleanPhone = client.telefono.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    
    const message = encodeURIComponent(`Hola ${client.contacto}, te saludo de HH T Soluciona. Queremos dar seguimiento a la gestión de ${client.empresa}.`);
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${message}`;
    
    addInteraction(client.id, "WhatsApp", "Contacto por WhatsApp", "Se inició conversación por WhatsApp para seguimiento.", client.asignadoA || "Admin");
    
    window.open(whatsappUrl, '_blank');
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

  const getColumnTotal = (columnId: string) => {
    return filteredData
      .filter(c => c.etapaComercial === columnId)
      .reduce((sum, c) => sum + (c.ventaProyectada || 0), 0);
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-290px)] min-h-[500px] scrollbar-thin scrollbar-thumb-slate-200">
        {columns.map((column) => {
          const columnClients = filteredData.filter((client) => client.etapaComercial === column.id);
          const totalAmount = getColumnTotal(column.id);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className={cn("w-2 h-5 rounded-full shrink-0", column.color)} />
                    <h3 className="font-black text-xs uppercase tracking-tight text-primary truncate" title={column.title}>
                      {column.title}
                    </h3>
                  </div>
                  <Badge variant="secondary" className="font-bold text-[10px] h-5 px-1.5 shrink-0">
                    {columnClients.length}
                  </Badge>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Venta Proyectada</p>
                  <p className="text-sm font-black text-accent">
                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(totalAmount)}
                  </p>
                </div>
              </div>

              <div className="flex-1 bg-slate-100/50 rounded-xl p-2.5 space-y-2.5 overflow-y-auto border border-border/40 scrollbar-thin">
                {columnClients.map((client) => {
                  const overdue = isFollowUpOverdue(client);
                  const currentIndex = columns.findIndex(c => c.id === client.etapaComercial);
                  
                  return (
                    <Card 
                      key={client.id} 
                      className="border-none shadow-sm hover:shadow-md hover:ring-1 hover:ring-primary/10 cursor-pointer transition-all active:scale-[0.98] group bg-white"
                      onClick={() => handleOpenDetails(client)}
                    >
                      <CardContent className="p-3.5 space-y-2.5 relative">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase border-primary/20 bg-primary/5 text-primary">
                            {client.codigo}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger 
                                className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-slate-100 cursor-pointer outline-none opacity-0 group-hover:opacity-100 transition-opacity text-slate-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 p-1 bg-white border border-border shadow-xl z-50">
                                <DropdownMenuItem 
                                  className="gap-2 font-bold text-[10px] uppercase cursor-pointer" 
                                  onClick={() => handleOpenDetails(client)}
                                >
                                  <Eye className="w-3.5 h-3.5 text-primary" /> Ver Ficha CRM
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="gap-2 font-bold text-[10px] uppercase cursor-pointer" 
                                  onClick={(e) => handleOpenEdit(e, client)}
                                >
                                  <Edit className="w-3.5 h-3.5 text-primary" /> Editar Registro
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 font-bold text-xs uppercase cursor-pointer py-2.5"
                                  onClick={(e) => handleOpenFollowUp(e, client)}
                                >
                                  <Calendar className="w-4 h-4 text-primary" /> Registrar Acción
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 font-bold text-xs uppercase cursor-pointer py-2.5 text-success focus:text-success focus:bg-green-50"
                                  onClick={(e) => handleWhatsAppContact(e, client)}
                                >
                                  <MessageSquare className="w-4 h-4" /> Contactar WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="gap-2 font-bold text-[10px] uppercase cursor-pointer text-error focus:text-error focus:bg-red-50"
                                  onClick={(e) => handleDeleteClient(e, client.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Eliminar Cliente
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div>
                          <p className="font-black text-sm text-primary leading-tight group-hover:text-secondary transition-colors" title={client.empresa}>
                            {client.empresa}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">{client.contacto}</p>
                          <div className="flex items-center gap-2 mt-1 text-[9px] font-semibold text-slate-500">
                            {client.telefono && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5 text-slate-400" /> {client.telefono}</span>}
                            {client.correo && <span className="flex items-center gap-0.5 max-w-[120px] truncate"><Mail className="w-2.5 h-2.5 text-slate-400" /> {client.correo}</span>}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <div className={cn(
                            "inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-0.5",
                            tempColors[client.temperatura] || "text-slate-500 bg-slate-50"
                          )}>
                            <Flame className="w-2.5 h-2.5" />
                            {client.temperatura}
                          </div>
                          {client.tipoCliente && (
                            <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0">
                              {client.tipoCliente}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className={cn(
                            "flex items-center gap-1 text-[9px] font-bold",
                            overdue ? "text-error font-black" : "text-muted-foreground"
                          )}>
                            {overdue ? <AlertCircle className="w-3 h-3 text-error animate-pulse" /> : <Calendar className="w-3 h-3" />}
                            {client.proximoSeguimiento || "Pendiente"}
                          </div>
                          <p className="font-black text-xs text-primary">
                            {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(client.montoEstimado)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary">
                              {client.asignadoA ? client.asignadoA[0] : "?"}
                            </div>
                            <span className="font-bold text-slate-600 uppercase tracking-tight text-[9px]">{client.asignadoA}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Control rápido para avanzar y retroceder etapa */}
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={currentIndex === 0}
                              onClick={(e) => moveStage(e, client, "prev")}
                              className="h-5 w-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 disabled:opacity-30"
                              title="Etapa anterior"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                            
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full mx-1",
                              client.semaforo === "Verde" ? "bg-success" : client.semaforo === "Amarillo" ? "bg-warning" : "bg-error"
                            )} />

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={currentIndex === columns.length - 1}
                              onClick={(e) => moveStage(e, client, "next")}
                              className="h-5 w-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 disabled:opacity-30"
                              title="Siguiente etapa"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {columnClients.length === 0 && (
                  <div className="h-20 flex items-center justify-center border border-dashed border-slate-300 rounded-xl bg-white/40">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sin Clientes</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ClientDetails 
        client={selectedClient} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />

      <FollowUpModal 
        client={selectedClient}
        isOpen={isFollowUpOpen}
        onClose={() => setIsFollowUpOpen(false)}
      />

      {/* Modal: Editar Cliente (Kanban) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-hidden p-0 border-none bg-white shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white rounded-t-lg">
            <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-2">
              <Edit className="w-8 h-8 text-accent" />
              Editar Cliente: {selectedClient?.empresa}
            </DialogTitle>
          </DialogHeader>
          <div className="p-8">
            <ClientForm 
              client={selectedClient}
              onSubmit={handleUpdateClient} 
              onCancel={() => setIsEditOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
