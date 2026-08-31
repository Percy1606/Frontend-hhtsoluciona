"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ModernDialog } from "@/components/ui/modern-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOperacionesStore } from "@/store/operaciones-store";
import {
  Plus,
  Trash2,
  ClipboardList,
  Loader2,
  CheckCircle2,
  FileText,
  ArrowRight,
  Edit3,
  Sparkles,
  AlertCircle,
  Table2,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Proyecto } from "@/lib/types";

/**
 * Limpia prefijos legacy "[GRUPO]" que pudieran venir en la descripción.
 * Solo se usa al comparar nombres para detectar duplicados.
 */
const stripLegacyPrefix = (text: string): string => {
  if (!text) return "";
  const match = text.match(/^\[(.*?)\]\s*(.*)$/i);
  return match ? match[2].trim() : text;
};

interface BulkActividadItem {
  id: string;
  descripcion: string;
  tipo: string;
  prioridad: string;
  responsablePrincipalId: string;
  fechaVencimiento: string;
  progreso: number;
}

interface DuplicateWarning {
  existingDescripcion: string;
  pending: BulkActividadItem[];
  /** Total de actividades que crear al confirmar (excluyendo duplicadas). */
  createCount: number;
  /** Total de actividades marcadas como duplicadas. */
  duplicateCount: number;
}

type ModoVista = "pegar" | "tabla";

interface ActividadesBulkModalProps {
  proyecto?: Proyecto;
  isOpen: boolean;
  onClose: () => void;
  /** @deprecated Sin uso. Mantenido por retrocompatibilidad. */
  defaultGroup?: string;
}

