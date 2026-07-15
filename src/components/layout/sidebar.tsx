"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Table,
  Grid,
  Calendar,
  FileSpreadsheet,
  BarChart,
  FileUp,
  FolderKanban,
  Package,
  FileCheck,
  Clock,
  AlertTriangle,
  CheckSquare,
  ClipboardList,
  Truck,
  Search,
  ShoppingCart,
  History,
  Receipt,
  TrendingDown,
  Wallet,
  FileText,
  UserPlus,
  Calculator,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  {
    icon: Users,
    label: "CRM Comercial",
    href: "/crm",
    subItems: [
      { icon: Table, label: "Base de Datos Clientes", href: "/crm/cartera" },
      { icon: Grid, label: "Proceso de ventas", href: "/crm/pipeline" },
      { icon: Clock, label: "Seguimiento y Actividades", href: "/crm/seguimiento" },
      { icon: ClipboardList, label: "Cotizaciones", href: "/crm/cotizaciones" },
      { icon: BarChart, label: "Informes", href: "/crm/estadisticas" },
    ]
  },
  {
    icon: Briefcase,
    label: "Operaciones",
    href: "/operaciones",
    subItems: [
      { icon: ClipboardList, label: "Bandeja Técnica", href: "/operaciones/bandeja" },
      { icon: FolderKanban, label: "Proyectos", href: "/operaciones/proyectos" },
      { icon: ClipboardList, label: "Actividades", href: "/operaciones/actividades" },
      { icon: Zap, label: "Hoja de Ruta", href: "/operaciones/workflow" },
      { icon: Clock, label: "Timeline", href: "/operaciones/timeline" },
      { icon: CheckSquare, label: "Validaciones", href: "/operaciones/validaciones" },
      { icon: AlertTriangle, label: "Alertas", href: "/operaciones/alertas" },
    ]
  },
  {
    icon: Truck,
    label: "Logística",
    href: "/logistica",
    subItems: [
      { icon: CheckSquare, label: "Bandeja de Proyectos", href: "/logistica/bandeja" },
      { icon: Package, label: "Almacén Central", href: "/logistica/inventario" },
      { icon: ShoppingCart, label: "Órdenes de Materiales", href: "/logistica/ordenes" },
      { icon: FileText, label: "Documentación Logística", href: "/logistica/documentos" },
      { icon: Users, label: "Proveedores", href: "/logistica/proveedores" },
      { icon: UserPlus, label: "Personal de Obra", href: "/logistica/personal" },
    ]
  },
  {
    icon: BarChart3,
    label: "Finanzas",
    href: "/finanzas",
    subItems: [
      { icon: CheckSquare, label: "Bandeja de Proyectos", href: "/finanzas/bandeja" },
      { icon: PieChart, label: "Control de Costos", href: "/finanzas/costos-proyecto" },
      { icon: Wallet, label: "Cajas y Cuentas", href: "/finanzas/cajas" },
      { icon: TrendingDown, label: "Egresos / Gastos", href: "/finanzas/egresos" },
      { icon: Receipt, label: "Ingresos / Facturas", href: "/finanzas/ingresos" },
      { icon: BarChart, label: "Reportes", href: "/finanzas" },
    ]
  },
  {
    icon: Settings,
    label: "Configuración",
    href: "/configuracion",
    subItems: [
      { icon: Users, label: "Usuarios", href: "/configuracion/usuarios" },
      { icon: LayoutDashboard, label: "Trabajadores", href: "/configuracion/trabajadores" },
      { icon: FileCheck, label: "Manual de Usuario", href: "/configuracion/manual" },
      { icon: Search, label: "Auditoría", href: "/auditoria" },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, toggleSidebar, isMobile, openMobile, setOpenMobile } = useSidebar();
  // En móvil usamos openMobile (invertido para mantener la lógica de "collapsed"). En PC usamos state.
  const sidebarCollapsed = isMobile ? !openMobile : state === "collapsed";
  const { user, logout } = useAuthStore();

  const userModules = user?.modulos || [];
  const isAdmin = user?.rol === "ADMIN";

  const filteredMenuItems = menuItems.filter(item => {
    if (isAdmin) return true;
    if (item.href === "/") {
      return userModules.includes("dashboard");
    }
    const moduleId = item.href.split("/")[1];
    return userModules.includes(moduleId);
  });

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(() => {
    const activeItem = filteredMenuItems.find(item => item.subItems && pathname.startsWith(item.href));
    return activeItem ? activeItem.href : null;
  });


  return (
    <>
      {/* Fondo oscuro para móvil: si está abierto en móvil, mostramos una capa semitransparente */}
      {isMobile && openMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 transition-opacity animate-in fade-in"
          onClick={() => setOpenMobile(false)}
        />
      )}

      <div className={cn(
        "flex flex-col h-screen bg-primary text-white border-r border-sidebar-border fixed left-0 top-0 transition-all duration-300 ease-in-out z-40",
        // En móvil: si está colapsado, se esconde fuera de la pantalla (-translate-x-full). Si está abierto, se muestra (translate-x-0).
        // En PC (md:): si está colapsado, mide w-20. Si está abierto, mide w-64.
        sidebarCollapsed 
          ? "-translate-x-full md:translate-x-0 w-64 md:w-20" 
          : "translate-x-0 w-64 shadow-2xl md:shadow-none"
      )}>
        <div className={cn(
          "p-6 flex items-center gap-3 relative",
          sidebarCollapsed ? "justify-center" : "justify-start"
        )}>
          <div className="bg-accent p-2 rounded-lg shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-in fade-in duration-300 flex-1">
              <h1 className="text-xl font-bold leading-none">HH T</h1>
              <p className="text-[10px] text-white/60 font-medium tracking-wider uppercase">Soluciona S.A.C.</p>
            </div>
          )}
          
          {/* Botón X para cerrar en móvil */}
          {isMobile && !sidebarCollapsed && (
            <button 
              onClick={() => setOpenMobile(false)}
              className="absolute right-4 top-6 p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-none">
          {filteredMenuItems.map((item) => {
            const isParentActive = item.href === "/" 
              ? pathname === "/" 
              : pathname.startsWith(item.href);
            
            if (item.subItems) {
              return (
                <div key={item.href} className="space-y-1">
                  <button
                    onClick={() => !sidebarCollapsed && setOpenSubmenu(openSubmenu === item.href ? null : item.href)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors duration-200 group relative",
                      isParentActive
                        ? "bg-secondary text-white"
                        : "text-white/70 hover:bg-secondary/50 hover:text-white",
                      sidebarCollapsed ? "justify-center px-0" : "justify-start"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-colors shrink-0",
                      isParentActive ? "text-white" : "text-white/60 group-hover:text-white"
                    )} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="font-medium flex-1 text-left">{item.label}</span>
                        {openSubmenu === item.href ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </>
                    )}
                  </button>
                  
                  {openSubmenu === item.href && !sidebarCollapsed && (
                    <div className="ml-4 pl-4 border-l border-white/10 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {item.subItems.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => isMobile && setOpenMobile(false)} // Cerrar al navegar en móvil
                            className={cn(
                              "flex items-center gap-3 px-4 py-2 rounded-md transition-colors duration-200 group text-sm",
                              isSubActive 
                                ? "text-white font-bold bg-white/10" 
                                : "text-white/50 hover:text-white hover:bg-white/5"
                            )}
                          >
                            <sub.icon className={cn(
                              "w-4 h-4 shrink-0",
                              isSubActive ? "text-accent" : "text-white/30 group-hover:text-white/60"
                            )} />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setOpenMobile(false)} // Cerrar al navegar en móvil
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 group relative",
                  isParentActive 
                    ? "bg-secondary text-white" 
                    : "text-white/70 hover:bg-secondary/50 hover:text-white",
                  sidebarCollapsed ? "justify-center px-0" : "justify-start"
                )}
                title={sidebarCollapsed ? item.label : ""}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors shrink-0",
                  isParentActive ? "text-white" : "text-white/60 group-hover:text-white"
                )} />
                {!sidebarCollapsed && (
                  <span className="font-medium animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/10 space-y-2">
          <button 
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 w-full text-white/70 hover:text-accent transition-colors",
              sidebarCollapsed ? "justify-center px-0" : "justify-start"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span className="font-medium animate-in fade-in duration-300">Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </>
  );
}
