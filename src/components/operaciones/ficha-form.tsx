"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ClipboardList, 
  Camera, 
  Save, 
  X, 
  FileUp, 
  CheckCircle2, 
  Users, 
  Zap, 
  MapPin, 
  Building2, 
  Plus, 
  Trash2,
  Info
} from "lucide-react";
import { api } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";

interface FichaFormProps {
  ficha: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const SECTORES = ['Agro', 'Pesca', 'Industrial', 'Comercial'];
const MOTIVOS = ['Inspección técnica', 'Diagnóstico', 'Termografía', 'Calidad de energía', 'Reunión técnica'];

export function FichaForm({ ficha, onSubmit, onCancel }: FichaFormProps) {
  const [uploading, setUploading] = useState(false);
  const [constanciaUrl, setConstanciaUrl] = useState<string | null>(ficha.adjuntos?.find((a: any) => a.nombre.includes('CONSTANCIA'))?.url || null);

  const defaultDatosTecnicos = {
    sector: "",
    sectorOtro: "",
    distrito: "",
    provincia: "",
    contactoCargo: "",
    participantes: [{ nombre: "", cargo: "" }],
    sistemaElectrico: {
      tieneSubestacion: false,
      potenciaKva: "",
      cantidadTransformadores: "",
      ultimoMantenimiento: "",
      empresaMantenimiento: ""
    },
    motivos: [],
    motivoOtro: "",
    comentariosCliente: "",
    comentariosExtras: ""
  };

  const form = useForm({
    defaultValues: {
      hallazgos: ficha.hallazgos || "",
      recomendaciones: ficha.recomendaciones || "",
      observaciones: ficha.observaciones || "",
      firmaTecnico: ficha.firmaTecnico || "",
      adjuntos: ficha.adjuntos || [],
      datosTecnicos: ficha.datosTecnicos && Object.keys(ficha.datosTecnicos).length > 0 
        ? ficha.datosTecnicos 
        : defaultDatosTecnicos
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "datosTecnicos.participantes"
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'CONSTANCIA' | 'FOTO') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/operaciones/fichas-tecnicas/upload', formData);
      
      const newAdjunto = {
        nombre: type === 'CONSTANCIA' ? `CONSTANCIA_${file.name}` : file.name,
        url: res.url,
        tipo: file.type.includes('image') ? 'Imagen' : 'Documento'
      };

      const currentAdjuntos = form.getValues('adjuntos') || [];
      form.setValue('adjuntos', [...currentAdjuntos, newAdjunto]);
      
      if (type === 'CONSTANCIA') {
        setConstanciaUrl(res.url);
      }
      
      alert("Archivo subido correctamente.");
    } catch (error) {
      alert("Error al subir el archivo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col bg-slate-50/50">
        <ScrollArea className="flex-1 max-h-[80vh]">
          <div className="space-y-8 p-8">
            
            {/* 1. DATOS GENERALES Y SECTOR */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-primary uppercase tracking-tight text-sm">1. Datos Generales y Sector</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Información base de la empresa y rubro</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Empresa</label>
                    <Input disabled value={ficha.cliente?.empresa} className="bg-slate-50 font-bold uppercase text-xs" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">RUC</label>
                    <Input disabled value={ficha.cliente?.ruc} className="bg-slate-50 font-bold text-xs" />
                 </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Sector Económico</label>
                <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  {SECTORES.map((sector) => (
                    <FormField
                      key={sector}
                      control={form.control}
                      name="datosTecnicos.sector"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value === sector}
                              onCheckedChange={() => field.onChange(sector)}
                            />
                          </FormControl>
                          <FormLabel className="text-xs font-bold text-slate-600 uppercase cursor-pointer">{sector}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                  <FormField
                    control={form.control}
                    name="datosTecnicos.sectorOtro"
                    render={({ field }) => (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Otro:</span>
                        <Input {...field} className="h-7 text-xs" placeholder="..." />
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* 2. UBICACIÓN Y CONTACTO */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-primary uppercase tracking-tight text-sm">2. Ubicación y Contacto Principal</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Detalles logísticos y de enlace</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Dirección Completa</label>
                  <Input disabled value={ficha.cliente?.direccion} className="bg-slate-50 font-bold uppercase text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="datosTecnicos.distrito"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 ml-1">Distrito</     FormLabel>
                        <FormControl><Input {...field} className="text-xs uppercase font-bold" /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="datosTecnicos.provincia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 ml-1">Provincia</FormLabel>
                        <FormControl><Input {...field} className="text-xs uppercase font-bold" /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="opacity-50" />

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Contacto</label>
                    <Input disabled value={ficha.cliente?.contacto} className="bg-slate-50 font-bold uppercase text-xs" />
                 </div>
                 <FormField
                    control={form.control}
                    name="datosTecnicos.contactoCargo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 ml-1">Cargo Contacto</FormLabel>
                        <FormControl><Input {...field} className="text-xs uppercase font-bold" /></FormControl>
                      </FormItem>
                    )}
                  />
              </div>
            </div>

            {/* 4. OTROS PARTICIPANTES */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-primary uppercase tracking-tight text-sm">4. Otros Participantes</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Personal presente en la visita</p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ nombre: "", cargo: "" })}
                  className="h-8 font-black text-[10px] uppercase border-primary/20 text-primary hover:bg-primary/5"
                >
                  <Plus className="w-3 h-3 mr-1" /> Agregar Fila
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-end bg-slate-50/50 p-3 rounded-xl border border-slate-100 group">
                    <div className="flex-1 space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nombre Completo</label>
                       <Input {...form.register(`datosTecnicos.participantes.${index}.nombre`)} className="h-8 text-xs bg-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cargo</label>
                       <Input {...form.register(`datosTecnicos.participantes.${index}.cargo`)} className="h-8 text-xs bg-white" />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => remove(index)}
                      className="h-8 w-8 text-error opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. SISTEMA ELÉCTRICO */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-amber-600 uppercase tracking-tight text-sm">5. Información del Sistema Eléctrico</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Datos técnicos de infraestructura</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                   <FormField
                    control={form.control}
                    name="datosTecnicos.sistemaElectrico.tieneSubestacion"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 space-y-0 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs font-black text-slate-700 uppercase">¿Cuenta con subestación eléctrica?</FormLabel>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Marcar si posee transformadores propios</p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="datosTecnicos.sistemaElectrico.potenciaKva"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 ml-1">Potencia Transformador (kVA)</FormLabel>
                        <FormControl><Input {...field} className="text-xs font-bold" placeholder="Ej: 500" /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="datosTecnicos.sistemaElectrico.cantidadTransformadores"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 ml-1">Cantidad de Transformadores</FormLabel>
                        <FormControl><Input {...field} className="text-xs font-bold" placeholder="Ej: 2" /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="datosTecnicos.sistemaElectrico.ultimoMantenimiento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 ml-1">Último Mantenimiento</FormLabel>
                        <FormControl><Input type="date" {...field} className="text-xs font-bold" /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <FormField
                control={form.control}
                name="datosTecnicos.sistemaElectrico.empresaMantenimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-slate-400 ml-1">Empresa que realizó el mantenimiento</FormLabel>
                    <FormControl><Input {...field} className="text-xs font-bold uppercase" /></FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* 6. MOTIVO DE LA VISITA */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-indigo-600 uppercase tracking-tight text-sm">6. Motivo de la Visita</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Objetivos de la inspección técnica</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                {MOTIVOS.map((motivo) => (
                  <FormField
                    key={motivo}
                    control={form.control}
                    name="datosTecnicos.motivos"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value?.includes(motivo)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              field.onChange(checked ? [...current, motivo] : current.filter((m: string) => m !== motivo));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-[10px] font-bold text-slate-600 uppercase cursor-pointer">{motivo}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
                <FormField
                  control={form.control}
                  name="datosTecnicos.motivoOtro"
                  render={({ field }) => (
                    <div className="flex items-center gap-2 col-span-2 mt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Otro:</span>
                      <Input {...field} className="h-7 text-xs" placeholder="..." />
                    </div>
                  )}
                />
              </div>
            </div>

            {/* 7, 8 & INSPECCION - HALLAZGOS Y COMENTARIOS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-primary uppercase tracking-tight text-sm">Inspección y Observaciones Finales</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Registro de hallazgos y feedback del cliente</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="hallazgos"
                  rules={{ required: "Describa los hallazgos" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-slate-500 ml-1">Hallazgos Técnicos (ERP)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="min-h-[150px] text-xs font-bold leading-relaxed resize-none"
                          placeholder="Escriba aquí los hallazgos detallados..."
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recomendaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-slate-500 ml-1">Soluciones Propuestas (ERP)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="min-h-[150px] text-xs font-bold leading-relaxed resize-none"
                          placeholder="Escriba aquí las recomendaciones..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="datosTecnicos.comentariosCliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-slate-500 ml-1">7. Comentarios del Cliente</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[100px] text-xs resize-none" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="datosTecnicos.comentariosExtras"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-slate-500 ml-1">8. Comentarios Extras</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[100px] text-xs resize-none" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* DOCUMENTACIÓN Y EVIDENCIA */}
            <div className="grid grid-cols-2 gap-8">
               {/* Constancia */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-tight">Constancia Firmada</h3>
                  <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
                    {constanciaUrl ? (
                      <div className="flex flex-col items-center gap-2 text-success">
                        <CheckCircle2 className="w-10 h-10" />
                        <span className="text-[10px] font-black uppercase">Constancia Cargada</span>
                        <Button variant="link" size="sm" type="button" onClick={() => window.open(constanciaUrl, '_blank')} className="text-[10px] font-bold">Ver Archivo</Button>
                      </div>
                    ) : (
                      <>
                        <FileUp className="w-10 h-10 text-slate-400" />
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-600 uppercase">Subir Constancia Firmada</p>
                        </div>
                        <label className="cursor-pointer">
                          <Input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, 'CONSTANCIA')}
                            disabled={uploading}
                          />
                          <Button type="button" variant="outline" className="font-black text-[10px] uppercase h-9 border-slate-300 pointer-events-none" disabled={uploading}>
                            {uploading ? "Subiendo..." : "Seleccionar"}
                          </Button>
                        </label>
                      </>
                    )}
                  </div>
               </div>

               {/* Fotos Adicionales */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-tight">Fotos del Sitio</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {form.watch('adjuntos').filter((a: any) => !a.nombre.includes('CONSTANCIA')).map((adj: any, idx: number) => (
                      <div key={idx} className="aspect-square rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border">
                          <img src={adj.url} alt="Evidencia" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all cursor-pointer">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[8px] font-black uppercase">Foto</span>
                      <Input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'FOTO')}
                        disabled={uploading}
                      />
                    </label>
                  </div>
               </div>
            </div>

          </div>
        </ScrollArea>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-white mt-auto shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel} 
            className="font-black text-[10px] text-slate-400 hover:text-slate-600 uppercase h-10"
          >
            DESCARTAR CAMBIOS
          </Button>
          <Button 
            type="submit" 
            disabled={uploading}
            className="bg-success hover:bg-success/90 text-white font-black px-10 h-10 shadow-lg shadow-success/20 uppercase text-xs tracking-tight"
          >
            {uploading ? "PROCESANDO..." : "FINALIZAR Y SINCRONIZAR A CRM"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
