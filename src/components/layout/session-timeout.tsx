"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Timer } from "lucide-react";

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutos
const WARNING_COUNTDOWN_S = 60; // 60 segundos de advertencia

export function SessionTimeout() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_COUNTDOWN_S);
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  }, []);

  const handleLogout = useCallback(() => {
    clearTimers();
    logout();
    router.push("/login?expired=true");
  }, [clearTimers, logout, router]);

  const resetInactivityTimer = useCallback(() => {
    if (showWarning) return; // Si ya está en advertencia, no reiniciar por actividad de fondo
    
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    
    inactivityTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(WARNING_COUNTDOWN_S);
    }, INACTIVITY_LIMIT_MS);
  }, [showWarning]);

  // Manejo de eventos de actividad
  useEffect(() => {
    if (!isAuthenticated) return;

    resetInactivityTimer();

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => resetInactivityTimer();

    events.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimers();
    };
  }, [isAuthenticated, resetInactivityTimer, clearTimers]);

  // Manejo de cuenta regresiva
  useEffect(() => {
    if (showWarning) {
      if (countdown <= 0) {
        handleLogout();
        return;
      }
      countdownTimerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, [showWarning, countdown, handleLogout]);

  const handleContinue = () => {
    setShowWarning(false);
    resetInactivityTimer();
  };

  if (!isAuthenticated) return null;

  return (
    <Dialog open={showWarning} onOpenChange={(open) => {
      if (!open) handleContinue();
    }}>
      <DialogContent 
        className="sm:max-w-md border-none bg-white shadow-2xl rounded-3xl overflow-hidden p-0 [&>button]:hidden"
      >
        <div className="bg-red-50 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight uppercase">
            Advertencia de Seguridad
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-600 mt-2 px-2">
            Hemos detectado inactividad en tu sesión. Por protocolos de seguridad, cerraremos tu sesión automáticamente si no respondes.
          </DialogDescription>
        </div>

        <div className="p-6 flex flex-col items-center justify-center space-y-6">
          <div className="flex items-center gap-3 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
            <Timer className="w-6 h-6 text-slate-400" />
            <span className="text-3xl font-black tracking-tighter text-slate-800">
              00:{countdown.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row w-full gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border-slate-200"
              onClick={handleLogout}
            >
              Cerrar Sesión Ahora
            </Button>
            <Button 
              className="flex-1 h-12 rounded-xl bg-[#001F3F] hover:bg-[#003087] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20"
              onClick={handleContinue}
            >
              Continuar Sesión
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
