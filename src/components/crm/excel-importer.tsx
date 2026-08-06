"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCRMStore } from "@/store/crm-store";
import { getPeruDateString } from "@/lib/utils";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight,
  RefreshCw,
  Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Client } from "@/types/crm";

interface ExcelImporterProps {
  onImportComplete?: () => void;
}

export function ExcelImporter({ onImportComplete }: ExcelImporterProps) {
  const { importClients } = useCRMStore();
  const [isOpen, setIsOpen] = useState(false);
  const [fileType, setFileType] = useState<"base" | "mt4">("base");
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [parsedClients, setParsedClients] = useState<Client[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const parseExcelDate = (val: any): string => {
    if (!val) return "";
    if (typeof val === 'number') {
      // Excel date serial number
      const date = new Date((val - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    if (typeof val === 'string') {
      const cleaned = val.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
      const match = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      if (match) {
        const [_, d, m, y] = match;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return "";
  };

  const smartFuzzyMap = (row: any): Partial<Client> => {
    const mapped: any = {
      historialInteracciones: [],
      archivosAdjuntos: [],
      hallazgosTecnicos: [],
      solucionesPropuestas: []
    };

    // Normalize keys to lowercase, without accents and spaces
    const normalizeKey = (key: string) => {
      return key
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
    };

    const rowKeys = Object.keys(row);
    const getRowValue = (synonyms: string[]) => {
      const normalizedSynonyms = synonyms.map(s => normalizeKey(s));
      for (const key of rowKeys) {
        if (normalizedSynonyms.includes(normalizeKey(key))) {
          return row[key];
        }
      }
      return undefined;
    };

    mapped.empresa = getRowValue(["Empresa", "Razon Social", "Cliente", "Nombre Empresa", "Compañia"]) || "";
    mapped.ruc = String(getRowValue(["RUC", "R.U.C.", "Registro Unico", "Identificacion"]) || "").trim();
    mapped.direccion = getRowValue(["Direccion", "Direccion Fiscal", "Planta", "Ubicacion"]) || "";
    
    const tarifaRaw = getRowValue(["Tarifa", "Tarifa Electrica", "Tipo Tarifa"]) || "";
    mapped.tarifa = String(tarifaRaw).trim() || "MT3";

    mapped.telefono = String(getRowValue(["Telefono", "Celular", "Telf", "Movil", "Contacto Telefono"]) || "");
    mapped.contacto = getRowValue(["Contacto", "Nombre Contacto", "Representante", "Atencion"]) || "";
    mapped.cargo = getRowValue(["Cargo", "Cargo Contacto", "Puesto"]) || "";
    mapped.correo = getRowValue(["Correo", "Email", "Correo Electronico", "E-mail"]) || "";
    mapped.asignadoA = getRowValue(["Asignado A", "Responsable", "Vendedor", "Asignado"]) || "Angi";
    mapped.diaTrabajo = getRowValue(["Dia de Trabajo", "Dia Trabajo", "Dia Visita", "Dia"]) || "Lunes";
    mapped.estado = getRowValue(["Estado", "Situacion", "Estado Cliente"]) || "Activo";

    const prioridadRaw = getRowValue(["Prioridad", "Importancia"]) || "";
    const p = String(prioridadRaw).trim().toLowerCase();
    mapped.prioridad = p.includes("crit") ? "Crítica" : p.includes("alt") ? "Alta" : p.includes("baj") ? "Baja" : "Media";

    mapped.accion = getRowValue(["Accion", "Accion Realizada", "Accion Programada"]) || "Llamada de seguimiento";
    
    mapped.ultimoContacto = parseExcelDate(getRowValue(["Fecha Ultimo Contacto", "Ultimo Contacto", "Fecha Contacto", "U. Contacto"]));
    if (!mapped.ultimoContacto) mapped.ultimoContacto = getPeruDateString();

    mapped.proximoSeguimiento = parseExcelDate(getRowValue(["Proximo Seguimiento", "Fecha Proximo Seguimiento", "Siguiente Contacto", "Prox Seguimiento"]));
    if (!mapped.proximoSeguimiento) mapped.proximoSeguimiento = getPeruDateString(new Date(Date.now() + 7 * 86400 * 1000));

    mapped.observaciones = getRowValue(["Observaciones", "Notas", "Comentarios", "Detalles"]) || "";
    mapped.zona = getRowValue(["Zona", "Distrito", "Region", "Ciudad"]) || "Piura";

    mapped.tipoCliente = getRowValue(["Tipo Cliente", "Tipo", "Tipo de Cliente"]) || "Nuevo";

    const etapaRaw = getRowValue(["Etapa Comercial", "Etapa", "Pipeline", "Etapa del Pipeline"]) || "";
    const et = String(etapaRaw).trim();
    const validStages = [
      "Prospecto", "Contactado", "Llamada Realizada", "Visita Agendada", 
      "Inspección Realizada", "Cotización Enviada", "Seguimiento", 
      "Negociación", "Orden de Servicio", "Ganado", "Perdido"
    ];
    
    // Fuzzy match stage
    const matchedStage = validStages.find(s => normalizeKey(s) === normalizeKey(et)) as any;
    mapped.etapaComercial = matchedStage || (fileType === "mt4" ? "Cotización Enviada" : "Prospecto");

    return mapped;
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (json.length === 0) {
          setErrorMessage("El archivo Excel está vacío.");
          return;
        }

        // Validate structure - check if at least company name can be mapped
        const testClient = smartFuzzyMap(json[0]);
        if (!testClient.empresa) {
          setErrorMessage("No se pudo identificar una columna para la Razón Social / Empresa. Verifica los encabezados de tu archivo.");
          return;
        }

        setPreviewData(json.slice(0, 5)); // First 5 rows for preview

        const clients: Client[] = json.map((row: any) => {
          return smartFuzzyMap(row) as Client;
        });

        setParsedClients(clients);
      } catch (err) {
        console.error(err);
        setErrorMessage("Error al procesar el archivo Excel. Asegúrate de que sea un archivo válido (.xlsx o .xls)");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = () => {
    if (parsedClients.length === 0) return;
    importClients(parsedClients);
    setIsOpen(false);
    setPreviewData([]);
    setParsedClients([]);
    if (onImportComplete) onImportComplete();
  };

  const downloadTemplate = () => {
    const headers = [
      "Razón Social", "RUC", "Dirección", "Zona", "Tarifa", "Teléfono", 
      "Contacto", "Cargo", "Correo", "Asignado A", "Día de Trabajo", 
      "Etapa Comercial", "Prioridad", "Último Contacto", "Próximo Seguimiento", 
      "Acción", "Observaciones", "Tipo Cliente"
    ];
    
    const sampleRowBase = [
      "EMPRESA EJEMPLO S.A.C.", "20123456789", "Av. Industrial 456, Piura", "Zona Industrial", "MT3", "987654321",
      "Carlos Mendívil", "Gerente Operaciones", "cmendivil@ejemplo.com", "Angi", "Lunes",
      "Prospecto", "Media", "2026-05-20", "2026-06-05",
      "Enviar brochure institucional", "Interesado en mantenimiento eléctrico general.", "Nuevo"
    ];

    const sampleRowMT4 = [
      "ALIMENTOS DEL NORTE", "20998877665", "Carretera Paita Km 5", "Paita", "MT4", "945612378",
      "Ing. Sonia Rivas", "Supervisora MT", "srivas@alimentosnorte.pe", "Valentina", "Martes",
      "Cotización Enviada", "Alta", "2026-05-22", "2026-05-29",
      "Llamar para verificar sustento de cotización", "Enviada cotización de cambio de celdas MT.", "Recurrente"
    ];

    const wsData = [headers, sampleRowBase, sampleRowMT4];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "CRM Plantilla");
    XLSX.writeFile(wb, `Plantilla_CRM_${fileType === "base" ? "BASE_CRM" : "MT4_ANGI"}.xlsx`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 font-bold border border-primary/20 text-primary bg-white hover:bg-slate-50 h-9 px-4 rounded-md text-xs uppercase cursor-pointer transition-colors">
        <Upload className="w-4 h-4" /> Importar Excel
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden p-0 border-none bg-white shadow-2xl">
        <DialogHeader className="p-6 bg-primary text-white shrink-0">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-accent" />
            Importar Clientes / Prospectos
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-6">
          {/* Selector de formato y botón de plantilla */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-primary uppercase mb-1">Formato de Importación</h4>
                <p className="text-xs text-muted-foreground font-medium mb-4">
                  Selecciona la estructura de plantilla que vas a subir.
                </p>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant={fileType === "base" ? "default" : "outline"}
                    className="flex-1 font-bold text-xs uppercase h-9"
                    onClick={() => setFileType("base")}
                  >
                    BASE CRM General
                  </Button>
                  <Button 
                    type="button"
                    variant={fileType === "mt4" ? "default" : "outline"}
                    className="flex-1 font-bold text-xs uppercase h-9"
                    onClick={() => setFileType("mt4")}
                  >
                    MT4 ANGI Específico
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-primary uppercase mb-1">Descargar Plantilla</h4>
                <p className="text-xs text-muted-foreground font-medium mb-4">
                  Descarga una plantilla de Excel con el formato correcto y datos de ejemplo.
                </p>
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full gap-2 border-primary/20 text-primary font-bold text-xs uppercase h-9 bg-white"
                  onClick={downloadTemplate}
                >
                  <Download className="w-4 h-4" /> Descargar Modelo (.xlsx)
                </Button>
              </div>
            </div>
          </div>

          {/* Area de arrastrar archivo */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("excel-file-input")?.click()}
          >
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="bg-white p-3 rounded-full shadow-sm border border-slate-200 mb-3">
              <Upload className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-bold text-slate-700">Arrastra tu archivo Excel aquí o haz clic para buscar</p>
            <p className="text-xs text-muted-foreground mt-1">Soporta formatos .xlsx, .xls y .csv</p>
          </div>

          {/* Mensajes de error */}
          {errorMessage && (
            <div className="bg-error/10 border-l-4 border-error p-4 rounded-r-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-error mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-error">Error de procesamiento</h5>
                <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Vista previa de datos */}
          {previewData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-primary uppercase flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Archivo cargado con éxito ({parsedClients.length} registros mapeados)
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setPreviewData([]);
                    setParsedClients([]);
                    setErrorMessage(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-error h-8"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Cambiar Archivo
                </Button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <ScrollArea className="h-60">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Empresa</TableHead>
                        <TableHead className="font-bold">RUC</TableHead>
                        <TableHead className="font-bold">Tarifa</TableHead>
                        <TableHead className="font-bold text-center">Etapa</TableHead>
                        <TableHead className="font-bold">Responsable</TableHead>
                        <TableHead className="font-bold">Dirección</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedClients.slice(0, 5).map((client, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-bold text-primary">{client.empresa}</TableCell>
                          <TableCell className="font-medium">{client.ruc || "N/A"}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{client.tarifa}</Badge></TableCell>
                          <TableCell className="text-center">
                            <Badge className="text-[9px] uppercase font-black bg-slate-100 text-slate-800 border-slate-200">
                              {client.etapaComercial}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{client.asignadoA}</TableCell>
                          <TableCell className="max-w-[150px] truncate text-muted-foreground">{client.direccion}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                {parsedClients.length > 5 && (
                  <div className="bg-slate-50 p-2 text-center text-[10px] text-muted-foreground font-medium border-t border-slate-200">
                    Mostrando los primeros 5 de {parsedClients.length} registros cargados.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)} 
                  className="font-bold h-11"
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleImport}
                  className="bg-primary hover:bg-primary/90 text-white font-black px-8 h-11 shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  Confirmar e Importar {parsedClients.length} Clientes <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
