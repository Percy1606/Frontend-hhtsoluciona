"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Client, Interaction } from "@/types/crm";
import { 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  FileText, 
  History,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Mail,
  UserCheck,
  Tag,
  Paperclip,
  Trash2,
  MessageSquare,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, formatDate } from "@/lib/utils";
import { useCRMStore, getDaysSinceContact, isFollowUpOverdue } from "@/store/crm-store";
import { useAuthStore } from "@/store/auth-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisitModal } from "./visit-modal";

interface ClientDetailsProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

const stageList = [
  "Prospecto", "Contactado", "Llamada Realizada", "Visita Agendada", 
  "Inspección Realizada", "Cotización Enviada", "Seguimiento", 
  "Negociación", "Orden de Servicio", "Ganado", "Perdido"
];

const sellerList = ["Angie", "Valentina", "Ariana", "Nicoll"];

export function ClientDetails({ client, isOpen, onClose }: ClientDetailsProps) {
  const { reassignSeller, changeStage, addInteraction, attachFile, deleteFile } = useCRMStore();
  const { responsables } = useOperacionesStore();
  const [activeTab, setActiveTab] = useState("general");
  
  const [intType, setIntType] = useState<Interaction['tipo']>("Llamada");
  const [intAction, setIntAction] = useState("");
  const [intObs, setIntObs] = useState("");
  const [intUser, setIntUser] = useState("Angie");
  const [isAddingInt, setIsAddingInt] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  if (!client) return null;

  const getUsuarioNombre = (usuario: string) => {
    if (!usuario) return "Sistema";
    
    // Si es un UUID, buscar en responsables
    if (usuario.includes('-') && usuario.length > 20) {
      const resp = responsables.find(r => r.id === usuario);
      if (resp) return resp.nombre.toUpperCase();
      return "RESPONSABLE TÉCNICO";
    }
    
    return usuario.toUpperCase();
  };

  const daysSinceContact = getDaysSinceContact(client.ultimoContacto);
  const overdue = isFollowUpOverdue(client);

  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intAction) return;
    addInteraction(client.id, {
      tipo: intType,
      accion: intAction,
      observaciones: intObs,
      usuario: intUser
    });
    setIntAction("");
    setIntObs("");
    setIsAddingInt(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    const user = useAuthStore.getState().user;

    attachFile(client.id, {
      nombre: file.name,
      tipo: file.type || "application/octet-stream",
      url: "#",
      tamano: sizeStr,
      subidoPor: user?.nombre || "Sistema"
    });
  };

  const handleWhatsAppDirect = () => {
    if (!client.telefono) {
      alert("Este cliente no tiene un teléfono registrado.");
      return;
    }
    const cleanPhone = client.telefono.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    const message = encodeURIComponent(`Hola ${client.contacto}, te saludo de HH T Soluciona. Queremos dar seguimiento a la gestión de ${client.empresa}.`);
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${message}`;
    addInteraction(client.id, {
        tipo: "WhatsApp",
        accion: "Contacto por WhatsApp",
        observaciones: "Se inició conversación por WhatsApp para seguimiento.",
        usuario: intUser
    });
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[92vh] overflow-hidden p-0 border-none bg-white shadow-2xl flex flex-col">
        <DialogHeader className="p-8 bg-primary text-white shrink-0 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-none font-bold">
                  {client.codigo}
                </Badge>
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/10",
                  client.semaforo === "Verde" ? "text-green-400" : client.semaforo === "Amarillo" ? "text-yellow-400" : "text-red-400"
                )}>
                  <div className={cn("w-2 h-2 rounded-full bg-current shadow-[0_0_8px_rgba(255,255,255,0.5)]")} />
                  Semáforo {client.semaforo}
                </div>
                {overdue && (
                  <Badge variant="destructive" className="bg-error hover:bg-error/95 font-bold uppercase text-[9px] tracking-wide animate-pulse">
                    Seguimiento Vencido o Pendiente
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight leading-tight uppercase">{client.empresa}</DialogTitle>
              <div className="text-white/70 text-xs font-semibold flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> RUC: {client.ruc}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {client.zona}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Días sin contacto: {daysSinceContact === 999 ? "—" : daysSinceContact}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Banner de Acciones Rápidas */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-primary" /> Asignado A:
              </span>
              <Select 
                value={client.asignadoA} 
                onValueChange={(val) => reassignSeller(client.id, val || "")}
              >
                <SelectTrigger className="w-[120px] h-8 text-xs font-bold border-slate-300 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {sellerList.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-primary" /> Etapa:
              </span>
              <Select 
                value={client.etapaComercial} 
                onValueChange={(val) => changeStage(client.id, (val || "Prospecto") as any)}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs font-bold border-slate-300 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {stageList.map(st => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-500 uppercase">Próxima Acción:</span>
            <span className="bg-primary/5 text-primary text-[11px] font-black px-3 py-1 rounded-lg border border-primary/10 uppercase">
              {client.accion || "Sin acción"} (el {formatDate(client.proximoSeguimiento)})
            </span>
          </div>
        </div>

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 border-b border-border bg-slate-50/50 shrink-0">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-8 rounded-none p-0">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs uppercase h-full"
              >
                Visión General
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs uppercase h-full"
              >
                Bitácora ({client.historialInteracciones?.length || 0})
              </TabsTrigger>
              </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
              <TabsContent value="general" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-primary rounded-sm" /> Contacto Principal
                  </h4>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">Contacto / Cargo</p>
                        <p className="text-sm font-bold text-slate-800">{client.contacto || "—"}</p>
                        {client.cargo && <p className="text-xs text-muted-foreground font-semibold">{client.cargo}</p>}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">Teléfono</p>
                        <p className="text-sm font-bold text-slate-800">{client.telefono || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">Correo</p>
                        {client.correo ? (
                          <a href={`mailto:${client.correo}`} className="text-sm font-bold text-primary hover:underline">{client.correo}</a>
                        ) : (
                          <p className="text-sm font-bold text-slate-800">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-primary rounded-sm" /> Información Comercial
                  </h4>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-200/50 uppercase">
                      <span className="font-bold text-slate-600">Tarifa Eléctrica:</span>
                      <Badge variant="outline" className="font-black text-[10px] px-2 py-0">{client.tarifa}</Badge>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/50 uppercase">
                      <span className="font-bold text-slate-600">Prioridad:</span>
                      <Badge className={cn(
                        "font-black text-[9px] uppercase px-2 py-0 border-none",
                        client.prioridad === "Crítica" ? "bg-red-500 text-white" : 
                        client.prioridad === "Alta" ? "bg-orange-500 text-white" :
                        client.prioridad === "Media" ? "bg-yellow-500 text-slate-800" : "bg-slate-200 text-slate-700"
                      )}>{client.prioridad}</Badge>
                    </div>
                    <div className="flex justify-between py-1.5 uppercase">
                      <span className="font-bold text-slate-600">Zona:</span>
                      <span className="font-black text-slate-800">{client.zona}</span>
                    </div>
                  </div>
                </div>
              </div>

              {client.observaciones && (
                <div className="bg-primary/[0.02] p-5 rounded-xl border border-primary/5 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-primary">Observaciones del Registro</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                    "{client.observaciones}"
                  </p>
                </div>
              )}
              </TabsContent>

              <TabsContent value="history" className="mt-0 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-primary">Bitácora de Seguimiento</h4>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsVisitModalOpen(true)}
                    className="border-primary text-primary hover:bg-primary/5 font-bold text-[10px] uppercase"
                  >
                    <Calendar className="w-4 h-4 mr-1" /> Agendar Visita
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleWhatsAppDirect}
                    className="border-success text-success hover:bg-green-50 font-bold text-[10px] uppercase"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" /> WhatsApp
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setIsAddingInt(!isAddingInt)}
                    className="bg-accent hover:bg-accent/90 text-white font-bold text-[10px] uppercase"
                  >
                    <Plus className="w-4 h-4 mr-1" /> {isAddingInt ? "Cancelar" : "Nueva Gestión"}
                  </Button>
                </div>
              </div>

              {isAddingInt && (
                <form onSubmit={handleAddInteraction} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Tipo</label>
                      <Select value={intType} onValueChange={(val) => setIntType(val as any)}>
                        <SelectTrigger className="h-9 text-xs bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Llamada">Llamada</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Visita">Visita</SelectItem>
                          <SelectItem value="Cotización">Cotización</SelectItem>
                          <SelectItem value="Nota">Nota</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Responsable</label>
                      <Select value={intUser} onValueChange={(val) => setIntUser(val || "")}>
                        <SelectTrigger className="h-9 text-xs bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white">
                          {sellerList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Acción</label>
                      <Input placeholder="..." value={intAction} onChange={(e) => setIntAction(e.target.value)} required className="h-9 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Observaciones</label>
                    <Textarea placeholder="..." value={intObs} onChange={(e) => setIntObs(e.target.value)} className="min-h-[60px] text-xs resize-none" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="submit" className="bg-primary text-white text-[10px] font-black h-8 px-6 uppercase">Guardar Gestión</Button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {client.historialInteracciones && client.historialInteracciones.length > 0 ? (
                  client.historialInteracciones.map((item, i) => (
                    <div key={item.id || i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-slate-800 uppercase">{item.accion}</span>
                          <Badge className="text-[9px] uppercase font-bold bg-primary/10 text-primary border-none">{item.tipo}</Badge>
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{getUsuarioNombre(item.usuario)}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(item.fecha)}</span>
                        </div>
                      </div>
                      {item.observaciones && <p className="text-xs text-slate-500 font-medium leading-relaxed border-t pt-2">{item.observaciones}</p>}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase italic">Sin historial de gestiones</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-0 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-primary">Archivos y Expedientes</h4>
                <div className="relative">
                  <input id="cl-file" type="file" className="hidden" onChange={handleFileUpload} />
                  <Button size="sm" className="bg-accent text-white font-bold text-[10px] uppercase" onClick={() => document.getElementById("cl-file")?.click()}>
                    <Paperclip className="w-4 h-4 mr-1" /> Adjuntar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {client.archivosAdjuntos && client.archivosAdjuntos.length > 0 ? (
                  client.archivosAdjuntos.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-5 h-5 text-red-400 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-bold text-slate-800 truncate">{file.nombre}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{formatDate(file.fecha)} • {file.tamano || "—"}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-error" onClick={() => deleteFile(client.id, file.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-10 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase italic">No se han adjuntado documentos</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>

    <VisitModal 
      clientId={client.id}
      clientName={client.empresa}
      isOpen={isVisitModalOpen}
      onClose={() => setIsVisitModalOpen(false)}
    />
  </>
);
}
