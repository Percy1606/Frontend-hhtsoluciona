"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  ShieldAlert,
  Lock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ClientForm } from "./client-form";
import { ClientDetails } from "./client-details";
import { FollowUpModal } from "./follow-up-modal";
import { useCRMStore, getDaysSinceContact, isFollowUpOverdue, calculateClientSemaforo } from "@/store/crm-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { cn, formatDate } from "@/lib/utils";
import { Client } from "@/types/crm";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ModernDialog, DialogType } from "@/components/ui/modern-dialog";

interface ClientTableProps {
  mode?: "cartera" | "seguimiento" | "full";
  data?: Client[];
}

export function ClientTable({ mode = "cartera", data }: ClientTableProps) {
  const { clients, updateClient, deleteClientSecure, fetchClients, fetchClientById, loading, totalClients, page, totalPages } = useCRMStore();
  const { responsables } = useOperacionesStore();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
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
        showSuccess("Cliente Eliminado", "El registro del cliente ha sido removido del sistema exitosamente.");
    } catch (err: any) {
        console.error("Error deleting client:", err);
        const errorMessage = err.message || "La contraseña de administrador es incorrecta.";
        showError("Acceso Denegado", errorMessage);
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

  const filteredData = data || clients;

  const handleOpenDetails = async (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
    // Refresh client data to get the latest interactions
    await fetchClientById(client.id);
  };

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditOpen(true);
  };

  const handleOpenFollowUp = async (client: Client) => {
    setSelectedClient(client);
    setIsFollowUpOpen(true);
    // Refresh client data to get latest history
    await fetchClientById(client.id);
  };

  const handleUpdateClient = async (data: any) => {
    try {
      await updateClient({ ...selectedClient, ...data } as any);
      setIsEditOpen(false);
      showSuccess("Cliente Actualizado", "La información se ha guardado correctamente.");
      if (selectedClient) await fetchClientById(selectedClient.id);
    } catch (error: any) {
      showError("Error al Actualizar", error.message || "No se pudieron guardar los cambios.");
    }
  };

  const handleDeleteClient = async (id: string) => {
    setClientToDeleteId(id);
    setIsSecureDeleteOpen(true);
  };

  const handleWhatsAppContact = (client: Client) => {
    if (!client.telefono) {
      showError("Sin Teléfono", "Este cliente no tiene un teléfono registrado.");
      return;
    }
    const cleanPhone = client.telefono.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola ${client.contacto}, un gusto saludarte. Te contacto de HH T Soluciona...`);
    window.open(`https://wa.me/51${cleanPhone}?text=${message}`, '_blank');
  };

  const currentClientInModal = useMemo(() => {
    if (!selectedClient) return null;
    return clients.find(c => c.id === selectedClient.id) || selectedClient;
  }, [clients, selectedClient]);

  return (
    <>
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-[10px] font-black uppercase text-primary tracking-widest">Actualizando Base...</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <Table className="min-w-full border-separate border-spacing-0">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-border/80">
                <TableHead className="w-[30px] font-black text-primary text-[9px] uppercase text-center p-2">N°</TableHead>
                <TableHead className="w-[200px] font-black text-primary text-[9px] uppercase p-2">Empresa / Código</TableHead>
                <TableHead className="w-[100px] font-black text-primary text-[9px] uppercase p-2">RUC / Tarifa</TableHead>
                <TableHead className="w-[110px] font-black text-primary text-[9px] uppercase text-center p-2">Tipo</TableHead>
                <TableHead className="w-[180px] font-black text-primary text-[9px] uppercase p-2">Contacto</TableHead>
                <TableHead className="w-[150px] font-black text-primary text-[9px] uppercase p-2">Proceso / Asesor</TableHead>
                <TableHead className="w-[110px] font-black text-primary text-[9px] uppercase text-center p-2">Seguimiento</TableHead>
                <TableHead className="w-[100px] font-black text-primary text-[9px] uppercase text-center p-2">Estado</TableHead>
                <TableHead className="w-[80px] font-black text-primary text-[9px] uppercase text-center p-2">Prioridad</TableHead>
                <TableHead className="w-[220px] font-black text-primary text-[9px] uppercase p-2">Dirección / Zona</TableHead>
                <TableHead className="w-[45px] font-black text-primary text-[9px] uppercase text-right sticky right-0 bg-slate-50 shadow-[-5px_0_10px_rgba(0,0,0,0.05)] p-2">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center text-slate-400 font-bold italic text-xs">
                    {loading ? "Cargando datos..." : "No hay clientes registrados."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((client, index) => {
                  const daysSinceLastContact = getDaysSinceContact(client.ultimoContacto);
                  const isOverdue = isFollowUpOverdue(client);
                  const daysOverdue = isOverdue ? getDaysSinceContact(client.proximoSeguimiento) : 0;
                  const daysToShow = isOverdue ? daysOverdue : daysSinceLastContact;
                  
                  return (
                    <TableRow key={client.id} className="hover:bg-primary/5 transition-colors group">
                      <TableCell className="text-center font-bold text-[10px] text-slate-400 border-b border-slate-50 p-2">{index + 1}</TableCell>
                    
                    <TableCell className="border-b border-slate-50 p-1.5">
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleOpenDetails(client)}
                          className="text-left hover:underline font-black text-[11px] text-primary uppercase leading-tight truncate max-w-[190px]"
                          title={client.empresa}
                        >
                          {client.empresa}
                        </button>
                        <span className="text-[8px] font-black text-slate-400 uppercase">{client.codigo}</span>
                      </div>
                    </TableCell>

                    <TableCell className="border-b border-slate-50 p-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-[10px] text-slate-600 tracking-tight">{client.ruc}</span>
                        <span className="text-[8px] font-black text-primary uppercase">{client.tarifa || "MT3"}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center border-b border-slate-50 p-2">
                      <Badge className={cn(
                        "font-black text-[8px] uppercase px-1.5 py-0 border-none shadow-none",
                        client.clasificacion === "MUY_RENTABLE" ? "bg-green-100 text-green-700" :
                        client.clasificacion === "RENTABLE" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        {client.clasificacion?.replace('MUY_', 'M.').replace('_', ' ') || "RENTABLE"}
                      </Badge>
                    </TableCell>

                    <TableCell className="border-b border-slate-50 p-2">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-700 uppercase truncate max-w-[170px]">{client.contacto}</span>
                        <span className="text-[9px] font-bold text-slate-400">{client.telefono}</span>
                      </div>
                    </TableCell>

                    <TableCell className="border-b border-slate-50 p-2">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-primary uppercase bg-primary/5 px-1 rounded w-fit border border-primary/10 mb-0.5">
                          {client.etapaComercial}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{getAsignadoName(client.asignadoA)}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center border-b border-slate-50 p-2">
                        <span className={cn(
                            "text-[10px] font-black px-1.5 py-0.5 rounded",
                            isOverdue ? "bg-error text-white" : "text-slate-700 bg-slate-100"
                        )}>
                            {formatDate(client.proximoSeguimiento)}
                        </span>
                    </TableCell>

                    <TableCell className="text-center border-b border-slate-50 p-2">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={cn(
                            "text-[9px] font-black",
                            daysToShow > 15 ? "text-error" : daysToShow > 7 ? "text-warning" : "text-success"
                        )}>
                            {daysToShow === 999 ? "S.C." : `${daysToShow}D`}
                        </div>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          calculateClientSemaforo(client) === 'Verde' ? "bg-success" :
                          calculateClientSemaforo(client) === 'Amarillo' ? "bg-warning" : "bg-error"
                        )} />
                      </div>
                    </TableCell>

                    <TableCell className="text-center border-b border-slate-50 p-2">
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-black uppercase px-1 py-0 h-4",
                        client.prioridad === "Crítica" ? "border-error text-error bg-red-50" : 
                        client.prioridad === "Alta" ? "border-orange-200 text-orange-600 bg-orange-50" : 
                        "border-slate-200 text-slate-500"
                      )}>
                        {client.prioridad.substring(0, 4)}
                      </Badge>
                    </TableCell>

                    <TableCell className="border-b border-slate-50 p-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-600 truncate max-w-[210px] uppercase" title={client.direccion}>{client.direccion}</span>
                        <span className="text-[8px] font-black text-primary uppercase">{client.zona}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right border-b border-slate-50 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-5px_0_10px_rgba(0,0,0,0.05)] transition-colors p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-200 cursor-pointer outline-none text-slate-400 hover:text-primary transition-all">
                          <MoreHorizontal className="h-5 w-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1 bg-white border border-border shadow-2xl z-50 rounded-xl">
                          <DropdownMenuItem
                            className="gap-2 font-black text-[10px] uppercase cursor-pointer py-3 rounded-lg focus:bg-primary/5"
                            onClick={() => handleOpenDetails(client)}
                          >
                            <Eye className="w-4 h-4 text-primary" /> Ver Ficha CRM
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 font-black text-[10px] uppercase cursor-pointer py-3 rounded-lg focus:bg-primary/5"
                            onClick={() => handleOpenEdit(client)}
                          >
                            <Edit className="w-4 h-4 text-primary" /> Editar Registro
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 font-black text-[10px] uppercase cursor-pointer py-3 rounded-lg focus:bg-primary/5"
                            onClick={() => handleOpenFollowUp(client)}
                          >
                            <Calendar className="w-4 h-4 text-primary" /> Registrar Acción
                          </DropdownMenuItem>
                          <div className="h-px bg-slate-100 my-1" />
                          <DropdownMenuItem
                            className="gap-2 font-black text-[10px] uppercase cursor-pointer py-3 rounded-lg text-success focus:text-success focus:bg-green-50"
                            onClick={() => handleWhatsAppContact(client)}
                          >
                            <MessageSquare className="w-4 h-4" /> Contactar WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 font-black text-[10px] uppercase cursor-pointer text-error focus:text-error focus:bg-red-50 py-3 rounded-lg"
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Eliminar Cliente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Controles de Paginación */}
        {totalPages > 1 && (
            <div className="p-3 bg-slate-50 border-t border-border flex items-center justify-between">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">
                    Página {page} de {totalPages} — Total: {totalClients} registros
                </p>
                <div className="flex gap-2 mr-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={page <= 1 || loading}
                        onClick={() => fetchClients(page - 1)}
                        className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white"
                    >
                        Anterior
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={page >= totalPages || loading}
                        onClick={() => fetchClients(page + 1)}
                        className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        )}
      </div>

      <ClientDetails
        client={currentClientInModal}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      <FollowUpModal
        client={currentClientInModal}
        isOpen={isFollowUpOpen}
        onClose={() => setIsFollowUpOpen(false)}
      />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden p-0 border-none bg-white shadow-2xl rounded-xl">
          <DialogHeader className="p-6 bg-primary text-white rounded-t-xl shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2 uppercase">
              <Edit className="w-6 h-6 text-accent" />
              Editar: {selectedClient?.empresa}
            </DialogTitle>
          </DialogHeader>
          <div className="p-0 flex-1 overflow-hidden">
            <ClientForm
              client={selectedClient}
              onSubmit={handleUpdateClient}
              onCancel={() => setIsEditOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSecureDeleteOpen} onOpenChange={setIsSecureDeleteOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-error text-white flex flex-col items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <ShieldAlert className="w-12 h-12 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase text-center tracking-tight">
              Eliminación Restringida
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            <DialogDescription className="text-center text-slate-600 font-bold text-base leading-relaxed">
              Esta acción es crítica. Para eliminar este cliente y todo su historial CRM, se requiere la autorización de un administrador.
            </DialogDescription>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Contraseña de Administrador</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 border-slate-200 bg-slate-50 focus:bg-white transition-all font-bold text-lg"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSecureDelete()}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row justify-center gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsSecureDeleteOpen(false);
                setAdminPassword("");
              }}
              className="h-12 px-8 font-black uppercase text-xs text-slate-500 hover:bg-slate-200"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSecureDelete}
              disabled={isDeleting || !adminPassword}
              className="h-12 px-10 font-black uppercase text-xs text-white bg-error hover:bg-error/90 shadow-lg shadow-error/20"
            >
              {isDeleting ? "Autorizando..." : "Confirmar Eliminación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModernDialog 
        isOpen={modernDialog.isOpen}
        onOpenChange={(open) => setModernDialog(prev => ({ ...prev, isOpen: open }))}
        title={modernDialog.title}
        description={modernDialog.description}
        type={modernDialog.type}
        confirmText={modernDialog.confirmText}
        cancelText={modernDialog.cancelText}
        showCancel={modernDialog.showCancel}
        onConfirm={modernDialog.onConfirm}
      />
    </>
  );
}
