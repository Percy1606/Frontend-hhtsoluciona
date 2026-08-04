"use client";

import { useCRMStore } from "@/store/crm-store";
import { RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CRMHeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function CRMHeader({ title, subtitle, icon, actions }: CRMHeaderProps) {
  const { fetchClients, fetchQuotes, loading } = useCRMStore();

  const handleRefresh = async () => {
    await Promise.all([fetchClients(), fetchQuotes()]);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            {icon || <LayoutDashboard className="w-5 h-5 text-primary" />}
          </div>
          <h1 className="text-xl font-black text-primary tracking-tight uppercase">{title}</h1>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 font-bold uppercase tracking-wide">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
          className="h-9 gap-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'SINCRONIZANDO...' : 'REFRESCAR DATOS'}
        </Button>
      </div>
    </div>
  );
}
