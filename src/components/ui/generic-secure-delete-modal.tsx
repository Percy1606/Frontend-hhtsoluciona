"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface GenericSecureDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  entityName: string;
  loading?: boolean;
}

export function GenericSecureDeleteModal({ isOpen, onClose, onConfirm, entityName, loading = false }: GenericSecureDeleteModalProps) {
  const [password, setPassword] = useState("");

  const handleConfirm = async () => {
    if (!password.trim()) {
      toast.error("Contraseña requerida", { description: "Debe ingresar la contraseña de administrador." });
      return;
    }

    try {
      await onConfirm(password);
      setPassword("");
      onClose();
    } catch (error: any) {
      toast.error("Acceso Denegado", { 
        description: error.response?.data?.message || error.message || "Contraseña incorrecta o error en la eliminación." 
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 border-none bg-white overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader className="p-6 bg-red-600 text-white shrink-0">
          <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
            <Lock className="w-6 h-6 text-white" />
            Confirmación de Seguridad
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-black text-red-600 uppercase tracking-widest">Atención: Acción Irreversible</p>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                        Estás a punto de eliminar <span className="text-red-700 font-black">"{entityName}"</span>. 
                        Esta acción no se puede deshacer.
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="admin-pass" className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">
                    Contraseña de Administrador
                </Label>
                <Input
                    id="admin-pass"
                    type="password"
                    placeholder="Ingrese su clave para confirmar..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-slate-200 bg-slate-50 focus:bg-white transition-all font-black text-center tracking-[0.3em] rounded-xl"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                />
            </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
            <Button 
                variant="ghost" 
                onClick={onClose}
                className="h-12 flex-1 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-100"
            >
                Cancelar
            </Button>
            <Button
                onClick={handleConfirm}
                disabled={loading || !password.trim()}
                className="h-12 flex-[2] bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-200 gap-2"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirmar Eliminación
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
