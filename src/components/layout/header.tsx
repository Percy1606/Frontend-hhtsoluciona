"use client";

import { useState } from "react";
import { User, LogOut, Settings, UserCircle, Zap, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import { NotificationBell } from "./notification-bell";
import { AgendaDiariaDialog } from "../crm/agenda-diaria-dialog";
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
import { MiPerfilModal } from "./mi-perfil-modal";

export function Header() {
  const today = new Date();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Determines whether user has admin-level access to configuracion/trabajadores
  // (ADMIN role OR user has "configuracion" module explicitly granted)
  const isAdmin = user?.rol === "ADMIN";
  const hasConfigAccess =
    isAdmin ||
    (Array.isArray(user?.modulos) && user.modulos.includes("configuracion"));

  const handleMiPerfil = () => {
    if (isAdmin) {
      // Admin goes to full user management
      router.push("/configuracion/usuarios");
    } else if (hasConfigAccess) {
      // Users with configuracion module access go to the full trabajadores page
      router.push("/configuracion/trabajadores");
    } else {
      // Regular users get the inline profile modal showing only their own data
      setProfileModalOpen(true);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-white px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4 flex-1">
          <SidebarTrigger className="-ml-3 hover:bg-slate-100 size-9 [&>svg]:size-5" />
        </div>

        <div className="flex items-center gap-3">
          {/* Botón Global de Hoja de Ruta */}
          <button
            onClick={() => router.push("/operaciones/workflow")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/85 hover:border-slate-300 hover:bg-slate-100/70 text-slate-700 font-bold text-[10px] uppercase rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
            title="Ver Hoja de Ruta Inter-Áreas"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Hoja de Ruta</span>
          </button>

          {/* Botón Global de Agenda Diaria al costado de Hoja de Ruta */}
          <button
            onClick={() => router.push("/crm/agenda")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100 font-bold text-[10px] uppercase rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
            title="Ver Agenda Diaria Comercial"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Agenda Diaria</span>
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
                    {isAdmin ? "Administrador" : "Usuario Estándar"}
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
                      <p className="text-sm font-bold leading-none text-slate-900">
                        {user?.nombre}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.username || "usuario@hht.com"}
                      </p>
                      {!isAdmin && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full w-fit uppercase tracking-wide">
                          <User className="w-2.5 h-2.5" />
                          Solo tu perfil
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-2" />

                {/* Mi Perfil — behavior changes by role */}
                <DropdownMenuItem
                  className="cursor-pointer py-2.5 px-2 rounded-xl text-slate-700 focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors"
                  onClick={handleMiPerfil}
                >
                  <UserCircle className="mr-3 h-4 w-4 opacity-70" />
                  <span className="font-medium">Mi Perfil</span>
                </DropdownMenuItem>

                {/* Configuración — only for ADMIN */}
                {isAdmin && (
                  <DropdownMenuItem
                    className="cursor-pointer py-2.5 px-2 rounded-xl text-slate-700 focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors"
                    onClick={() => router.push("/configuracion/usuarios")}
                  >
                    <Settings className="mr-3 h-4 w-4 opacity-70" />
                    <span className="font-medium">Configuración</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  className="cursor-pointer py-2.5 px-2 rounded-xl text-slate-700 focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors"
                  onClick={() => router.push("/configuracion/manual")}
                >
                  <BookOpen className="mr-3 h-4 w-4 opacity-70" />
                  <span className="font-medium">Manual de Usuario</span>
                </DropdownMenuItem>

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

      {/* Mi Perfil modal — only rendered for regular users (not admin, not config access) */}
      {!hasConfigAccess && (
        <MiPerfilModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
      )}
    </>
  );
}
