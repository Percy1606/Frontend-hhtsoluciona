"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon } from "lucide-react";
import { Client, Interaction } from "@/types/crm";
import { useCRMStore } from "@/store/crm-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModernDialog, DialogType } from "@/components/ui/modern-dialog";
import { format } from "date-fns";

interface FollowUpModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FollowUpModal({ client, isOpen, onClose }: FollowUpModalProps) {
  const { scheduleFollowUp } = useCRMStore();
  const [modernDialog, setModernDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: DialogType;
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "info"
  });
  
  const form = useForm({
    defaultValues: {
      fecha: "",
      accion: "",
      tipo: "Llamada" as Interaction['tipo'],
    },
  });

  // Sync form with client when modal opens
  useEffect(() => {
    if (client && isOpen) {
      form.reset({
        fecha: client.proximoSeguimiento ? client.proximoSeguimiento.split('T')[0] : new Date().toISOString().split('T')[0],
        accion: client.accion || "",
        tipo: "Llamada",
      });
    }
  }, [client, isOpen, form]);

  if (!client) return null;

  const onSubmit = (data: any) => {
    const selectedDate = new Date(data.fecha + 'T12:00:00'); 
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Validar año irreal
    if (selectedDate.getFullYear() < 2024) {
      setModernDialog({
        isOpen: true,
        title: "Fecha Inválida",
        description: `El año ${selectedDate.getFullYear()} no es válido para registros comerciales. Por favor verifique la fecha.`,
        type: "error"
      });
      return;
    }

    // 2. Restricción del mismo día (opcional según interpretación del usuario, pero él lo pidió)
    if (selectedDate.getTime() === today.getTime()) {
        setModernDialog({
          isOpen: true,
          title: "Programación Restringida",
          description: "No se recomienda programar el próximo seguimiento para el mismo día de hoy. Debe ser una fecha futura para seguimiento o pasada para historial.",
          type: "warning"
        });
        return;
    }

    // 3. Confirmación de fecha pasada
    if (selectedDate < today) {
      setModernDialog({
        isOpen: true,
        title: "Confirmar Fecha Pasada",
        description: `Está registrando una gestión con fecha retroactiva (${format(selectedDate, "dd/MM/yyyy")}). ¿Está seguro que desea guardar un historial pasado?`,
        type: "confirm",
        showCancel: true,
        onConfirm: () => {
          scheduleFollowUp(client.id, data.fecha, data.accion, data.tipo);
          setModernDialog(prev => ({ ...prev, isOpen: false }));
          onClose();
        }
      });
      return;
    }

    scheduleFollowUp(client.id, data.fecha, data.accion, data.tipo);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl p-0 border-none bg-white shadow-2xl overflow-hidden rounded-xl">
          <DialogHeader className="bg-primary text-white p-6 rounded-t-xl shrink-0">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-accent" />
              REGISTRAR ACCIÓN / SEGUIMIENTO
            </DialogTitle>
            <p className="text-white/60 text-[10px] font-bold uppercase mt-1">
              CLIENTE: {client.empresa}
            </p>
          </DialogHeader>
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-primary text-[10px] uppercase">Tipo de Gestión</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-slate-200 text-xs font-bold bg-white">
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            <SelectItem value="Llamada">Llamada</SelectItem>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Visita">Visita</SelectItem>
                            <SelectItem value="Correo">Correo</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fecha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-primary text-[10px] uppercase">Próximo Seguimiento</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="date" {...field} className="pl-10 border-slate-200 text-xs font-bold" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="accion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-primary text-[10px] uppercase">Acción Realizada / Observaciones</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ej: Se llamó para confirmar recepción de presupuesto..." 
                          className="min-h-[100px] border-slate-200 resize-none text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={onClose} className="font-bold text-slate-500 uppercase text-xs">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 font-black px-8 shadow-lg uppercase text-xs">
                    Guardar Gestión
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <ModernDialog 
        isOpen={modernDialog.isOpen}
        onOpenChange={(open) => setModernDialog(prev => ({ ...prev, isOpen: open }))}
        title={modernDialog.title}
        description={modernDialog.description}
        type={modernDialog.type}
        showCancel={modernDialog.showCancel}
        onConfirm={modernDialog.onConfirm}
        confirmText={modernDialog.type === "confirm" ? "Sí, Guardar" : "Entendido"}
        cancelText="Volver"
      />
    </>
  );
}