export function ActividadesBulkModal({ proyecto: propProyecto, isOpen, onClose }: ActividadesBulkModalProps) {
  const { responsables, proyectos, fetchResponsables, addActividad } = useOperacionesStore();

  // Estado
  const [selectedProyectoId, setSelectedProyectoId] = useState(propProyecto?.id || "");
  const [rawText, setRawText] = useState("");
  const [responsableDefault, setResponsableDefault] = useState("");
  const [tipoDefault, setTipoDefault] = useState("Técnica");
  const [actividades, setActividades] = useState<BulkActividadItem[]>([]);
  const [vista, setVista] = useState<ModoVista>("pegar");
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
  const [parseado, setParseado] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);

  // Cargar responsables al abrir
  useEffect(() => {
    if (isOpen && responsables.length === 0) {
      fetchResponsables();
    }
  }, [isOpen, responsables.length, fetchResponsables]);

  // Sincronizar responsableDefault cuando carguen
  useEffect(() => {
    if (responsables.length === 0) return;
    setResponsableDefault((prev) => {
      if (prev && responsables.some((r) => r.id === prev)) return prev;
      // Buscar a Mario primero, si no, el primero disponible
      const mario = responsables.find((r) => r.nombre.toLowerCase() === "mario");
      if (mario) return mario.id;
      return responsables[0].id;
    });
  }, [responsables]);

  // Resolver proyecto activo
  const proyecto = useMemo(() => {
    if (propProyecto?.id) return propProyecto;
    return proyectos.find((p) => p.id === selectedProyectoId) || null;
  }, [propProyecto, proyectos, selectedProyectoId]);

  /**
   * Parser SIMPLE: una línea = una actividad.
   * Sin "# Carpeta", sin "[Carpeta]", sin "|".
   */
  const parsearTexto = useCallback(() => {
    const lineas = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lineas.length === 0) {
      toast.error("No hay texto para parsear", {
        description: "Ingresa al menos una línea con actividades (una por línea).",
      });
      return;
    }

    const items: BulkActividadItem[] = lineas.map((linea) => ({
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11),
      descripcion: linea,
      tipo: tipoDefault,
      prioridad: "Media",
      responsablePrincipalId: responsableDefault || "",
      fechaVencimiento: "",
      progreso: 0,
    }));

    if (items.length === 0) {
      toast.error("No se pudieron parsear actividades", {
        description: "Verifica que el texto tenga el formato correcto."
      });
      return;
    }

    setActividades(items);
    setParseado(true);
    setVista("tabla");
    toast.success(`${items.length} actividad(es) parseada(s)`, {
      description: "Revisa los datos en la tabla y edita lo que necesites.",
    });
  }, [rawText, tipoDefault, responsableDefault]);

  // Acciones sobre la tabla
  const agregarFila = () => {
    setActividades((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11),
        descripcion: "",
        tipo: tipoDefault,
        prioridad: "Media",
        responsablePrincipalId: responsableDefault || "",
        fechaVencimiento: "",
        progreso: 0,
      },
    ]);
  };

  const eliminarFila = (id: string) => {
    if (actividades.length <= 1) return;
    setActividades((prev) => prev.filter((a) => a.id !== id));
  };

  const actualizarCelda = (id: string, campo: keyof BulkActividadItem, valor: any) => {
    setActividades((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [campo]: valor } : a))
    );
  };

  const volverAPegar = () => {
    setVista("pegar");
    setParseado(false);
    // No limpiar actividades ni rawText por si quiere re-pegar
  };

  const limpiarTodo = () => {
    setRawText("");
    setActividades([]);
    setParseado(false);
    setVista("pegar");
  };

  // Cálculos
  const actividadesValidas = useMemo(() => {
    return actividades.filter((a) => a.descripcion.trim().length >= 3);
  }, [actividades]);

  const getNombreResponsable = useCallback(
    (id: string) => {
      if (!id) return "SIN ASIGNAR";
      const resp = responsables.find((r) => r.id === id);
      return resp?.nombre || "SELECCIONAR...";
    },
    [responsables]
  );

  const detectarDuplicados = useCallback((items: BulkActividadItem[]) => {
    if (!proyecto) return { nuevas: items, duplicadas: [] as BulkActividadItem[] };
    const existentes = (proyecto.actividades || []).map((a) =>
      stripLegacyPrefix(a.descripcion).trim().toUpperCase(),
    );
    const existentesSet = new Set(existentes);
    const nuevas: BulkActividadItem[] = [];
    const duplicadas: BulkActividadItem[] = [];
    for (const it of items) {
      const clean = it.descripcion.trim().toUpperCase();
      if (existentesSet.has(clean)) {
        duplicadas.push(it);
      } else {
        nuevas.push(it);
      }
    }
    return { nuevas, duplicadas };
  }, [proyecto]);

  // ── Guardar ─────────────────────────────────────────────────────────────

  /**
   * Crea una actividad. Devuelve el número de duplicados detectados.
   *
   * Reglas:
   * 1. Validamos que haya un proyecto seleccionado.
   * 2. Validamos que todas las filas tengan descripción válida.
   * 3. Detectamos duplicados CONTRA EL PROYECTO y mostramos un Dialog.
   *    El usuario decide si continuar o saltarlos.
   * 4. NUNCA auto-eliminamos actividades.
   */
  const handleGuardarTodo = async () => {
    if (!proyecto) {
      toast.error("Proyecto requerido", {
        description: "Selecciona un proyecto antes de guardar.",
      });
      return;
    }

    if (actividadesValidas.length === 0) {
      toast.error("Datos incompletos", {
        description: "Cada actividad debe tener al menos 3 caracteres en la descripción.",
      });
      return;
    }

    // Detección de duplicados (no eliminamos, sólo informamos)
    const { nuevas, duplicadas } = detectarDuplicados(actividadesValidas);

    if (duplicadas.length > 0) {
      setDuplicateWarning({
        existingDescripcion: duplicadas[0].descripcion,
        pending: actividadesValidas,
        createCount: nuevas.length,
        duplicateCount: duplicadas.length,
      });
      return;
    }

    await ejecutarGuardado(nuevas);
  };

  const ejecutarGuardado = async (items: BulkActividadItem[]) => {
    if (!proyecto) return;
    setSaving(true);
    setSaveProgress({ current: 0, total: items.length });

    let creadas = 0;
    let errores = 0;

    for (let i = 0; i < items.length; i++) {
      const act = items[i];
      try {
        await addActividad(proyecto.id, {
          proyectoId: proyecto.id,
          descripcion: act.descripcion.trim().toUpperCase(),
          tipo: act.tipo as any,
          prioridad: act.prioridad as any,
          estado: act.progreso === 100 ? "Completada" : act.progreso > 0 ? "En Progreso" : "Pendiente",
          fechaCreacion: new Date().toISOString(),
          fechaInicio: new Date().toISOString(),
          fechaVencimiento: act.fechaVencimiento
            ? new Date(act.fechaVencimiento + "T12:00:00").toISOString()
            : undefined,
          responsablePrincipalId: act.responsablePrincipalId,
          responsablesApoyo: [],
          subtareas: [],
          validacionesRequeridas: [],
          comentarios: [],
          evidencias: [],
          progreso: act.progreso,
          ponderacion: 1,
          orden: i + 1,
        });
        creadas++;
      } catch (error) {
        console.error(`Error creando actividad "${act.descripcion}":`, error);
        errores++;
      }
      setSaveProgress({ current: i + 1, total: items.length });
    }

    setSaving(false);

    if (errores === 0) {
      toast.success(`¡${creadas} actividades creadas!`, {
        description: "Todas las actividades se registraron correctamente.",
      });
      handleCloseFinal();
    } else {
      toast.error(`${errores} error(es) al crear`, {
        description: `${creadas} actividades se crearon correctamente. Revisa los datos e intenta de nuevo.`,
      });
    }
  };

  const handleConfirmarDuplicados = async () => {
    if (!duplicateWarning) return;
    const { nuevas } = detectarDuplicados(duplicateWarning.pending);
    setDuplicateWarning(null);
    await ejecutarGuardado(nuevas);
  };

  const handleCloseFinal = () => {
    setRawText("");
    setActividades([]);
    setParseado(false);
    setVista("pegar");
    setSelectedProyectoId(propProyecto?.id || "");
    setDuplicateWarning(null);
    onClose();
  };

  const handleClose = () => {
    if (actividades.length > 0 || rawText.trim()) {
      if (!confirm("¿Estás seguro? Perderás las actividades no guardadas.")) return;
    }
    handleCloseFinal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        overlayClassName="bg-slate-950/80 backdrop-blur-md z-[100]"
        containerClassName="z-[105]"
        className="w-[94%] sm:w-full sm:max-w-4xl md:max-w-5xl max-h-[90vh] h-[88vh] p-0 border border-slate-200/80 bg-white flex flex-col rounded-3xl shadow-2xl shadow-black/50 overflow-hidden"
      >
        {/* HEADER */}
        <DialogHeader className="p-6 bg-gradient-to-br from-primary via-primary to-primary/90 text-white shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                <ClipboardList className="w-7 h-7 text-accent" />
                Carga Masiva de Actividades
              </DialogTitle>
              <p className="text-white/50 font-bold uppercase text-[9px] mt-0.5 tracking-widest">
                Pegado rápido + tabla editable
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm">
              {vista === "pegar" ? (
                <>
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[9px] font-black uppercase text-white/80">Pegar</span>
                </>
              ) : (
                <>
                  <Table2 className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[9px] font-black uppercase text-white/80">
                    {actividades.length} actividades
                  </span>
                </>
              )}
            </div>
          </div>

          {proyecto ? (
            <p className="text-white/70 font-bold uppercase text-[10px] mt-2">
              Proyecto: {proyecto.codigo} — {proyecto.nombre}
            </p>
          ) : (
            <div className="mt-3">
              <label className="text-[8px] font-black uppercase text-white/50 tracking-widest mb-1 block">
                Seleccionar Proyecto *
              </label>
              <select
                className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-[11px] uppercase backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
                value={selectedProyectoId}
                onChange={(e) => setSelectedProyectoId(e.target.value)}
              >
                <option value="" className="text-slate-800">
                  SELECCIONAR PROYECTO...
                </option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-800">
                    {p.codigo} — {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto">
          {/* Configuración global */}
          <div className="p-5 pb-0 space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Configuración por defecto
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1 block">
                    Tipo por defecto
                  </Label>
                  <select
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white font-bold text-[10px] uppercase"
                    value={tipoDefault}
                    onChange={(e) => setTipoDefault(e.target.value)}
                  >
                    {["Técnica", "Administrativa", "Logística", "Documental", "Validación"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1 block">
                    Responsable por defecto
                  </Label>
                  <select
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white font-bold text-[10px] uppercase"
                    value={responsableDefault}
                    onChange={(e) => setResponsableDefault(e.target.value)}
                  >
                    {responsables.length === 0 && <option value="">Cargando...</option>}
                    {responsables.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  {parseado && (
                    <div className="flex items-center gap-2 w-full h-9 bg-primary/5 rounded-xl px-3">
                      <ClipboardList className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-black text-primary">
                        {actividades.length} actividad(es) en la tabla
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MODO PEGAR */}
            {vista === "pegar" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Pegar actividades
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRawText(`INSTALACIÓN DE TUBERÍA DE 2" PARA AGUA FRÍA\nINSTALACIÓN DE VÁLVULA DE COMPUERTA BRIDADA DE 2"\nPRUEBA HIDRÁULICA DE RED DE AGUA FRÍA\nINSTALACIÓN DE LLAVE DE PASO TERMINAL\nCAPACITACIÓN AL PERSONAL DE MANTENIMIENTO`)}
                    className="h-7 text-[9px] font-black uppercase text-slate-400 gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    Ejemplo
                  </Button>
                </div>

                <Textarea
                  placeholder={`Pega aquí tus actividades. Una por línea.\n\nEjemplo:\n  INSTALACIÓN DE TUBERÍA DE 2"\n  PRUEBA HIDRÁULICA DE RED\n  CAPACITACIÓN AL PERSONAL DE MANTENIMIENTO`}
                  className="min-h-[280px] font-mono text-xs leading-relaxed border-slate-200 bg-slate-50 focus:bg-white transition-all rounded-xl resize-y"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center">
                      <FileText className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">
                      {rawText.split("\n").filter((l) => l.trim()).length} línea(s) detectada(s)
                    </span>
                  </div>
                  <Button
                    onClick={parsearTexto}
                    disabled={!rawText.trim()}
                    className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-primary/20 gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Parsear Actividades
                  </Button>
                </div>
              </div>
            )}

            {/* MODO TABLA */}
            {vista === "tabla" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                    <Table2 className="w-4 h-4" />
                    Lista editable ({actividades.length} actividades)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={volverAPegar}
                      className="h-8 text-[9px] font-black uppercase border-slate-200 bg-white hover:bg-slate-50 rounded-xl gap-1.5"
                    >
                      <Edit3 className="w-3 h-3" />
                      Volver a pegar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={agregarFila}
                      className="h-8 text-[9px] font-black uppercase border-slate-200 bg-white hover:bg-primary/5 rounded-xl gap-1.5"
                    >
                      <Plus className="w-3 h-3" />
                      Agregar fila
                    </Button>
                  </div>
                </div>

                {/* Tabla editable */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="p-2.5 text-left font-black text-primary uppercase tracking-wider w-8">#</th>
                        <th className="p-2.5 text-left font-black text-primary uppercase tracking-wider min-w-[260px]">Descripción</th>
                        <th className="p-2.5 text-left font-black text-primary uppercase tracking-wider w-[110px]">Tipo</th>
                        <th className="p-2.5 text-left font-black text-primary uppercase tracking-wider w-[150px]">Responsable</th>
                        <th className="p-2.5 text-left font-black text-primary uppercase tracking-wider w-[70px]">%</th>
                        <th className="p-2.5 text-left font-black text-primary uppercase tracking-wider w-[120px]">Vencimiento</th>
                        <th className="p-2.5 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividades.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-bold text-[10px] uppercase italic">
                            No hay actividades. Pega el texto primero.
                          </td>
                        </tr>
                      ) : (
                        actividades.map((actividad, index) => (
                          <tr
                            key={actividad.id}
                            className={cn(
                              "border-b border-slate-100 hover:bg-slate-50/50 transition-colors",
                              !actividad.descripcion.trim() && "bg-red-50/30"
                            )}
                          >
                            <td className="p-2 font-black text-slate-400 text-center">
                              {index + 1}
                            </td>

                            <td className="p-1">
                              <Input
                                placeholder="Nombre de la actividad..."
                                className="h-8 border-transparent bg-transparent hover:border-slate-200 focus:border-primary font-bold text-[10px] rounded-lg px-2"
                                value={actividad.descripcion}
                                onChange={(e) =>
                                  actualizarCelda(actividad.id, "descripcion", e.target.value)
                                }
                              />
                            </td>

                            <td className="p-1">
                              <select
                                className="w-full h-8 px-2 rounded-lg border border-transparent hover:border-slate-200 focus:border-primary bg-transparent font-bold text-[10px] uppercase appearance-none cursor-pointer"
                                value={actividad.tipo}
                                onChange={(e) => actualizarCelda(actividad.id, "tipo", e.target.value)}
                              >
                                {["Técnica", "Administrativa", "Logística", "Documental", "Validación"].map(
                                  (t) => (
                                    <option key={t} value={t}>{t}</option>
                                  )
                                )}
                              </select>
                            </td>

                            <td className="p-1">
                              <select
                                className="w-full h-8 px-2 rounded-lg border border-transparent hover:border-slate-200 focus:border-primary bg-transparent font-bold text-[10px] uppercase appearance-none cursor-pointer"
                                value={actividad.responsablePrincipalId}
                                onChange={(e) =>
                                  actualizarCelda(actividad.id, "responsablePrincipalId", e.target.value)
                                }
                              >
                                <option value="">SELECCIONAR</option>
                                {responsables.map((r) => (
                                  <option key={r.id} value={r.id}>{r.nombre}</option>
                                ))}
                              </select>
                            </td>

                            <td className="p-1">
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  className="h-8 border-transparent bg-transparent hover:border-slate-200 focus:border-primary font-bold text-[10px] rounded-lg px-2 pr-5"
                                  value={actividad.progreso}
                                  onChange={(e) =>
                                    actualizarCelda(
                                      actividad.id,
                                      "progreso",
                                      Math.min(100, Math.max(0, Number(e.target.value) || 0))
                                    )
                                  }
                                />
                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">
                                  %
                                </span>
                              </div>
                            </td>

                            <td className="p-1">
                              <Input
                                type="date"
                                className="h-8 border-transparent bg-transparent hover:border-slate-200 focus:border-primary font-bold text-[9px] rounded-lg px-2"
                                value={actividad.fechaVencimiento}
                                onChange={(e) =>
                                  actualizarCelda(actividad.id, "fechaVencimiento", e.target.value)
                                }
                              />
                            </td>

                            <td className="p-1 text-center">
                              <button
                                onClick={() => eliminarFila(actividad.id)}
                                disabled={actividades.length <= 1}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Resumen de datos inválidos */}
                {actividades.length > actividadesValidas.length && (
                  <div className="flex items-center gap-2 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {actividades.length - actividadesValidas.length} actividad(es) tienen descripción incompleta y no se guardarán.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progreso de guardado */}
          {saving && (
            <div className="mx-5 mb-4 mt-4 bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando actividades...
                </span>
                <span className="text-xs font-black text-primary">
                  {saveProgress.current} / {saveProgress.total}
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{
                    width: `${(saveProgress.current / saveProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-tight">
                {vista === "pegar"
                  ? `${rawText.split("\n").filter((l) => l.trim()).length} línea(s)`
                  : `${actividadesValidas.length} actividad(es) válida(s)`}
              </span>
              {vista === "tabla" && (
                <span className="text-[8px] text-slate-400 font-bold uppercase">
                  {proyecto?.codigo || "Sin proyecto"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {vista === "tabla" && (
              <Button
                variant="ghost"
                onClick={limpiarTodo}
                disabled={saving}
                className="font-bold text-slate-400 uppercase text-[9px] h-10 px-4 hover:text-red-500"
              >
                Limpiar
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={saving}
              className="font-bold text-slate-500 uppercase text-[10px] h-11 px-6"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarTodo}
              disabled={actividadesValidas.length === 0 || saving}
              className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] h-11 px-8 rounded-xl shadow-lg shadow-primary/20 gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Guardar Todo ({actividadesValidas.length})
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* DIALOG DE ADVERTENCIA DE DUPLICADOS (usa ModernDialog con tipo warning) */}
      <ModernDialog
        isOpen={!!duplicateWarning}
        onOpenChange={(open: boolean) => {
          if (!open) setDuplicateWarning(null);
        }}
        type="warning"
        title="Actividades duplicadas detectadas"
        description={
          duplicateWarning
            ? `Detectamos que ${duplicateWarning.duplicateCount} de tus actividades ya existen en este proyecto. Ejemplo: "${duplicateWarning.existingDescripcion}". Si continúas, se crearán ${duplicateWarning.createCount} ${duplicateWarning.createCount === 1 ? "actividad nueva" : "actividades nuevas"} (las duplicadas se omitirán).`
            : ""
        }
        showCancel
        confirmText={`Continuar (${duplicateWarning?.createCount ?? 0} nuevas)`}
        cancelText="Revisar y corregir"
        onConfirm={handleConfirmarDuplicados}
        maxWidth="sm:max-w-[600px]"
      />
    </Dialog>
  );
}
