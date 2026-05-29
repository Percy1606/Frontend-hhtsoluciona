"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCRMStore, getDaysSinceContact, isFollowUpOverdue } from "@/store/crm-store";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Flame,
  AlertCircle,
  Phone,
  Mail,
  UserCheck,
  MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClientDetails } from "./client-details";
import { ClientForm } from "./client-form";
import { FollowUpModal } from "./follow-up-modal";
import { Client } from "@/mocks/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const semaforoColors: Record<string, string> = {
  Verde: "bg-success",
  Amarillo: "bg-warning",
  Rojo: "bg-error",
};

const tempColors: Record<string, string> = {
  "Frío": "text-blue-500 bg-blue-50",
  "Tibio": "text-yellow-600 bg-yellow-50",
  "Caliente": "text-orange-600 bg-orange-50",
  "Muy Caliente": "text-red-600 bg-red-50",
};

interface ClientTableProps {
  mode?: "cartera" | "seguimiento" | "full";
}

export function ClientTable({ mode = "cartera" }: ClientTableProps) {
  const { clients, filters, updateClient, deleteClient, addInteraction } = useCRMStore();
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

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditOpen(true);
  };

  const handleOpenFollowUp = (client: Client) => {
    setSelectedClient(client);
    setIsFollowUpOpen(true);
  };

  const handleUpdateClient = (data: any) => {
    updateClient({ ...selectedClient, ...data });
    setIsEditOpen(false);
  };

  const handleDeleteClient = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este cliente?")) {
      deleteClient(id);
    }
  };

  const handleWhatsAppContact = (client: Client) => {
    if (!client.telefono) {
      alert("Este cliente no tiene un teléfono registrado.");
      return;
    }
    
    // Limpiar número (quitar espacios, guiones, etc.)
    const cleanPhone = client.telefono.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    
    const message = encodeURIComponent(`Hola ${client.contacto}, te saludo de HH T Soluciona. Queremos dar seguimiento a la gestión de ${client.empresa}.`);
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${message}`;
    
    // Registrar la interacción automáticamente
    addInteraction(client.id, "WhatsApp", "Contacto por WhatsApp", "Se inició conversación por WhatsApp para seguimiento.", client.asignadoA || "Admin");
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <Table className="min-w-[2500px] border-separate border-spacing-0">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border/80">
                <TableHead className="w-[50px] font-black text-primary text-[10px] uppercase">ITEM</TableHead>
                <TableHead className="w-[100px] font-black text-primary text-[10px] uppercase">CÓDIGO</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase min-w-[200px]">EMPRESA</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase">RUC</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase text-center">TARIFA</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase">CONTACTO</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase">TELÉFONO / CORREO</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase">ASIGNADO A</TableHead>
                
                {mode !== "cartera" && (
                  <>
                    <TableHead className="font-black text-primary text-[10px] uppercase text-center">SEMÁFORO</TableHead>
                    <TableHead className="font-black text-primary text-[10px] uppercase">ETAPA COMERCIAL</TableHead>
                    <TableHead className="font-black text-primary text-[10px] uppercase">TEMPERATURA</TableHead>
                    <TableHead className="font-black text-primary text-[10px] uppercase text-right">MONTO EST.</TableHead>
                    <TableHead className="font-black text-primary text-[10px] uppercase text-center">PROB.</TableHead>
                    <TableHead className="font-black text-primary text-[10px] uppercase text-right">VENTA PROY.</TableHead>
                    <TableHead className="font-black text-primary text-[10px] uppercase text-center">ÚLTIMO CONTACTO</TableHead>
                  </>
                )}
                
                <TableHead className="font-black text-primary text-[10px] uppercase text-center">PRÓX. SEGUIMIENTO</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase text-center">DÍAS SIN SEGUIMIENTO</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase">TIPO CLIENTE</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase">PRIORIDAD</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase">DIRECCIÓN / ZONA</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase">OBSERVACIONES</TableHead>
                <TableHead className="font-black text-primary text-[10px] uppercase text-right w-[60px]">ACCIONES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((client, index) => {
                const daysSince = getDaysSinceContact(client.ultimoContacto);
                const isOverdue = isFollowUpOverdue(client);
                
                return (
                  <TableRow key={client.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="font-bold text-xs text-slate-500">{index + 1}</TableCell>
                    <TableCell className="font-bold text-xs tracking-wider text-primary">
                      {client.codigo}
                    </TableCell>
                    <TableCell className="min-w-[250px]">
                      <button
                        onClick={() => handleOpenDetails(client)}
                        className="text-left hover:underline block"
                      >
                        <p className="font-black text-sm text-primary group-hover:text-secondary transition-colors leading-tight truncate max-w-[240px]" title={client.empresa}>
                          {client.empresa}
                        </p>
                        {client.cargo && (
                          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 truncate max-w-[240px]">{client.cargo}</p>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-slate-600">{client.ruc}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-black text-[10px] px-2 py-0 border-primary/20 bg-primary/5 text-primary">
                        {client.tarifa}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-700">{client.contacto}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-[10px] font-semibold text-slate-600">
                        {client.telefono && (
                          <p className="flex items-center gap-1"><Phone className="w-2.5 h-2.5 text-slate-400" /> {client.telefono}</p>
                        )}
                        {client.correo && (
                          <p className="flex items-center gap-1 text-primary truncate max-w-[150px]" title={client.correo}>
                            <Mail className="w-2.5 h-2.5 text-slate-400" /> {client.correo}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                          {client.asignadoA ? client.asignadoA[0] : "?"}
                        </div>
                        {client.asignadoA}
                      </div>
                    </TableCell>

                    {mode !== "cartera" && (
                      <>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <div className={cn(
                              "w-3.5 h-3.5 rounded-full shadow-inner ring-2 ring-white",
                              semaforoColors[client.semaforo] || "bg-slate-300"
                            )} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="font-black text-[9px] uppercase tracking-wide bg-slate-100 text-slate-800 border border-slate-200">
                            {client.etapaComercial}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                            tempColors[client.temperatura] || "text-slate-500 bg-slate-100"
                          )}>
                            <Flame className="w-2.5 h-2.5" />
                            {client.temperatura}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black text-xs text-primary">
                          {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(client.montoEstimado)}
                        </TableCell>
                        <TableCell className="text-center font-bold text-xs">
                          {Math.round((client.probabilidad || 0) * 100)}%
                        </TableCell>
                        <TableCell className="text-right font-black text-xs text-primary bg-slate-50/50">
                          {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(client.ventaProyectada)}
                        </TableCell>
                        <TableCell className="text-center text-xs font-semibold text-slate-600">
                          {client.ultimoContacto || "Sin contacto"}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-center text-xs font-bold">
                      <div className="flex items-center justify-center gap-1.5 min-w-[120px]">
                        {!client.proximoSeguimiento ? (
                          <Badge variant="destructive" className="bg-error/10 text-error border-error/20 font-black animate-pulse">SIN FECHA</Badge>
                        ) : (
                          <>
                            {isOverdue && <AlertCircle className="w-4 h-4 text-error shrink-0 animate-bounce" />}
                            <span className={cn(
                              "px-2 py-0.5 rounded",
                              isOverdue ? "bg-error text-white font-black" : "bg-slate-100 text-slate-700"
                            )}>
                              {client.proximoSeguimiento}
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs font-black">
                      <div className="min-w-[100px]">
                        {daysSince === 999 ? (
                          <Badge variant="destructive" className="bg-error text-white font-black">SIN CONTACTO</Badge>
                        ) : (
                          <div className={cn(
                            "inline-flex items-center justify-center px-2 py-0.5 rounded-full min-w-[60px]",
                            daysSince > 15 ? "bg-error text-white" : daysSince > 7 ? "bg-warning text-slate-900" : "bg-success text-white"
                          )}>
                            {daysSince} {daysSince === 1 ? "día" : "días"}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">
                      {client.tipoCliente || "Nuevo"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-bold uppercase",
                        client.prioridad === "Crítica" ? "border-error text-error bg-red-50" : 
                        client.prioridad === "Alta" ? "border-orange-200 text-orange-600 bg-orange-50" : 
                        client.prioridad === "Media" ? "border-warning text-yellow-600 bg-yellow-50" : "border-slate-200 text-slate-500"
                      )}>
                        {client.prioridad}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-semibold text-slate-600 max-w-[150px] truncate" title={`${client.direccion} (${client.zona})`}>
                      {client.direccion} <span className="text-primary font-bold">({client.zona})</span>
                    </TableCell>
                    <TableCell className="text-[10px] font-semibold text-slate-500 max-w-[200px] truncate" title={client.observaciones}>
                      {client.observaciones}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-slate-100 cursor-pointer outline-none text-slate-600 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1 bg-white border border-border shadow-xl z-50">
                          <DropdownMenuItem
                            className="gap-2 font-bold text-xs uppercase cursor-pointer py-2.5"
                            onClick={() => handleOpenDetails(client)}
                          >
                            <Eye className="w-4 h-4 text-primary" /> Ver Ficha CRM
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 font-bold text-xs uppercase cursor-pointer py-2.5"
                            onClick={() => handleOpenEdit(client)}
                          >
                            <Edit className="w-4 h-4 text-primary" /> Editar Registro
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 font-bold text-xs uppercase cursor-pointer py-2.5"
                            onClick={() => handleOpenFollowUp(client)}
                          >
                            <Calendar className="w-4 h-4 text-primary" /> Registrar Acción
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 font-bold text-xs uppercase cursor-pointer py-2.5 text-success focus:text-success focus:bg-green-50"
                            onClick={() => handleWhatsAppContact(client)}
                          >
                            <MessageSquare className="w-4 h-4" /> Contactar WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 font-bold text-xs uppercase cursor-pointer text-error focus:text-error focus:bg-red-50 py-2.5"
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Eliminar Cliente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={22} className="h-32 text-center text-muted-foreground font-semibold">
                    No se encontraron clientes con los filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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

      {/* Modal: Editar Cliente */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-hidden p-0 border-none bg-white shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white rounded-t-xl shrink-0">
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