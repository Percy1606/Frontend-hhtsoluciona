"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import { Gasto } from "@/types/finanzas";
import { api } from "@/lib/api";
import { Loader2, Upload, FileText, CheckCircle2, Trash2, Coins, Receipt, Calendar, X } from "lucide-react";
import { cn, formatDate, getSecureUrl, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { GenericSecureDeleteModal } from "@/components/ui/generic-secure-delete-modal";

interface Rendicion {
    id: string;
    monto: number;
    fecha: string;
    comprobanteUrl?: string;
    observaciones?: string;
}

interface RendicionFormProps {
  gasto: Gasto;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function RendicionForm({ gasto, onSubmit, onCancel }: RendicionFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rendicionesHistory, setRendicionesHistory] = useState<Rendicion[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [mode, setMode] = useState<'GASTO' | 'VUELTO'>('GASTO');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rendicionToDelete, setRendicionToDelete] = useState<Rendicion | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm({
    defaultValues: {
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      observaciones: "",
      comprobanteUrl: "",
    },
  });

  const fetchHistory = async () => {
    try {
        setLoadingHistory(true);
        console.log(`[RendicionForm] Cargando historial para gasto: ${gasto.id}`);
        const res = await api.get(`/finanzas/gastos/${gasto.id}/rendiciones`);
        console.log(`[RendicionForm] Respuesta historial:`, res);
        
        // Manejo robusto de la respuesta: algunos endpoints devuelven { data: [] } y otros []
        const data = Array.isArray(res) ? res : (res?.data || []);
        setRendicionesHistory(data);
    } catch (error) {
        console.error("Error fetching rendiciones history", error);
        toast.error("No se pudo cargar el historial de rendiciones");
    } finally {
        setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [gasto.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/operaciones/upload', formData);
      setFileUrl(res.url);
      setFileName(file.name);
      form.setValue('comprobanteUrl', res.url);
    } catch (error) {
      toast.error("Error al subir el archivo");
      console.error("Error uploading file", error);
    } finally {
      setIsUploading(false);
    }
  };

  const currentSpent = rendicionesHistory.reduce((acc, r) => acc + Number(r.monto), 0);
  const remaining = Number(gasto.montoTotal) - currentSpent;
  const formMonto = Number(form.watch('monto') || 0);
  const finalRemaining = remaining - formMonto;

  const handleDevolverVuelto = () => {
      setMode('VUELTO');
      form.setValue('monto', Math.max(0, remaining));
      form.setValue('observaciones', "Devolución de vuelto (Saldo sobrante)");
  };

  const handleLocalSubmit = async (data: any) => {
      try {
          await onSubmit(data);
          fetchHistory();
          form.reset({
              monto: 0,
              fecha: new Date().toISOString().split('T')[0],
              observaciones: "",
              comprobanteUrl: "",
          });
          setFileUrl(null);
          setFileName(null);
          setMode('GASTO');
      } catch (error) {
          // Toast ya se maneja en el padre
      }
  };

  const handleSecureDelete = async (password: string) => {
    if (!rendicionToDelete) return;
    try {
        setDeleting(true);
        await api.post(`/finanzas/rendiciones/${rendicionToDelete.id}/secure-delete`, { password });
        toast.success("Rendición eliminada correctamente");
        setIsDeleteModalOpen(false);
        setRendicionToDelete(null);
        fetchHistory();
    } catch (error: any) {
        toast.error("Error al eliminar", { description: error.message });
    } finally {
        setDeleting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-h-[85vh] overflow-hidden">
      {/* COLUMNA IZQUIERDA: FORMULARIO (8/12) */}
      <div className="lg:col-span-8 space-y-6 overflow-y-auto pr-4 custom-scrollbar pb-6">
        <div className="flex flex-col gap-6">
            <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                <button 
                    type="button"
                    onClick={() => setMode('GASTO')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all duration-300",
                        mode === 'GASTO' 
                            ? "bg-white text-primary shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <Receipt className="w-3.5 h-3.5" /> Gasto
                </button>
                <button 
                    type="button"
                    onClick={handleDevolverVuelto}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all duration-300",
                        mode === 'VUELTO' 
                            ? "bg-white text-emerald-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <Coins className="w-3.5 h-3.5" /> Vuelto
                </button>
            </div>

            <div className={cn(
                "relative overflow-hidden p-6 rounded-[2rem] border transition-all duration-500 shadow-sm",
                mode === 'VUELTO' 
                    ? "bg-emerald-50/40 border-emerald-100 shadow-emerald-100/5" 
                    : "bg-slate-50/40 border-slate-100 shadow-slate-100/5"
            )}>
                <div className="flex justify-between items-center relative z-10">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Saldo Pendiente</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-bold text-slate-400">S/</span>
                            <span className="text-lg font-black text-slate-800 tracking-tighter tabular-nums">
                                {remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="h-10 w-px bg-slate-200/60" />
                        <div className="space-y-1 text-right">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Nuevo Balance</p>
                            <div className="flex items-baseline justify-end gap-1">
                                <span className={cn("text-[10px] font-bold", finalRemaining < 0 ? "text-red-400" : "text-emerald-400")}>S/</span>
                                <span className={cn(
                                    "text-lg font-black tracking-tighter tabular-nums",
                                    finalRemaining < 0 ? "text-red-600" : "text-emerald-600"
                                )}>
                                    {finalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Decorative element */}
                <div className={cn(
                    "absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.02] rotate-12 transition-colors duration-500",
                    mode === 'VUELTO' ? "text-emerald-600" : "text-primary"
                )}>
                    {mode === 'VUELTO' ? <Coins size={96} /> : <Receipt size={96} />}
                </div>
            </div>
        </div>

        <Form {...form}>
        <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="monto"
                    rules={{ required: "Requerido", min: { value: 0.01, message: "Monto inválido" } }}
                    render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <FormLabel className="font-black text-[8px] uppercase text-slate-400 tracking-widest flex items-center gap-1.5 px-1">
                            <div className={cn("w-1 h-1 rounded-full", mode === 'VUELTO' ? "bg-emerald-500" : "bg-primary")} />
                            Monto {mode === 'GASTO' ? 'Comprobante' : 'Reintegro'}
                        </FormLabel>
                        <FormControl>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[9px] group-focus-within:text-primary transition-colors">S/</div>
                                <Input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="0.00" 
                                    {...field} 
                                    readOnly={mode === 'VUELTO'}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="bg-white border-slate-200 h-9 pl-7 font-black text-sm text-slate-800 rounded-lg focus-visible:ring-primary/10 transition-all shadow-sm group-hover:border-slate-300" 
                                />
                            </div>
                        </FormControl>
                        <FormMessage className="text-[8px] font-bold px-1" />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="fecha"
                    rules={{ required: "Requerido" }}
                    render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <FormLabel className="font-black text-[8px] uppercase text-slate-400 tracking-widest flex items-center gap-1.5 px-1">
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            Fecha Registro
                        </FormLabel>
                        <FormControl>
                            <Input 
                                type="date" 
                                {...field} 
                                className="bg-white border-slate-200 h-9 font-bold text-[9px] rounded-lg focus-visible:ring-primary/10 transition-all shadow-sm hover:border-slate-300" 
                            />
                        </FormControl>
                        <FormMessage className="text-[8px] font-bold px-1" />
                    </FormItem>
                    )}
                />
            </div>

            {mode === 'GASTO' && (
                <div className="space-y-1.5">
                    <FormLabel className="font-black text-[8px] uppercase text-slate-400 tracking-widest flex items-center gap-1.5 px-1">
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        Archivo Sustento
                    </FormLabel>
                    <div className="relative group">
                        <Input 
                            type="file" 
                            onChange={handleFileChange}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                        />
                        <div className={cn(
                            "h-10 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all duration-500 px-4",
                            fileUrl 
                                ? "bg-emerald-50/40 border-emerald-200/60 shadow-inner" 
                                : "bg-white border-slate-200 group-hover:border-primary/40 group-hover:bg-slate-50/50 shadow-sm"
                        )}>
                            {isUploading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                                    <p className="text-[8px] font-black text-primary uppercase tracking-widest animate-pulse">Subiendo...</p>
                                </div>
                            ) : fileUrl ? (
                                <div className="flex items-center gap-2 w-full">
                                    <button 
                                        type="button"
                                        onClick={() => setPreviewUrl(getSecureUrl(fileUrl))}
                                        className="w-7 h-7 bg-emerald-100 rounded-md flex items-center justify-center shrink-0 shadow-sm hover:opacity-80 transition-all overflow-hidden border border-emerald-200"
                                        title="Ver comprobante"
                                    >
                                        {fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <img 
                                                src={getSecureUrl(fileUrl)} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <button 
                                            type="button"
                                            onClick={() => setPreviewUrl(getSecureUrl(fileUrl))}
                                            className="text-[9px] font-black text-slate-800 uppercase truncate hover:text-primary transition-colors block text-left"
                                        >
                                            {fileName}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center border border-slate-100 group-hover:text-primary transition-all">
                                        <Upload className="w-3 h-3 text-slate-400 group-hover:text-primary" />
                                    </div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Adjuntar</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                <FormItem className="space-y-1.5">
                    <FormLabel className="font-black text-[8px] uppercase text-slate-400 tracking-widest flex items-center gap-1.5 px-1">
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        Notas
                    </FormLabel>
                    <FormControl>
                    <Textarea 
                        placeholder={mode === 'GASTO' ? "Breve descripción..." : "Motivo reintegro..."} 
                        {...field} 
                        className="bg-white border-slate-200 min-h-[60px] font-medium text-xs resize-none rounded-xl focus-visible:ring-primary/10 shadow-sm leading-relaxed p-3 hover:border-slate-300 transition-all" 
                    />
                    </FormControl>
                    <FormMessage className="text-[8px] font-bold px-1" />
                </FormItem>
                )}
            />

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={onCancel} 
                    className="font-black uppercase text-[9px] tracking-widest text-slate-400 hover:text-slate-600 px-6 h-11 rounded-xl transition-all"
                >
                    Cancelar
                </Button>
                <Button 
                    type="submit" 
                    disabled={isUploading || (mode === 'GASTO' && !fileUrl) || formMonto <= 0}
                    className={cn(
                        "font-black uppercase text-[9px] tracking-widest text-white px-8 h-11 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg",
                        mode === 'VUELTO' 
                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/40" 
                            : "bg-primary hover:bg-primary/90 shadow-primary/20"
                    )}
                >
                    Guardar
                </Button>
            </div>
        </form>
        </Form>
      </div>

      {/* COLUMNA DERECHA: HISTORIAL (4/12) */}
      <div className="lg:col-span-4 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-6 flex flex-col h-full overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
                    <Receipt className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Historial</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Validado</p>
                  </div>
              </div>
              <Badge variant="outline" className="h-6 px-3 rounded-full text-[9px] font-black uppercase text-primary border-primary/20 bg-primary/5">
                {rendicionesHistory.length}
              </Badge>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
              {loadingHistory ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
                      <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
                  </div>
              ) : rendicionesHistory.length > 0 ? (
                  rendicionesHistory.map((r, idx) => (
                      <div key={r.id} className="group bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm hover:border-primary/30 transition-all duration-500 relative overflow-hidden">
                          <div className={cn(
                              "absolute left-0 top-0 bottom-0 w-1",
                              r.comprobanteUrl ? "bg-primary/60" : "bg-emerald-400/60"
                          )} />
                          
                          <div className="flex justify-between items-start relative z-10">
                              <div className="space-y-1">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-[9px] font-bold text-slate-400">S/</span>
                                    <p className="text-base font-black text-slate-800 tabular-nums tracking-tighter">
                                        {Number(r.monto).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3 text-slate-300" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
                                        {formatDate(r.fecha)}
                                    </p>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  {r.comprobanteUrl ? (
                                      <button 
                                        onClick={() => setPreviewUrl(getSecureUrl(r.comprobanteUrl))}
                                        className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-500 border border-slate-100"
                                        title="Ver Comprobante"
                                      >
                                          <FileText className="w-5 h-5" />
                                      </button>
                                  ) : (
                                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100/50">
                                          <Coins className="w-5 h-5" />
                                      </div>
                                  )}

                                  {/* Botón de Eliminar con Admin */}
                                  <button 
                                    onClick={() => { setRendicionToDelete(r); setIsDeleteModalOpen(true); }}
                                    className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-error hover:text-white transition-all duration-500 border border-slate-100"
                                    title="Eliminar Rendición (Admin)"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-12 opacity-20 grayscale scale-90">
                      <Receipt className="w-10 h-10" />
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Sin registros</p>
                  </div>
              )}
          </div>

          <div className="mt-6">
              <div className="bg-slate-900 p-4 rounded-2xl shadow-md relative overflow-hidden group">
                  <div className="flex justify-between items-center relative z-10">
                      <div className="space-y-0.5">
                          <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Total</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-bold text-slate-600">S/</span>
                            <p className="text-base font-black text-white tracking-tighter tabular-nums">
                                {currentSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                      </div>
                      <div className="text-right space-y-0.5">
                          <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Progreso</p>
                          <p className="text-base font-black text-primary tracking-tighter tabular-nums">
                              {Math.round((currentSpent / Number(gasto.montoTotal)) * 100)}%
                          </p>
                      </div>
                  </div>
                  
                  <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative z-10 shadow-inner">
                    <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary),0.6)]"
                        style={{ width: `${Math.min(100, (currentSpent / Number(gasto.montoTotal)) * 100)}%` }}
                    />
                  </div>
              </div>
          </div>
      </div>

      {/* OVERLAY DE VISTA PREVIA (LIGHTBOX) */}
      {previewUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
              <div 
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm cursor-zoom-out" 
                onClick={() => setPreviewUrl(null)}
              />
              <div className="relative max-w-5xl w-full max-h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                  <button 
                    onClick={() => setPreviewUrl(null)}
                    className="absolute -top-12 right-0 md:-right-12 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all border border-white/20 shadow-2xl"
                  >
                      <X className="w-5 h-5" />
                  </button>
                  <div className="bg-white p-1 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center">
                    {previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img 
                            src={previewUrl} 
                            alt="Vista previa" 
                            className="max-w-full max-h-[80vh] w-auto h-auto rounded-xl select-none shadow-2xl object-contain"
                            style={{ height: 'auto' }}
                        />
                    ) : (
                        <iframe 
                            src={previewUrl} 
                            className="w-[80vw] h-[75vh] rounded-xl border-none"
                            title="Visor de PDF"
                        />
                    )}
                  </div>
              </div>
          </div>
      )}

      <GenericSecureDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => { setIsDeleteModalOpen(false); setRendicionToDelete(null); }}
          onConfirm={handleSecureDelete}
          entityName={`Rendición de ${rendicionToDelete ? formatCurrency(rendicionToDelete.monto) : ""}`}
          loading={deleting}
      />
    </div>
  );
}
