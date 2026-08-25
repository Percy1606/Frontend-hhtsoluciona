"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useAuthStore } from "@/store/auth-store";
import {
  Clock,
  ArrowRight,
  ClipboardList,
  Flame,
  X,
  Info,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, parseISO } from "date-fns";

export function ModalActividadesPendientesLogin() {
  const { user } = useAuthStore();
  const { actividades, proyectos, fetchActividades, fetchResponsables, fetchProyectos, responsables } = useOperacionesStore();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // 1. Validar si el usuario pertenece a las áreas autorizadas
  const isAuthorizedArea = useMemo(() => {
    if (!user) return false;
    if (user.rol === "ADMIN") return true;

    const targetAreas = [
      "operaciones",
      "logistica",
      "supervision",
      "ingenieria",
      "serviciostecnicos",
      "logísticayrecursos",
      "operacionesdecampo",
      "ingenieríaysupervisión",
    ];

    const userAreaStr = ((user as any)?.area || "").toLowerCase().replace(/\s+/g, "");
    const userRoleStr = (user.rol || "").toLowerCase().replace(/\s+/g, "");
    const userModules = (user.modulos || []).map((m: string) => m.toLowerCase().replace(/\s+/g, ""));

    const matchesArea = targetAreas.some((a) => userAreaStr.includes(a));
    const matchesRole = targetAreas.some((a) => userRoleStr.includes(a));
    const matchesModule = userModules.some((m: string) =>
      ["operaciones", "logistica", "supervision", "ingenieria"].some((t) => m.includes(t))
    );

    return matchesArea || matchesRole || matchesModule;
  }, [user]);

  useEffect(() => {
    if (!user || !isAuthorizedArea) return;

    const sessionKey = `notif_actividades_${user.id}_${new Date().toISOString().split("T")[0]}`;
    const alreadyShown = sessionStorage.getItem(sessionKey);

    if (!alreadyShown) {
      Promise.all([
        fetchActividades(1, 500),
        fetchResponsables(),
        fetchProyectos(),
      ]).catch((e) => console.error(e));
    }
  }, [user, isAuthorizedArea, fetchActividades, fetchResponsables, fetchProyectos]);

  // 2. Filtrar actividades pendientes del usuario
  const misActividades = useMemo(() => {
    if (!user || !isAuthorizedArea || !actividades || actividades.length === 0) return [];

    const userRespId = (user as any)?.responsableId || (user as any)?.responsable?.id;

    const myResp = responsables.find(
      (r) =>
        (userRespId && r.id === userRespId) ||
        r.nombre?.toLowerCase().trim() === user.nombre?.toLowerCase().trim() ||
        (user.nombre && r.nombre?.toLowerCase().includes(user.nombre?.toLowerCase()))
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = actividades.filter((act) => {
      const isMine =
        (userRespId && act.responsablePrincipalId === userRespId) ||
        (myResp && act.responsablePrincipalId === myResp.id);

      const isPending = act.estado !== "Completada" && act.estado !== "Validada";

      return isMine && isPending;
    });

    // Ordenar por urgencia (vencidas primero, luego más próximas a vencer)
    return items.sort((a, b) => {
      if (!a.fechaVencimiento && !b.fechaVencimiento) return 0;
      if (!a.fechaVencimiento) return 1;
      if (!b.fechaVencimiento) return -1;
      return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
    });
  }, [user, isAuthorizedArea, actividades, responsables]);

  // 3. Abrir modal si hay actividades pendientes
  useEffect(() => {
    if (misActividades.length > 0 && isAuthorizedArea) {
      const sessionKey = `modal_actividades_shown_${user?.id}_${new Date().toISOString().split("T")[0]}`;
      if (!sessionStorage.getItem(sessionKey)) {
        setIsOpen(true);
        sessionStorage.setItem(sessionKey, "true");
      }
    }
  }, [misActividades, isAuthorizedArea, user]);

  if (!isOpen || misActividades.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const atrasadas = misActividades.filter((a) => {
    if (!a.fechaVencimiento) return false;
    const due = new Date(a.fechaVencimiento);
    return due < today;
  });

  const porVencer = misActividades.filter((a) => {
    if (!a.fechaVencimiento) return true;
    const due = new Date(a.fechaVencimiento);
    return due >= today;
  });

  const getProyectoNombre = (proyectoId: string) => {
    const p = proyectos.find((proj) => proj.id === proyectoId);
    return p?.nombre || p?.codigo || "Proyecto Operativo";
  };

  const handleIrActividad = (proyectoId: string, actividadId: string) => {
    setIsOpen(false);
    router.push(`/operaciones/actividades?proyectoId=${proyectoId}&actividadId=${actividadId}`);
  };

  // Función para calcular texto humano de urgencia y badges
  const getUrgenciaInfo = (fechaVencimiento: string | null | undefined, estado: string) => {
    if (!fechaVencimiento) {
      return {
        humano: "Sin fecha asignada",
        badgeText: estado.toUpperCase(),
        badgeVariant: "default",
        isOverdue: false,
        isUrgent: false,
      };
    }

    try {
      const date = fechaVencimiento.includes("T")
        ? parseISO(fechaVencimiento)
        : parseISO(`${fechaVencimiento}T00:00:00`);
      
      const diffDays = differenceInCalendarDays(date, today);

      if (diffDays < 0) {
        const absDays = Math.abs(diffDays);
        return {
          humano: absDays === 1 ? "Vencida hace 1 día" : `Vencida hace ${absDays} días`,
          badgeText: "VENCIDA",
          badgeVariant: "overdue",
          isOverdue: true,
          isUrgent: true,
        };
      } else if (diffDays === 0) {
        return {
          humano: "Vence hoy",
          badgeText: "POR VENCER",
          badgeVariant: "imminent",
          isOverdue: false,
          isUrgent: true,
        };
      } else if (diffDays === 1) {
        return {
          humano: "Falta 1 día",
          badgeText: "POR VENCER",
          badgeVariant: "imminent",
          isOverdue: false,
          isUrgent: true,
        };
      } else {
        return {
          humano: `Faltan ${diffDays} días`,
          badgeText: "EN CURSO",
          badgeVariant: "normal",
          isOverdue: false,
          isUrgent: false,
        };
      }
    } catch {
      return {
        humano: formatDate(fechaVencimiento),
        badgeText: estado.toUpperCase(),
        badgeVariant: "default",
        isOverdue: false,
        isUrgent: false,
      };
    }
  };

  const getBotonTexto = (progreso: number, estado: string) => {
    if (progreso >= 100 || estado === "Completada" || estado === "Validada") {
      return "REVISAR ACTIVIDAD";
    }
    if (progreso > 0) {
      return "CONTINUAR ACTIVIDAD";
    }
    return "INICIAR ACTIVIDAD";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-2xl p-0 overflow-hidden text-slate-800 focus:outline-none">
        
        {/* 1. HEADER COMPACTO CON IDENTIDAD AZUL OSCURO */}
        <DialogHeader className="px-6 py-4 bg-[#001F3F] text-white flex flex-row items-center justify-between space-y-0 relative border-b border-[#0A2540]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl border border-white/10 shrink-0 text-white">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white tracking-tight leading-tight">
                Buenos días, {user?.nombre?.split(" ")[0]}
              </DialogTitle>
              <DialogDescription className="text-white/80 text-xs font-normal mt-0.5">
                Tienes <strong className="text-white font-semibold">{misActividades.length}</strong> actividades que requieren tu atención.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[64vh] overflow-y-auto custom-scrollbar">
          
          {/* 2. RESUMEN DE ACTIVIDADES COMPACTO */}
          <div className="grid grid-cols-2 gap-3">
            {/* VENCIDAS */}
            <div
              className={`px-4 py-3 rounded-xl border flex items-center justify-between transition-colors ${
                atrasadas.length > 0
                  ? "bg-red-50/70 border-red-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    atrasadas.length > 0 ? "bg-red-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider block ${
                      atrasadas.length > 0 ? "text-red-800" : "text-slate-500"
                    }`}
                  >
                    Vencidas
                  </span>
                  <span
                    className={`text-base font-bold leading-none ${
                      atrasadas.length > 0 ? "text-red-900" : "text-slate-700"
                    }`}
                  >
                    {atrasadas.length}
                  </span>
                </div>
              </div>
            </div>

            {/* POR VENCER / EN CURSO */}
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#001F3F] text-white rounded-lg shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Por vencer
                  </span>
                  <span className="text-base font-bold text-slate-800 leading-none">
                    {porVencer.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. SECCIÓN DE PRIORIDADES */}
          <div className="space-y-3">
            <div className="flex items-end justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Actividades Prioritarias
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Ordenadas según su urgencia y fecha de vencimiento
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {misActividades.length} pendientes
              </span>
            </div>

            {/* 4. TARJETAS DE ACTIVIDADES */}
            <div className="space-y-3">
              {misActividades.slice(0, 5).map((act, index) => {
                const urgencia = getUrgenciaInfo(act.fechaVencimiento, act.estado);
                const proyectoNombre = getProyectoNombre(act.proyectoId);
                const progresoVal = act.progreso || 0;
                const isFirstPriority = index === 0 && urgencia.isUrgent;

                return (
                  <div
                    key={act.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isFirstPriority
                        ? "bg-slate-50/70 border-red-300 shadow-xs ring-1 ring-red-100"
                        : urgencia.isOverdue
                        ? "bg-red-50/25 border-red-200 hover:border-red-300"
                        : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    {/* PRIMER NIVEL: BADGE DE ESTADO & URGENCIA */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        {urgencia.badgeVariant === "overdue" ? (
                          <Badge className="bg-red-600 text-white text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 border-none h-5">
                            Vencida
                          </Badge>
                        ) : urgencia.badgeVariant === "imminent" ? (
                          <Badge className="bg-amber-500 text-white text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 border-none h-5">
                            Por vencer
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 h-5">
                            En curso
                          </Badge>
                        )}

                        {isFirstPriority && (
                          <Badge variant="outline" className="bg-white text-red-700 border-red-200 text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 h-5">
                            Prioridad alta
                          </Badge>
                        )}
                      </div>

                      {/* 6. URGENCIA HUMANA */}
                      <span
                        className={`text-xs font-semibold ${
                          urgencia.isOverdue
                            ? "text-red-600"
                            : urgencia.isUrgent
                            ? "text-amber-700"
                            : "text-slate-500"
                        }`}
                      >
                        {urgencia.humano}
                      </span>
                    </div>

                    {/* SEGUNDO NIVEL: NOMBRE DE LA TAREA (PROTAGONISTA) */}
                    <h4 className="text-sm font-bold text-slate-900 leading-snug tracking-tight">
                      {act.descripcion}
                    </h4>

                    {/* TERCER NIVEL: PROYECTO O SERVICIO RELACIONADO */}
                    <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                      {proyectoNombre}
                    </p>

                    {/* CUARTO NIVEL: PROGRESO VISUAL & ACCIÓN CONTEXTUAL */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* BARRA DE PROGRESO */}
                      <div className="flex-1 max-w-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                          <span>Progreso</span>
                          <span className="font-bold text-slate-800">{progresoVal}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progresoVal >= 100
                                ? "bg-emerald-500"
                                : urgencia.isOverdue
                                ? "bg-red-500"
                                : "bg-[#001F3F]"
                            }`}
                            style={{ width: `${progresoVal}%` }}
                          />
                        </div>
                      </div>

                      {/* 7. BOTÓN CONTEXTUAL */}
                      <Button
                        size="sm"
                        onClick={() => handleIrActividad(act.proyectoId, act.id)}
                        className="h-8 px-3.5 text-[10px] font-bold uppercase tracking-wider gap-1.5 bg-[#001F3F] hover:bg-[#0A2540] text-white rounded-lg shadow-xs shrink-0 self-end sm:self-auto"
                      >
                        {getBotonTexto(progresoVal, act.estado)}
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 9. FOOTER INFORMATIVO & ACCIÓN SECUNDARIA */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Recuerda registrar tus evidencias y observaciones en cada actividad.</span>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              setIsOpen(false);
              router.push("/operaciones/actividades");
            }}
            className="h-8 px-2 text-xs font-bold uppercase tracking-wider text-[#001F3F] hover:bg-slate-200/60 rounded-lg shrink-0"
          >
            Ver todas las actividades →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
