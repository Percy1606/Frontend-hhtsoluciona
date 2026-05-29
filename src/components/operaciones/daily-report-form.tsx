"use client";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle,
  FileText
} from "lucide-react";

export function DailyReportForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void, onCancel: () => void }) {
  const form = useForm({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      actividades: "",
      hallazgos: "",
      personal: "",
      proximosPasos: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Fecha del Reporte</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="personal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Personal en Campo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Luis Ch., Pedro S." {...field} className="border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="actividades"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Actividades Realizadas
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describa las tareas ejecutadas hoy..." 
                      className="min-h-[100px] border-border"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hallazgos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Hallazgos / Observaciones
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Reporte anomalías, riesgos o cambios en el sitio..." 
                      className="min-h-[100px] border-border"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-6 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 bg-muted/20">
              <Camera className="w-8 h-8 text-muted-foreground" />
              <p className="text-xs font-black text-muted-foreground uppercase">Adjuntar Evidencia Fotográfica</p>
              <Button type="button" variant="outline" size="sm" className="mt-2 font-bold border-primary text-primary">
                Subir Imágenes
              </Button>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} className="font-bold">
            Cancelar
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 font-bold px-8 gap-2">
            <FileText className="w-4 h-4" /> Finalizar Reporte
          </Button>
        </div>
      </form>
    </Form>
  );
}
