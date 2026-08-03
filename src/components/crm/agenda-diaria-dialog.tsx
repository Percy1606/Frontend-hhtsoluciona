'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { AgendaDiaria } from "./agenda-diaria";
import { useCRMStore } from "@/store/crm-store";

interface AgendaDiariaDialogProps {
  children?: React.ReactNode;
}

export function AgendaDiariaDialog({ children }: AgendaDiariaDialogProps) {
  const [open, setOpen] = useState(false);
  const { clients } = useCRMStore();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100 font-bold text-[10px] uppercase rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
            title="Ver Agenda Diaria Comercial"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Agenda Diaria</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800 p-6 text-white rounded-2xl shadow-2xl">
        <DialogHeader className="border-b border-slate-800 pb-3 mb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            Agenda Diaria de Actividades Comerciales
          </DialogTitle>
        </DialogHeader>
        <AgendaDiaria clients={clients} />
      </DialogContent>
    </Dialog>
  );
}
