"use client";

import { User, LogOut, Settings, UserCircle, Zap } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { NotificationBell } from "./notification-bell";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const today = new Date();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-border bg-white px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="-ml-3 hover:bg-slate-100 size-9 [&>svg]:size-5" />
      </div>

      <div className="flex items-center gap-6">
        {/* Botón Global de Hoja de Ruta */}
        <button
          onClick={() => router.push("/operaciones/workflow")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/85 hover:border-slate-300 hover:bg-slate-100/70 text-slate-700 font-bold text-[10px] uppercase rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
          title="Ver Hoja de Ruta Inter-Áreas"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>Hoja de Ruta</span>
        </button>

        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold capitalize">
            {format(today, "eeee, d 'de' MMMM", { locale: es })}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
            HH T Soluciona S.A.C.
          </p>
        </div>

        <NotificationBell />

        <div className="flex items-center gap-3 pl-6 border-l border-border">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 outline-none hover:bg-slate-50 p-1.5 rounded-xl transition-all cursor-pointer group">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold leading-none group-hover:text-primary transition-colors">
                  {user?.nombre || "Usuario"}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">
                  {user?.rol === "ADMIN" ? "Administrador" : "Usuario Estándar"}
                </p>
              </div>
              <Avatar size="lg" className="border-2 border-transparent group-hover:border-primary/20 transition-all">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user?.nombre ? user.nombre.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1 bg-white border border-slate-200 shadow-xl p-2 rounded-2xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal px-2 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none text-slate-900">{user?.nombre}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.username || "usuario@hht.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 px-2 rounded-xl focus:bg-slate-50 transition-colors"
                onClick={() => {
                  if (user?.rol === "ADMIN") {
                    router.push("/configuracion/usuarios");
                  } else if (user?.responsable?.id) {
                    router.push(`/configuracion/trabajadores?edit=${user.responsable.id}`);
                  } else {
                    router.push("/configuracion/trabajadores");
                  }
                }}
              >
                <UserCircle className="mr-3 h-4 w-4 text-slate-500" />
                <span className="font-medium text-slate-700">Mi Perfil</span>
              </DropdownMenuItem>
              
              {user?.rol === "ADMIN" && (
                <DropdownMenuItem className="cursor-pointer py-2.5 px-2 rounded-xl focus:bg-slate-50 transition-colors" onClick={() => router.push("/configuracion/usuarios")}>
                  <Settings className="mr-3 h-4 w-4 text-slate-500" />
                  <span className="font-medium text-slate-700">Configuración</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 px-2 rounded-xl text-destructive focus:text-destructive focus:bg-destructive/5 transition-colors" 
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="font-bold">Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
