"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Client, Interaction } from "@/types/crm";
import { 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  FileText, 
  FileCheck,
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
  Plus,
  Package,
  DollarSign,
  ClipboardList,
  Clock,
  Loader2,
  Camera
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
import { api } from "@/lib/api";

// IMPORTACIÓN DE PANELES OPERATIVOS PARA FUSIÓN 360
import { ActividadesPanel } from "../operaciones/actividades-panel";
import { TimelinePanel } from "../operaciones/timeline-panel";
import { FinancePanel } from "../operaciones/finance-panel";
import { ProyectoDetail } from "../operaciones/proyecto-detail"; // Usaremos sus sub-componentes

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

const sellerList = ["Angie", "Valentina", "Ariana"];

export function ClientDetails({ client, isOpen, onClose }: ClientDetailsProps) {
  const { reassignSeller, changeStage, addInteraction, attachFile, deleteFile, updateClient } = useCRMStore();
  const { responsables, proyectos, fetchProjectProfitability } = useOperacionesStore();
  const [activeTab, setActiveTab] = useState("general");
  
  const [intType, setIntType] = useState<Interaction['tipo']>("Llamada");
  const [intAction, setIntAction] = useState("");
  const [intNextDate, setIntNextDate] = useState("");
  const [intObs, setIntObs] = useState("");
  const [intUser, setIntUser] = useState("Angie");
  const [isAddingInt, setIsAddingInt] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagenFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Lógica de Fusión: Buscar si este cliente tiene un proyecto operativo
  const vinculadoProyecto = useMemo(() => {
    if (!client) return null;
    return proyectos.find(p => p.clientId === client.id);
  }, [client, proyectos]);

  const [financeData, setFinanceData] = useState<any>(null);
  const [loadingFinance, setLoadingFinance] = useState(false);

  const [fichaAdjuntos, setFichaAdjuntos] = useState<any[]>([]);
  const [loadingFichas, setLoadingFichas] = useState(false);

  useEffect(() => {
    if (vinculadoProyecto && (activeTab === 'logistica' || activeTab === 'profitability')) {
      const loadFinance = async () => {
        setLoadingFinance(true);
        try {
          const data = await fetchProjectProfitability(vinculadoProyecto.id);
          setFinanceData(data);
        } catch (error) {
          console.error("Error loading project finance for CRM fusion:", error);
        } finally {
          setLoadingFinance(false);
        }
      };
      loadFinance();
    }
  }, [vinculadoProyecto, activeTab, fetchProjectProfitability]);

  useEffect(() => {
    if (client?.id && isOpen) {
      const loadFichaAdjuntos = async () => {
        setLoadingFichas(true);
        try {
          const response = await api.get(`/operaciones/fichas-tecnicas?clienteId=${client.id}`);
          const fichas = response.data || response || [];
          if (Array.isArray(fichas)) {
            const allAdjuntos = fichas.flatMap((f: any) => 
              (f.adjuntos || []).map((adj: any) => ({
                ...adj,
                fichaFecha: f.fechaVisita,
                tecnicoNombre: f.tecnico?.nombre || 'Técnico'
              }))
            );
            setFichaAdjuntos(allAdjuntos);
          }
        } catch (error) {
          console.error("Error loading ficha adjuntos:", error);
        } finally {
          setLoadingFichas(false);
        }
      };
      loadFichaAdjuntos();
    }
  }, [client?.id, isOpen]);

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

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intAction) return;
    
    setIsUploading(true);
    try {
      let uploadedUrl = null;
      if (imagenFile) {
        const uploadRes = await useCRMStore.getState().uploadClientFile(imagenFile);
        uploadedUrl = uploadRes.url;
      }
      
      let finalObs = intObs;
      if (uploadedUrl) {
        finalObs = `${intObs ? intObs + '\n' : ''}[IMG]${uploadedUrl}[/IMG]`;
      }
      
      await addInteraction(client.id, {
        tipo: intType,
        accion: intAction,
        observaciones: finalObs,
        usuario: intUser
      });

      if (intNextDate) {
        await updateClient({ ...client, proximoSeguimiento: intNextDate, accion: intAction } as any);
      } else {
        await updateClient({ ...client, accion: intAction } as any);
      }

      setIntAction("");
      setIntNextDate("");
      setIntObs("");
      setImagenFile(null);
      setImagePreview(null);
      setIsAddingInt(false);
    } catch (error) {
      console.error("Error al guardar gestión:", error);
      alert("Hubo un error al subir la imagen o guardar la gestión.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadRes = await useCRMStore.getState().uploadClientFile(file);
      
      const user = useAuthStore.getState().user;

      await attachFile(client.id, {
        nombre: uploadRes.nombre || file.name,
        tipo: uploadRes.tipo || file.type || "application/octet-stream",
        url: uploadRes.url,
        tamano: uploadRes.tamano || `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        subidoPor: user?.nombre || "Sistema"
      });
      
      e.target.value = ""; // Limpiar input
    } catch (error) {
      console.error("Error al subir archivo:", error);
    }
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
              <TabsTrigger 
                value="files" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs uppercase h-full"
              >
                Documentos ({client.archivosAdjuntos?.length || 0})
              </TabsTrigger>

              {/* PESTAÑAS DE FUSIÓN OPERATIVA (SOLO SI HAY PROYECTO) */}
              {vinculadoProyecto && (
                <>
                  <TabsTrigger 
                    value="actividades" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs uppercase h-full gap-2 text-orange-600 data-[state=active]:text-primary"
                  >
                    <ClipboardList className="w-4 h-4" /> Actividades ({vinculadoProyecto.actividades?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="logistica" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs uppercase h-full gap-2 text-blue-600 data-[state=active]:text-primary"
                  >
                    <Package className="w-4 h-4" /> Logística y Costos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profitability" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs uppercase h-full gap-2 text-emerald-600 data-[state=active]:text-primary"
                  >
                    <DollarSign className="w-4 h-4" /> Rentabilidad Real
                  </TabsTrigger>
                </>
              )}
              </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
              {/* CONTENIDO EXISTENTE */}
              <TabsContent value="general" className="mt-0 space-y-6">
                {/* ... (resto del contenido general ya existente) */}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                          <SelectItem value="No Contesta">No Contesta</SelectItem>
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
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Próx. Seguimiento</label>
                      <Input 
                        type="date" 
                        min={new Date().toISOString().split("T")[0]}
                        value={intNextDate} 
                        onChange={(e) => setIntNextDate(e.target.value)} 
                        className="h-9 text-xs" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Observaciones</label>
                    <Textarea placeholder="..." value={intObs} onChange={(e) => setIntObs(e.target.value)} className="min-h-[60px] text-xs resize-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Evidencia / Captura (Opcional)</label>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="text-xs font-bold p-2 h-auto"
                    />
                    {imagePreview && (
                      <div className="mt-2 relative inline-block">
                        <img src={imagePreview} alt="Preview" className="max-h-24 rounded-lg object-contain border border-slate-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={isUploading} className="bg-primary text-white text-[10px] font-black h-8 px-6 uppercase">
                      {isUploading ? "Guardando..." : "Guardar Gestión"}
                    </Button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {client.historialInteracciones && client.historialInteracciones.length > 0 ? (
                  client.historialInteracciones.map((item, i) => {
                    return (
                      <div key={item.id || i} className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex gap-4">
                        <div className="flex-1 space-y-3 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-black text-slate-800 text-sm uppercase flex items-center gap-2 truncate">
                                {item.accion}
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 uppercase">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                                {item.fecha || (item as any).createdAt ? new Date(item.fecha || (item as any).createdAt).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} 
                                <span className="mx-1 text-slate-300 shrink-0">•</span>
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{getUsuarioNombre(item.usuario || (item as any).responsable)}</span>
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-white font-black text-[9px] uppercase border-slate-200 text-slate-600 shadow-sm shrink-0 ml-2">{item.tipo}</Badge>
                          </div>
                          {(() => {
                            const obsText = item.observaciones || '';
                            const cleanObs = obsText.replace(/\[IMG\].*?\[\/IMG\]/, '').trim();
                            
                            if (!cleanObs) return null;
                            return (
                              <div className="border-t border-slate-200/60 pt-3 mt-2">
                                <div className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                  {cleanObs}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        {(() => {
                          const obsText = item.observaciones || '';
                          const imgMatch = obsText.match(/\[IMG\](.*?)\[\/IMG\]/);
                          const imgUrl = imgMatch ? imgMatch[1] : ((item as any).imagenAdjunta || null);
                          
                          if (!imgUrl) return null;
                          return (
                            <div className="shrink-0 flex flex-col items-center bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm self-start">
                              <span className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-wider">Evidencia</span>
                              <img src={api.getFileUrl(imgUrl)} alt="Evidencia" className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover cursor-pointer border border-slate-100 hover:opacity-80 transition-opacity" onClick={() => window.open(api.getFileUrl(imgUrl), '_blank')} title="Ver imagen completa" />
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase italic">Sin historial de gestiones</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-0 space-y-8">
              {/* DOCUMENTOS CONTRACTUALES */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                    <FileCheck className="w-4 h-4" /> Órdenes de Servicio y Contratos
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {client?.archivosAdjuntos && client.archivosAdjuntos.filter(f => (f as any).subtype === 'ORDEN_SERVICIO' || (f as any).subtype === 'CONTRATO').length > 0 ? (
                    client.archivosAdjuntos
                      .filter(f => (f as any).subtype === 'ORDEN_SERVICIO' || (f as any).subtype === 'CONTRATO')
                      .map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl shadow-sm hover:border-blue-300 transition-all group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-[11px] font-black text-slate-800 uppercase truncate leading-tight">{file.nombre}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="text-[8px] bg-blue-600 text-white font-black uppercase h-4 px-1 border-none">{(file as any).subtype || 'CONTRATO'}</Badge>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{formatDate(file.fecha)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-blue-600 hover:bg-blue-100" 
                              onClick={() => {
                                window.open(api.getFileUrl(file.url), '_blank');
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="col-span-full text-center py-6 bg-slate-50 border-2 border-dashed border-slate-100 rounded-xl">
                      <p className="text-[9px] font-black text-slate-300 uppercase italic">Sin documentos contractuales registrados</p>
                    </div>
                  )}
                </div>
              </div>

              {/* OTROS ADJUNTOS */}
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Archivos Generales y Expedientes
                  </h4>
                  <div className="relative">
                    <input id="cl-file" type="file" className="hidden" onChange={handleFileUpload} />
                    <Button size="sm" variant="ghost" className="h-7 text-primary font-black text-[10px] uppercase hover:bg-primary/5" onClick={() => document.getElementById("cl-file")?.click()}>
                      <Plus className="w-3 h-3 mr-1" /> Adjuntar Nuevo
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {client.archivosAdjuntos && client.archivosAdjuntos.filter(f => (f as any).subtype !== 'ORDEN_SERVICIO' && (f as any).subtype !== 'CONTRATO').length > 0 ? (
                    client.archivosAdjuntos
                      .filter(f => (f as any).subtype !== 'ORDEN_SERVICIO' && (f as any).subtype !== 'CONTRATO')
                      .map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-red-400 shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{file.nombre}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase">{formatDate(file.fecha)} • {file.tamano || "—"}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-primary hover:text-primary/80" 
                              onClick={() => {
                                window.open(api.getFileUrl(file.url), '_blank');
                              }}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-error" onClick={() => deleteFile(client.id, file.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="col-span-full text-center py-8 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase italic">No se han adjuntado documentos generales</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ADJUNTOS DE VISITAS TÉCNICAS */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center border-b border-amber-100 pb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Fotos y Evidencias de Visitas Técnicas
                  </h4>
                </div>
                {loadingFichas ? (
                  <div className="text-center py-6">
                    <div className="animate-spin w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : fichaAdjuntos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {fichaAdjuntos.map((file) => {
                      const isImage = file.tipo?.toLowerCase().includes('image') || file.nombre?.toLowerCase().endsWith('.png') || file.nombre?.toLowerCase().endsWith('.jpg') || file.nombre?.toLowerCase().endsWith('.jpeg');
                      const fullUrl = api.getFileUrl(file.url);
                      return (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-amber-50/20 border border-amber-100/50 rounded-lg shadow-sm hover:border-amber-300 transition-colors">
                          <div className="flex items-center gap-2 overflow-hidden font-bold">
                            {isImage ? (
                              <img src={fullUrl} alt={file.nombre} className="w-6 h-6 rounded object-cover shrink-0 border border-amber-200" />
                            ) : (
                              <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{file.nombre}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase">
                                Visita: {formatDate(file.fichaFecha)} por {file.tecnicoNombre}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-amber-700 hover:text-amber-800 hover:bg-amber-100/50 rounded-lg" 
                              onClick={() => window.open(fullUrl, '_blank')}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="col-span-full text-center py-8 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase italic">Sin fotos ni evidencias de visitas técnicas</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* CONTENIDO DE FUSIÓN OPERATIVA (SOLO SI HAY PROYECTO) */}
            {vinculadoProyecto && (
              <>
                <TabsContent value="actividades" className="mt-0 space-y-6">
                   <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <ClipboardList className="w-5 h-5 text-orange-600" />
                         </div>
                         <div>
                            <h4 className="text-sm font-black uppercase text-primary">Cronograma de Ejecución</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Proyecto: {vinculadoProyecto.codigo} — Avance: {vinculadoProyecto.avanceCalculado}%</p>
                         </div>
                      </div>
                      <Badge className="bg-primary text-white font-black text-[10px] px-3 py-1">{vinculadoProyecto.estado}</Badge>
                   </div>
                   <ActividadesPanel proyecto={vinculadoProyecto} />
                </TabsContent>

                <TabsContent value="logistica" className="mt-0 space-y-6">
                   {/* Reutilizamos el LogisticaPanel de ProyectoDetail */}
                   {/* Nota: Necesitamos que ProyectoDetail exporte o tener acceso al componente local */}
                   <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                         <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                         <h4 className="text-sm font-black uppercase text-primary">Control de Insumos y Costos Directos</h4>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Reporte real de materiales despachados a la obra.</p>
                      </div>
                   </div>
                   
                   {/* Inyectamos la lógica de LogisticaPanel directamente para asegurar compatibilidad */}
                   <div className="space-y-8">
                      {loadingFinance ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                          <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculando costos reales...</p>
                        </div>
                      ) : financeData ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Presupuesto</span>
                                <p className="text-lg font-black text-primary">S/ {financeData.montoCotizado?.toLocaleString() || '0.00'}</p>
                             </div>
                             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Inversión Actual</span>
                                <p className="text-lg font-black text-orange-600">S/ {financeData.egresos?.costoTotal?.toLocaleString() || '0.00'}</p>
                             </div>
                             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Utilidad Estimada</span>
                                <p className={cn("text-lg font-black", (financeData.montoCotizado - financeData.egresos?.costoTotal) > 0 ? "text-emerald-600" : "text-red-600")}>
                                  S/ {(financeData.montoCotizado - financeData.egresos?.costoTotal)?.toLocaleString() || '0.00'}
                                </p>
                             </div>
                          </div>

                          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <Table>
                              <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                  <TableHead className="font-black uppercase text-[9px] py-3 pl-4">Material / Insumo</TableHead>
                                  <TableHead className="font-black uppercase text-[9px] text-center">Cantidad</TableHead>
                                  <TableHead className="font-black uppercase text-[9px] text-right pr-4">Subtotal S/.</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {financeData.historialMateriales?.length > 0 ? (
                                  financeData.historialMateriales.map((m: any, idx: number) => (
                                    <TableRow key={idx} className="hover:bg-slate-50/30">
                                      <TableCell className="py-2.5 pl-4 font-bold text-[10px] uppercase">{m.material}</TableCell>
                                      <TableCell className="text-center font-bold text-[10px]">{m.cantidad}</TableCell>
                                      <TableCell className="text-right pr-4 font-black text-[10px] text-primary">S/ {m.costoTotal?.toLocaleString()}</TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow><TableCell colSpan={3} className="py-10 text-center text-[10px] font-bold text-slate-300 uppercase italic">Sin movimientos registrados</TableCell></TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ) : null}
                   </div>
                </TabsContent>

                <TabsContent value="profitability" className="mt-0 space-y-6">
                   <FinancePanel proyectoId={vinculadoProyecto.id} />
                </TabsContent>
              </>
            )}
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
