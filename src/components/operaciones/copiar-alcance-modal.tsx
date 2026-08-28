"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useCRMStore } from "@/store/crm-store";
import { api } from "@/lib/api";
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  FileText,
  AlertCircle,
  Copy,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Proyecto } from "@/lib/types";

interface AlcanceItem {
  id: string;
  label: string;
  selected: boolean;
  tipo: string;
}

interface CopiarAlcanceModalProps {
  proyecto: Proyecto;
  isOpen: boolean;
  onClose: () => void;
}

export function CopiarAlcanceModal({ proyecto, isOpen, onClose }: CopiarAlcanceModalProps) {
  const { responsables, fetchResponsables, addActividad, fetchProyectos } = useOperacionesStore();
  const { quotes } = useCRMStore();
  
  const [alcanceItems, setAlcanceItems] = useState<AlcanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultResponsable, setDefaultResponsable] = useState(
    proyecto.responsablePrincipalId || (responsables.length > 0 ? responsables[0].id : "")
  );
  const [defaultTipo, setDefaultTipo] = useState("Técnica");

  // Cargar responsables si es necesario
  useEffect(() => {
    if (isOpen && responsables.length === 0) {
      fetchResponsables();
    }
  }, [isOpen, responsables.length, fetchResponsables]);

  // Cuando los responsables carguen, si el defaultResponsable no coincide, asignar el primero disponible
  useEffect(() => {
    if (responsables.length === 0) return;
    setDefaultResponsable((prev) => {
      if (!prev || !responsables.some((r) => r.id === prev)) {
        return proyecto.responsablePrincipalId && responsables.some((r) => r.id === proyecto.responsablePrincipalId)
          ? proyecto.responsablePrincipalId
          : responsables[0].id;
      }
      return prev;
    });
  }, [responsables, proyecto.responsablePrincipalId]);



  // Buscar la cotización asociada al proyecto
  const cotizacion = useMemo(() => {
    const p = proyecto as any;
    const cotId = p.cotizacionId || p.cotizacionOrigenId || p.cotizacion?.id || p.cotizacionOrigen?.id;
    
    if (cotId) return quotes.find((q: any) => q.id === cotId);
    
    // Buscar por coincidencia de código
    return quotes.find((q: any) => 
      q.proyectoGeneradoId === proyecto.id ||
      (q.codigo && proyecto.codigo && q.codigo.replace(/[^a-zA-Z0-9]/g, '') === proyecto.codigo.replace(/[^a-zA-Z0-9]/g, ''))
    );
  }, [proyecto, quotes]);

  // Cargar el alcance cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;

    const cargarAlcance = async () => {
      setLoading(true);
      const items: AlcanceItem[] = [];

      try {
        // Intentar cargar desde la cotización completa
        let alcance: any = null;

        if (cotizacion) {
          alcance = typeof cotizacion.alcance === 'string' 
            ? JSON.parse(cotizacion.alcance) 
            : cotizacion.alcance;
        } else {
          // Si no tenemos la cotización en el store, intentar desde la API
          const p = proyecto as any;
          const cotId = p.cotizacionId || p.cotizacionOrigenId || p.cotizacion?.id || p.cotizacionOrigen?.id;
          if (cotId) {
            try {
              const cotData = await api.get(`/crm/cotizaciones/${cotId}`);
              if (cotData?.alcance) {
                alcance = typeof cotData.alcance === 'string' ? JSON.parse(cotData.alcance) : cotData.alcance;
              }
            } catch (e) {
              console.warn("No se pudo cargar la cotización desde la API:", e);
            }
          }
        }

        if (!alcance) {
          // Sin alcance disponible
          setAlcanceItems([]);
          setLoading(false);
          return;
        }

        // Parsear el alcance según su estructura
        if (Array.isArray(alcance)) {
          alcance.forEach((item: any, idx: number) => {
            const texto = typeof item === 'string' ? item : (item.descripcion || item.nombre || JSON.stringify(item));
            items.push({
              id: `alcance-${idx}`,
              label: texto,
              selected: true,
              tipo: determinarTipo(texto, idx),
            });
          });
        } else if (typeof alcance === 'object') {
          // Alcance con campos como evaluacion, ingenieria, expediente
          const campos = [
            { key: 'evaluacion', label: 'Evaluación Técnica' },
            { key: 'ingenieria', label: 'Ingeniería y Diseño' },
            { key: 'expediente', label: 'Expediente Técnico' },
            { key: 'instalacion', label: 'Instalación' },
            { key: 'pruebas', label: 'Pruebas y Puesta en Marcha' },
            { key: 'capacitacion', label: 'Capacitación' },
          ];

          campos.forEach((campo, idx) => {
            const valor = alcance[campo.key];
            if (valor && typeof valor === 'string' && valor.trim() !== '' && valor !== '—') {
              items.push({
                id: `alcance-${campo.key}`,
                label: `${campo.label}: ${valor}`,
                selected: true,
                tipo: determinarTipo(valor, idx),
              });
            }
          });

          // También buscar cualquier otro campo que pueda tener contenido
          Object.entries(alcance).forEach(([key, value]) => {
            if (!campos.some(c => c.key === key) && value && typeof value === 'string' && value.trim() !== '' && value !== '—') {
              items.push({
                id: `alcance-${key}`,
                label: `${key}: ${value}`,
                selected: true,
                tipo: 'Técnica',
              });
            }
          });
        }
      } catch (e) {
        console.error("Error cargando alcance:", e);
      }

      setAlcanceItems(items);
      setLoading(false);
    };

    cargarAlcance();
  }, [isOpen, cotizacion, proyecto]);

  function determinarTipo(texto: string, idx: number): string {
    const upper = texto.toUpperCase();
    if (upper.includes('INSTAL') || upper.includes('MONTA') || upper.includes('OBRA')) return 'Técnica';
    if (upper.includes('DOCUM') || upper.includes('EXPED') || upper.includes('PLANO') || upper.includes('DISEÑO')) return 'Documental';
    if (upper.includes('LOGÍST') || upper.includes('MATERIAL') || upper.includes('RECUR')) return 'Logística';
    if (upper.includes('ADMIN') || upper.includes('CONTRAT') || upper.includes('PERMIS')) return 'Administrativa';
    if (upper.includes('VALID') || upper.includes('APROB') || upper.includes('INSPEC')) return 'Validación';
    // Alternar tipos automáticamente para variedad
    const tipos = ['Técnica', 'Documental', 'Logística', 'Administrativa', 'Validación'];
    return tipos[idx % tipos.length];
  }

  const toggleItem = (id: string) => {
    setAlcanceItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const selectedItems = alcanceItems.filter((i) => i.selected);
  const puedeCrear = selectedItems.length > 0 && defaultResponsable;

  const handleCrearActividades = async () => {
    if (!puedeCrear) {
      toast.error("Selecciona al menos un ítem del alcance");
      return;
    }

    setSaving(true);
    let creadas = 0;
    let errores = 0;

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      try {
        await addActividad(proyecto.id, {
          proyectoId: proyecto.id,
          descripcion: `[ALCANCE N°${i + 2}] ${item.label}`.toUpperCase(),
          tipo: item.tipo as any,
          prioridad: "Media",
          estado: "Pendiente",
          fechaCreacion: new Date().toISOString(),
          fechaInicio: new Date().toISOString(),
          responsablePrincipalId: defaultResponsable,
          responsablesApoyo: [],
          subtareas: [],
          validacionesRequeridas: [],
          comentarios: [],
          evidencias: [],
          progreso: 0,
          ponderacion: 1,
          orden: i + 1,
        });
        creadas++;
      } catch (error) {
        console.error(`Error creando actividad desde alcance:`, error);
        errores++;
      }
    }

    setSaving(false);

    if (errores === 0) {
      toast.success(`¡${creadas} actividades creadas desde el Alcance!`, {
        description: `Se copiaron exitosamente los ${creadas} ítems del alcance del servicio.`,
      });
      await fetchProyectos();
      onClose();
    } else {
      toast.warning(`${creadas} actividades creadas, ${errores} error(es)`, {
        description: "Algunos ítems no pudieron crearse. Revisa e intenta de nuevo.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] p-0 border-none bg-white flex flex-col rounded-2xl shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 bg-gradient-to-br from-secondary via-secondary to-secondary/90 text-white shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
            <Copy className="w-7 h-7 text-accent" />
            Copiar desde Alcance del Servicio
          </DialogTitle>
          <p className="text-white/70 font-bold uppercase text-[10px] mt-1">
            Proyecto: {proyecto.codigo} — {proyecto.nombre}
          </p>
          {cotizacion && (
            <Badge className="bg-white/10 text-white border-white/20 font-black text-[9px] uppercase mt-2 w-fit">
              Cotización: {(cotizacion as any).codigo || "N/A"}
            </Badge>
          )}
        </DialogHeader>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Cargando alcance del servicio...
              </p>
            </div>
          ) : alcanceItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <AlertCircle className="w-12 h-12 text-slate-200" />
              <div className="text-center">
                <p className="text-sm font-black text-slate-400 uppercase">
                  Sin alcance disponible
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Este proyecto no tiene un alcance del servicio definido en su cotización.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* CONFIGURACIÓN GLOBAL */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Configuración por defecto
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1 block">
                      Responsable para todas *
                    </Label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-[11px] uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                      value={defaultResponsable}
                      onChange={(e) => setDefaultResponsable(e.target.value)}
                    >
                      <option value="">SELECCIONAR...</option>
                      {responsables.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre} ({r.area})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1 block">
                      Tipo de actividad
                    </Label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-[11px] uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                      value={defaultTipo}
                      onChange={(e) => {
                        setDefaultTipo(e.target.value);
                        // Actualizar el tipo de todos los items seleccionados
                        setAlcanceItems((prev) =>
                          prev.map((item) =>
                            item.selected ? { ...item, tipo: e.target.value } : item
                          )
                        );
                      }}
                    >
                      <option value="Técnica">Técnica</option>
                      <option value="Administrativa">Administrativa</option>
                      <option value="Logística">Logística</option>
                      <option value="Documental">Documental</option>
                      <option value="Validación">Validación</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* LISTA DE ÍTEMS DEL ALCANCE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    Ítems del Alcance ({alcanceItems.length})
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[9px] font-black uppercase text-slate-400"
                      onClick={() => setAlcanceItems((prev) => prev.map((i) => ({ ...i, selected: true })))}
                    >
                      Seleccionar Todo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[9px] font-black uppercase text-slate-400"
                      onClick={() => setAlcanceItems((prev) => prev.map((i) => ({ ...i, selected: false })))}
                    >
                      Limpiar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {alcanceItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer hover:border-primary/30",
                        item.selected
                          ? "bg-primary/5 border-primary/20"
                          : "bg-white border-slate-200 opacity-70"
                      )}
                      onClick={() => toggleItem(item.id)}
                    >
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-primary/10 text-primary border-none font-black text-[8px] px-1.5 py-0">
                            N° {idx + 2}
                          </Badge>
                          <select
                            className="text-[8px] font-black uppercase border-none bg-transparent text-slate-400 focus:outline-none cursor-pointer"
                            value={item.tipo}
                            onChange={(e) => {
                              e.stopPropagation();
                              setAlcanceItems((prev) =>
                                prev.map((i) =>
                                  i.id === item.id ? { ...i, tipo: e.target.value } : i
                                )
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="Técnica">Técnica</option>
                            <option value="Administrativa">Administrativa</option>
                            <option value="Logística">Logística</option>
                            <option value="Documental">Documental</option>
                            <option value="Validación">Validación</option>
                          </select>
                        </div>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase">
                          {item.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary/5 flex items-center justify-center">
              <Copy className="w-4 h-4 text-secondary" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {selectedItems.length} ítem(s) seleccionado(s)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={saving}
              className="font-bold text-slate-500 uppercase text-[10px] h-11 px-6"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCrearActividades}
              disabled={!puedeCrear || saving}
              className="bg-secondary hover:bg-secondary/90 text-white font-black uppercase text-[10px] h-11 px-8 rounded-xl shadow-lg shadow-secondary/20 gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Crear {selectedItems.length} Actividades
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
