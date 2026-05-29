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
import { Client, Interaction } from "@/mocks/data";
import { 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  FileText, 
  ClipboardCheck, 
  Lightbulb,
  History,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
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
import { cn } from "@/lib/utils";
import { useCRMStore, getDaysSinceContact, isFollowUpOverdue } from "@/store/crm-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientDetailsProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

const tempColors: Record<string, string> = {
  "Frío": "text-blue-500 bg-blue-50 border-blue-200",
  "Tibio": "text-yellow-600 bg-yellow-50 border-yellow-200",
  "Caliente": "text-orange-600 bg-orange-50 border-orange-200",
  "Muy Caliente": "text-red-600 bg-red-50 border-red-200",
};

const stageList = [
  "Prospecto", "Contactado", "Llamada Realizada", "Visita Agendada", 
  "Inspección Realizada", "Cotización Enviada", "Seguimiento", 
  "Negociación", "Orden de Servicio", "Ganado", "Perdido"
];

const sellerList = ["Angi", "Valentina", "Ariana", "Nicol"];

export function ClientDetails({ client, isOpen, onClose }: ClientDetailsProps) {
  const { reassignSeller, changeStage, addInteraction, attachFile, deleteFile } = useCRMStore();
  const [activeTab, setActiveTab] = useState("general");
  
  // Interaction form state
  const [intType, setIntType] = useState<Interaction['tipo']>("Llamada");
  const [intAction, setIntAction] = useState("");
  const [intObs, setIntObs] = useState("");
  const [intUser, setIntUser] = useState("Angi");
  const [isAddingInt, setIsAddingInt] = useState(false);

  if (!client) return null;

  const daysSinceContact = getDaysSinceContact(client.ultimoContacto);
  const overdue = isFollowUpOverdue(client);

  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intAction) return;
    addInteraction(client.id, intType, intAction, intObs, intUser);
    setIntAction("");
    setIntObs("");
    setIsAddingInt(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate file size string
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    attachFile(client.id, {
      nombre: file.name,
      tipo: file.type || "application/octet-stream",
      url: "#", // mock URL
      tamano: sizeStr
    });
  };

  const handleWhatsAppDirect = () => {
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
    addInteraction(client.id, "WhatsApp", "Contacto por WhatsApp", "Se inició conversación por WhatsApp para seguimiento.", intUser);
    
    window.open(whatsappUrl, '_blank');
  };

  return (
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
                <Badge variant="outline" className="text-white border-white/20 font-bold uppercase text-[9px]">
                  {client.tipoCliente || "Nuevo"}
                </Badge>
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight leading-tight">{client.empresa}</DialogTitle>
              <div className="text-white/70 text-xs font-semibold flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> RUC: {client.ruc}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {client.zona}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Días sin contacto: {daysSinceContact === 999 ? "Sin contacto" : daysSinceContact}</span>
              </div>
            </div>

            <div className="text-right bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm shrink-0 min-w-[200px]">
              <p className="text-[10px] uppercase font-bold text-white/50 mb-1">Venta Proyectada</p>
              <p className="text-3xl font-black text-accent">
                {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(client.ventaProyectada)}
              </p>
              <p className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-wider">
                Monto: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(client.montoEstimado)} ({Math.round(client.probabilidad * 100)}% prob.)
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Assign / Action Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-6 flex-wrap">
            {/* Reasignar Vendedor */}
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

            {/* Cambiar Etapa Comercial */}
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
            <span className="text-[10px] font-black text-slate-500 uppercase">Siguiente Acción:</span>
            <span className="bg-primary/5 text-primary text-xs font-bold px-3 py-1 rounded-lg border border-primary/10">
              {client.accion || "Sin acción"} (el {client.proximoSeguimiento || "N/A"})
            </span>
          </div>
        </div>

        {/* Modal Content Tabs */}
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
                value="technical" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs uppercase h-full"
              >
                Informe Técnico
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs uppercase h-full"
              >
                Bitácora Comercial ({client.historialInteracciones?.length || 0})
              </TabsTrigger>
              <TabsTrigger 
                value="files" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-black text-xs uppercase h-full"
              >
                Archivos Adjuntos ({client.archivosAdjuntos?.length || 0})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {/* TAB: VISION GENERAL */}
            <TabsContent value="general" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Panel Izquierdo: Datos de contacto */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-primary rounded-sm" /> Contacto Principal
                  </h4>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">Contacto / Cargo</p>
                        <p className="text-sm font-bold text-slate-800">{client.contacto || "No especificado"}</p>
                        {client.cargo && <p className="text-xs text-muted-foreground font-semibold">{client.cargo}</p>}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">Teléfono / Celular</p>
                        <p className="text-sm font-bold text-slate-800">{client.telefono || "No especificado"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">Correo Electrónico</p>
                        {client.correo ? (
                          <a href={`mailto:${client.correo}`} className="text-sm font-bold text-primary hover:underline">{client.correo}</a>
                        ) : (
                          <p className="text-sm font-bold text-slate-800">No especificado</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel Derecho: Información Comercial */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-primary rounded-sm" /> Información Operativa
                  </h4>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-200/50">
                      <span className="font-bold text-slate-600">Tarifa Eléctrica:</span>
                      <Badge variant="outline" className="font-black text-[10px] px-2 py-0">{client.tarifa}</Badge>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/50">
                      <span className="font-bold text-slate-600">Día de Trabajo:</span>
                      <span className="font-semibold text-slate-800">{client.diaTrabajo}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/50">
                      <span className="font-bold text-slate-600">Prioridad Comercial:</span>
                      <Badge className={cn(
                        "font-black text-[9px] uppercase px-2 py-0 border-none",
                        client.prioridad === "Crítica" ? "bg-red-500 text-white" : 
                        client.prioridad === "Alta" ? "bg-orange-500 text-white" :
                        client.prioridad === "Media" ? "bg-yellow-500 text-slate-800" : "bg-slate-200 text-slate-700"
                      )}>{client.prioridad}</Badge>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/50">
                      <span className="font-bold text-slate-600">Temperatura de Interés:</span>
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase border", tempColors[client.temperatura])}>
                        {client.temperatura}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="font-bold text-slate-600">Zona Comercial:</span>
                      <span className="font-semibold text-slate-800">{client.zona}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observaciones Generales */}
              {client.observaciones && (
                <div className="bg-primary/[0.02] p-5 rounded-xl border border-primary/5 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-primary">Observaciones del Vendedor</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                    "{client.observaciones}"
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB: INFORME TECNICO */}
            <TabsContent value="technical" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-error" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-primary">Hallazgos Técnicos Registrados</h4>
                  </div>
                  <div className="space-y-2">
                    {client.hallazgosTecnicos && client.hallazgosTecnicos.length > 0 ? (
                      client.hallazgosTecnicos.map((h, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                          <p className="leading-relaxed">{h}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No hay hallazgos técnicos registrados en el relevamiento inicial.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-primary">Soluciones Sugeridas HH</h4>
                  </div>
                  <div className="space-y-2">
                    {client.solucionesPropuestas && client.solucionesPropuestas.length > 0 ? (
                      client.solucionesPropuestas.map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                          <p className="leading-relaxed">{s}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No hay soluciones propuestas registradas aún.</p>
                    )}
                  </div>
                </div>
              </div>

              {client.propuestaTecnicaUrl && (
                <div className="bg-primary p-5 rounded-xl flex items-center justify-between text-white shadow-lg shadow-primary/10 mt-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-7 h-7 text-white/95" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">Propuesta Técnica Activa</p>
                      <p className="text-[10px] text-white/60 font-semibold uppercase">PDF Adjunto listo para revisión</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white font-bold h-9 text-xs">
                    <Download className="w-4 h-4 mr-1" /> Descargar Propuesta
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* TAB: BITACORA COMERCIAL */}
            <TabsContent value="history" className="mt-0 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-primary">Línea de Tiempo de Gestiones</h4>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleWhatsAppDirect}
                    className="border-success text-success hover:bg-green-50 font-bold text-xs uppercase"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" /> WhatsApp Rápido
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setIsAddingInt(!isAddingInt)}
                    className="bg-accent hover:bg-accent/90 text-white font-bold text-xs uppercase"
                  >
                    <Plus className="w-4 h-4 mr-1" /> {isAddingInt ? "Cerrar Formulario" : "Registrar Interacción"}
                  </Button>
                </div>
              </div>

              {/* Formulario rápido para añadir interacción */}
              {isAddingInt && (
                <form onSubmit={handleAddInteraction} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Tipo de Gestión</label>
                      <Select 
                        value={intType} 
                        onValueChange={(val) => setIntType(val as any)}
                      >
                        <SelectTrigger className="w-full h-9 text-xs border-slate-300 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Llamada">Llamada</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Visita">Visita</SelectItem>
                          <SelectItem value="Reunión">Reunión</SelectItem>
                          <SelectItem value="Cotización">Cotización</SelectItem>
                          <SelectItem value="Correo">Correo</SelectItem>
                          <SelectItem value="Nota">Nota / Comentario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Responsable</label>
                      <Select 
                        value={intUser} 
                        onValueChange={(val) => setIntUser(val || "")}
                      >
                        <SelectTrigger className="w-full h-9 text-xs border-slate-300 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {sellerList.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Acción Realizada</label>
                      <Input 
                        placeholder="Ej: Presentación de propuesta" 
                        value={intAction} 
                        onChange={(e) => setIntAction(e.target.value)}
                        required
                        className="h-9 text-xs border-slate-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Detalles / Observaciones de la Gestión</label>
                    <Textarea 
                      placeholder="Escribe aquí los comentarios y acuerdos logrados en esta gestión..."
                      value={intObs}
                      onChange={(e) => setIntObs(e.target.value)}
                      className="min-h-[80px] text-xs border-slate-300 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsAddingInt(false)}
                      className="text-xs h-8 text-slate-600"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/95 text-white text-xs font-bold h-8 px-4"
                    >
                      Guardar en Historial
                    </Button>
                  </div>
                </form>
              )}

              {/* Lista de interacciones */}
              <div className="space-y-6 pt-2">
                {client.historialInteracciones && client.historialInteracciones.length > 0 ? (
                  client.historialInteracciones.map((item, i) => (
                    <div key={item.id || i} className="flex gap-4 relative group">
                      {i < (client.historialInteracciones?.length || 0) - 1 && (
                        <div className="absolute left-[22px] top-11 bottom-[-24px] w-[2px] bg-slate-100 group-hover:bg-slate-200 transition-colors" />
                      )}
                      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-200 bg-slate-50 font-bold text-primary">
                        <MessageSquare className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-800 uppercase">{item.accion}</span>
                              <Badge className="text-[9px] uppercase font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                {item.tipo}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase">
                              <span className="bg-slate-200/60 px-2 py-0.5 rounded text-slate-700 font-bold">{item.usuario}</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.fecha}</span>
                            </div>
                          </div>
                          {item.observaciones && (
                            <p className="text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-200/50 pt-2">
                              {item.observaciones}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                    <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500 uppercase">Sin Historial Comercial</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Registra tu primera interacción usando el botón de arriba.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB: ARCHIVOS ADJUNTOS */}
            <TabsContent value="files" className="mt-0 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-primary">Expedientes & Proformas</h4>
                <div className="relative">
                  <input
                    id="client-file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button 
                    size="sm" 
                    className="bg-accent hover:bg-accent/90 text-white font-bold text-xs uppercase"
                    onClick={() => document.getElementById("client-file-upload")?.click()}
                  >
                    <Paperclip className="w-4 h-4 mr-1" /> Adjuntar Archivo
                  </Button>
                </div>
              </div>

              {/* Lista de archivos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {client.archivosAdjuntos && client.archivosAdjuntos.length > 0 ? (
                  client.archivosAdjuntos.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate" title={file.nombre}>{file.nombre}</p>
                          <p className="text-[9px] text-muted-foreground font-semibold uppercase">{file.fecha} • {file.tamano || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                          title="Descargar"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => deleteFile(client.id, file.id)}
                          className="h-8 w-8 text-slate-400 hover:text-error hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                    <Paperclip className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500 uppercase">Sin Archivos Adjuntos</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Sube fotos de planta, proformas de cotizaciones o expedientes.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
