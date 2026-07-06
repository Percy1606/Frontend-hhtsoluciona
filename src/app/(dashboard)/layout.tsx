"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useAuthStore } from "@/store/auth-store";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const sidebarCollapsed = state === "collapsed";

  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0",
        sidebarCollapsed ? "ml-20" : "ml-64"
      )}>
        <Header />
        <main className="flex-1 p-8">
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchProyectos, fetchResponsables } = useOperacionesStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return; // Esperar a que el componente esté montado en el cliente
    
    if (!isAuthenticated || !user) {
      if (isAuthenticated || user) {
        logout(); // Limpiar estado si está inconsistente
      }
      window.location.href = "/login";
      return;
    } 

    // ---> LÓGICA DE CADENERO FRONTEND <---
    if (user.rol !== "ADMIN") {
      const moduloActual = pathname.split("/")[1]; 
      
      if (moduloActual && !(user.modulos || []).includes(moduloActual) && moduloActual !== "") {
        toast.error("No tienes permisos para ver esta pantalla");
        router.push("/");
        return;
      }
    }
    // ---> FIN LÓGICA <---

    setIsReady(true);
    fetchProyectos();
    fetchResponsables();
    
  }, [isMounted, isAuthenticated, user, router, pathname, fetchProyectos, fetchResponsables, logout]);

  if (!isMounted || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#001F3F] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <DashboardInner>{children}</DashboardInner>
    </SidebarProvider>
  );
}
