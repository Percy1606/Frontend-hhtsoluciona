"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLayoutStore } from "@/store/layout-store";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useLayoutStore();
  const { fetchProyectos, fetchResponsables } = useOperacionesStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      setIsReady(true);
      fetchProyectos();
      fetchResponsables();
    }
  }, [isAuthenticated, router, fetchProyectos, fetchResponsables]);

  if (!isAuthenticated || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#001F3F] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
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
