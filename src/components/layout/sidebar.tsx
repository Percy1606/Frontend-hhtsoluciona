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
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/layout-store";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  {
    icon: Users,
    label: "CRM Comercial",
    href: "/crm",
    subItems: [
      { icon: Table, label: "Clientes", href: "/crm/cartera" },
      { icon: Grid, label: "Proceso de ventas", href: "/crm/pipeline" },
      { icon: Calendar, label: "Seguimiento", href: "/crm/seguimiento" },
      { icon: ClipboardList, label: "Cotizaciones", href: "/crm/cotizaciones" },
      { icon: BarChart, label: "Informes", href: "/crm/estadisticas" },
    ]
  },
  {
    icon: Briefcase,
    label: "Operaciones",
    href: "/operaciones",
    subItems: [
      { icon: FolderKanban, label: "Proyectos", href: "/operaciones/proyectos" },
      { icon: ClipboardList, label: "Actividades", href: "/operaciones/actividades" },
      { icon: Clock, label: "Timeline", href: "/operaciones/timeline" },
      { icon: CheckSquare, label: "Validaciones", href: "/operaciones/validaciones" },
      { icon: AlertTriangle, label: "Alertas", href: "/operaciones/alertas" },
    ]
  },
  {
    icon: FileCheck,
    label: "Gestión Documental",
    href: "/documental",
    subItems: [
      { icon: FileSpreadsheet, label: "Documentos", href: "/documental" },
      { icon: FolderKanban, label: "Expedientes", href: "/documental/expedientes" },
      { icon: FileCheck, label: "Pendientes", href: "/documental/pendientes" },
    ]
  },
  {
    icon: Truck,
    label: "Logística",
    href: "/logistica",
    subItems: [
      { icon: Package, label: "Inventario", href: "/logistica/inventario" },
      { icon: Truck, label: "Asignaciones", href: "/logistica/asignaciones" },
      { icon: AlertTriangle, label: "Stock Bajo", href: "/logistica/stock" },
    ]
  },
  { icon: BarChart3, label: "Finanzas", href: "/finanzas" },
  {
    icon: Settings,
    label: "Configuración",
    href: "/configuracion",
    subItems: [
      { icon: Users, label: "Usuarios", href: "/configuracion/usuarios" },
      { icon: LayoutDashboard, label: "Trabajadores", href: "/configuracion/trabajadores" },
      { icon: FileCheck, label: "Manual de Usuario", href: "/configuracion/manual" },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
  const { user, logout } = useAuthStore();

  const userModules = user?.modulos || ["dashboard"];
  const isAdmin = user?.rol === "ADMIN";

  const filteredMenuItems = menuItems.filter(item => {
    if (item.href === "/") return true;
    if (isAdmin) return true;
    const moduleId = item.href.split("/")[1];
    return userModules.includes(moduleId);
  });

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(() => {
    const activeItem = filteredMenuItems.find(item => item.subItems && pathname.startsWith(item.href));
    return activeItem ? activeItem.href : null;
  });


  return (
    <div className={cn(
      "flex flex-col h-screen bg-primary text-white border-r border-sidebar-border fixed left-0 top-0 transition-all duration-300 ease-in-out z-40",
      sidebarCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "p-6 flex items-center gap-3 relative",
        sidebarCollapsed ? "justify-center" : "justify-start"
      )}>
        <div className="bg-accent p-2 rounded-lg shrink-0">
          <Zap className="w-6 h-6 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-in fade-in duration-300">
            <h1 className="text-xl font-bold leading-none">HH T</h1>
            <p className="text-[10px] text-white/60 font-medium tracking-wider uppercase">Soluciona S.A.C.</p>
          </div>
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

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white text-primary border border-border rounded-full w-8 h-8 shadow-md hover:bg-slate-50 hover:text-primary z-50 hidden md:flex"
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>
    </div>
  );
}
