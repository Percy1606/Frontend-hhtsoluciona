"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, HelpCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type DialogType = "success" | "error" | "confirm" | "info" | "warning";

interface ModernDialogProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  type?: DialogType;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  children?: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

const config = {
  success: {
    icon: <CheckCircle2 className="w-12 h-12 text-success" />,
    bg: "bg-success/10",
    headerBg: "bg-success",
    btnBg: "bg-success hover:bg-success/90",
  },
  error: {
    icon: <XCircle className="w-12 h-12 text-error" />,
    bg: "bg-error/10",
    headerBg: "bg-error",
    btnBg: "bg-error hover:bg-error/90",
  },
  confirm: {
    icon: <HelpCircle className="w-12 h-12 text-secondary" />,
    bg: "bg-secondary/10",
    headerBg: "bg-secondary",
    btnBg: "bg-secondary hover:bg-secondary/90",
  },
  warning: {
    icon: <AlertCircle className="w-12 h-12 text-warning" />,
    bg: "bg-warning/10",
    headerBg: "bg-warning",
    btnBg: "bg-warning hover:bg-warning/90",
  },
  info: {
    icon: <Info className="w-12 h-12 text-blue-500" />,
    bg: "bg-blue-50",
    headerBg: "bg-blue-600",
    btnBg: "bg-blue-600 hover:bg-blue-700",
  }
};

export function ModernDialog({
  isOpen,
  onOpenChange = () => {},
  title,
  description,
  type = "info",
  onConfirm,
  confirmText = "Entendido",
  cancelText = "Cancelar",
  showCancel = false,
  children,
  className,
  maxWidth = "sm:max-w-[550px]",
}: ModernDialogProps) {
  const currentConfig = config[type];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidth, "p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white", className)}>
        <DialogHeader className={cn("p-6 flex flex-col items-center gap-4 text-white", currentConfig.headerBg)}>
          {!children && (
            <div className="bg-white/20 p-3 rounded-full animate-in zoom-in-50 duration-300">
              {currentConfig.icon}
            </div>
          )}
          <DialogTitle className="text-xl font-black uppercase text-center tracking-tight">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className={cn("p-8", children && "p-6 overflow-y-auto max-h-[70vh]")}>
          {description && (
            <DialogDescription className="text-center text-slate-600 font-bold text-base leading-relaxed mb-4">
              {description}
            </DialogDescription>
          )}
          {children}
        </div>

        {!children && (
          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row justify-center gap-3">
            {showCancel && (
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-11 px-8 font-black uppercase text-xs text-slate-500 hover:bg-slate-200"
              >
                {cancelText}
              </Button>
            )}
            <Button
              onClick={() => {
                if (onConfirm) onConfirm();
                else onOpenChange(false);
              }}
              className={cn("h-11 px-10 font-black uppercase text-xs text-white shadow-lg", currentConfig.btnBg)}
            >
              {confirmText}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
