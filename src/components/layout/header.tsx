"use client";

import { Search, Bell, User, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useLayoutStore } from "@/store/layout-store";
import { useAuthStore } from "@/store/auth-store";

export function Header() {
  const today = new Date();
  const { toggleSidebar } = useLayoutStore();
  const { user } = useAuthStore();

  return (
    <header className="h-16 border-b border-border bg-white px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="relative w-96 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar clientes, proyectos, facturas..." 
            className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold capitalize">
            {format(today, "eeee, d 'de' MMMM", { locale: es })}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
            HH T Soluciona S.A.C.
          </p>
        </div>

        <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-white" />
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-border">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold leading-none">{user?.nombre || "Usuario"}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{user?.rol === "ADMIN" ? "Administrador" : "Usuario Estándar"}</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
            {user?.nombre ? user.nombre.charAt(0) : <User className="w-5 h-5" />}
          </div>
        </div>
      </div>
    </header>
  );
}
