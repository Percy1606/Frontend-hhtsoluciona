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
      const endpoint = type === "facturas" ? "/finanzas/facturas" : "/finanzas/gastos?limit=1000";
      const res = await api.get(endpoint);
      const data = Array.isArray(res) ? res : (res.data || []);
      
      const formattedData = data.map((item: any) => {
        if (type === "facturas") {
          return {
            "Código Documento": item.codigo || "",
            "Tipo": item.clasificacion === 'VENTA_SERVICIO' ? 'Servicios' : (item.clasificacion === 'PROYECTO' ? 'Proyecto' : 'Alquiler'),
            "Cliente": item.cliente?.empresa || "Sin Cliente",
            "Referencia / Proyecto": item.proyecto?.nombre || "Venta Directa",
            "Emisión": item.fechaEmision ? new Date(item.fechaEmision).toLocaleDateString() : "",
            "Vencimiento": item.fechaVencimiento ? new Date(item.fechaVencimiento).toLocaleDateString() : "",
            "Subtotal (S/)": Number(item.montoSubtotal) || 0,
            "IGV (S/)": Number(item.montoIgv) || 0,
            "Total Facturado (S/)": Number(item.montoTotal) || 0,
            "Monto Pagado (S/)": (Number(item.montoTotal) || 0) - (Number(item.saldoPendiente) || 0),
            "Saldo Deuda (S/)": Number(item.saldoPendiente) || 0,
            "Estado": item.estado || "",
            "Observaciones": item.observaciones || ""
          };
        } else {
          return {
            "Código": item.codigo || item.id,
            "Concepto": item.concepto || item.descripcion || "",
            "Tipo": item.tipo || "",
            "Proveedor": item.proveedor?.razonSocial || item.proveedor?.empresa || "Sin Proveedor",
            "Proyecto": item.proyecto?.nombre || "Gasto General",
            "Monto Total (S/)": Number(item.montoTotal) || 0,
            "Caja / Banco": item.caja?.nombre || "N/A",
            "Fecha": item.fechaEmision ? new Date(item.fechaEmision).toLocaleDateString() : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "")
          };
        }
      });
      
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
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
