"use client";

import { useState } from "react";
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
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Client } from "@/mocks/data";
import { useCRMStore } from "@/store/crm-store";

interface FollowUpModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FollowUpModal({ client, isOpen, onClose }: FollowUpModalProps) {
  const { scheduleFollowUp } = useCRMStore();
  const form = useForm({
    defaultValues: {
      fecha: client?.proximoSeguimiento || new Date().toISOString().split('T')[0],
      accion: client?.accion || "",
    },
  });

  if (!client) return null;

  const onSubmit = (data: any) => {
    scheduleFollowUp(client.id, data.fecha, data.accion);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 border-none bg-white shadow-2xl overflow-hidden rounded-xl">
        <DialogHeader className="bg-primary text-white p-6 rounded-t-xl shrink-0">
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-accent" />
            Agendar Seguimiento
          </DialogTitle>
          <p className="text-white/60 text-xs font-bold uppercase mt-1">
            Cliente: {client.empresa}
          </p>
        </DialogHeader>
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-primary">Fecha de Seguimiento</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="date" {...field} className="pl-10 border-border" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-primary">Acción a Realizar</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ej: Llamar para confirmar presupuesto, Visita técnica..." 
                        className="min-h-[100px] border-border resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={onClose} className="font-bold">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 font-bold px-8 shadow-lg shadow-primary/20">
                  Agendar Acción
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
