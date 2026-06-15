"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ExportButtonsProps {
  type: "facturas" | "gastos";
  filters?: any;
}

export function ExportButtons({ type, filters }: ExportButtonsProps) {
  
  const handleExportExcel = async () => {
    try {
      // Para gastos usamos un límite alto para exportar todo lo posible
      const endpoint = type === "facturas" ? "/finanzas/facturas" : "/finanzas/gastos?limit=1000";
      const res = await api.get(endpoint);
      const data = Array.isArray(res) ? res : (res.data || []);
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, type.toUpperCase());
      
      XLSX.writeFile(workbook, `Reporte_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Excel generado correctamente");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error al exportar a Excel");
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExportExcel}
        className="h-8 text-[10px] font-black uppercase border-green-200 text-green-700 hover:bg-green-50"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Excel
      </Button>
    </div>
  );
}
