"use client";

import { useState, useEffect, useMemo } from "react";
import { useCRMStore, Quote } from "@/store/crm-store";
import { CRMHeader } from "@/components/crm/crm-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import * as XLSX from "xlsx";
import { 
  Folder, 
  Search, 
  Download, 
  Eye, 
  Calendar, 
  DollarSign, 
  FileCheck, 
  FilterX, 
  LayoutGrid, 
  List, 
  ChevronRight, 
  Plus, 
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function OrdenesServicioPage() {
  const { quotes, clients, fetchQuotes, fetchClients } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [advisorFilter, setAdvisorFilter] = useState("todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState<"folders" | "table">("folders");
  const [selectedFolderClient, setSelectedFolderClient] = useState<{
    id?: string;
    empresa: string;
    ruc?: string;
    zona?: string;
    contacto?: string;
    telefono?: string;
    correo?: string;
    quotes: Quote[];
  } | null>(null);

  useEffect(() => {
    fetchQuotes();
    fetchClients(1, 1000);
  }, [fetchQuotes, fetchClients]);

  const serviceOrders = useMemo(() => {
    return quotes.filter((q) => {
      const isWon = ['Ganada', 'Aprobado', 'Aprobada', 'Ganado', 'Orden de Servicio'].includes(q.estado);
      const hasOSFile = !!(q as any).archivoAdjuntoUrl;
      return isWon || hasOSFile;
    });
  }, [quotes]);

  const filteredOrders = useMemo(() => {
    return serviceOrders.filter((q) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (q.empresa?.toLowerCase() || "").includes(query) ||
        (q.codigo?.toLowerCase() || "").includes(query) ||
        (q.referencia?.toLowerCase() || "").includes(query);

      const clientInfo = clients.find(c => c.id === q.clientId || (c.empresa && q.empresa && c.empresa.toLowerCase() === q.empresa.toLowerCase()));
      const asesor = clientInfo?.asignadoA || "Sin Asignar";

      const matchesAdvisor =
        advisorFilter === "todos" ||
        asesor.toLowerCase() === advisorFilter.toLowerCase();

      let matchesDate = true;
      if (startDate) {
        const qDate = q.fecha ? new Date(q.fecha).toISOString().split('T')[0] : '';
        if (qDate && qDate < startDate) matchesDate = false;
      }
      if (endDate) {
        const qDate = q.fecha ? new Date(q.fecha).toISOString().split('T')[0] : '';
        if (qDate && qDate > endDate) matchesDate = false;
      }

      return matchesSearch && matchesAdvisor && matchesDate;
    });
  }, [serviceOrders, searchQuery, advisorFilter, startDate, endDate, clients]);

  const clientFolders = useMemo(() => {
    const map = new Map<string, {
      id?: string;
      empresa: string;
      ruc?: string;
      zona?: string;
      contacto?: string;
      telefono?: string;
      correo?: string;
      quotes: Quote[];
      totalAmount: number;
    }>();

    filteredOrders.forEach((q) => {
      const clientName = q.empresa?.trim() || "Cliente Sin Nombre";
      const key = clientName.toLowerCase();
      const clientObj = clients.find(c => c.id === q.clientId || (c.empresa && c.empresa.trim().toLowerCase() === key));

      if (!map.has(key)) {
        map.set(key, {
          id: clientObj?.id,
          empresa: clientName,
          ruc: clientObj?.ruc,
          zona: clientObj?.zona || "Piura",
          contacto: clientObj?.contacto,
          telefono: clientObj?.telefono,
          correo: clientObj?.correo,
          quotes: [],
          totalAmount: 0
        });
      }

      const folder = map.get(key)!;
      folder.quotes.push(q);
      folder.totalAmount += Number(q.monto || 0);
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredOrders, clients]);

  const stats = useMemo(() => {
    const totalCount = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, q) => sum + Number(q.monto || 0), 0);
    const clientsCount = clientFolders.length;
    const avgTicket = totalCount > 0 ? totalRevenue / totalCount : 0;

    return { totalCount, totalRevenue, clientsCount, avgTicket };
  }, [filteredOrders, clientFolders]);

  const handleExportExcel = () => {
    const dataToExport = filteredOrders.map((q, idx) => {
      const clientInfo = clients.find(c => c.id === q.clientId || (c.empresa && q.empresa && c.empresa.toLowerCase() === q.empresa.toLowerCase()));
      return {
        "N°": idx + 1,
        "Código OS": q.codigo || "-",
        "Empresa": q.empresa || "-",
        "RUC": clientInfo?.ruc || "-",
        "Servicio": q.referencia || "-",
        "Monto": Number(q.monto || 0),
        "Moneda": q.moneda || "PEN",
        "Fecha": formatDate(q.fecha),
        "Asesor": clientInfo?.asignadoA || "Sin Asignar",
        "Estado": q.estado || "Orden de Servicio",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ordenes de Servicio");
    XLSX.writeFile(wb, `Ordenes_Servicio_HH_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-3">
      <CRMHeader 
        title="Carpeta de Órdenes de Servicio" 
        subtitle="Expediente de contratos y servicios ganados por cliente." 
      />

      {/* KPI CARDS - ULTRA COMPACT */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black uppercase text-slate-400">Órdenes Ganadas</p>
            <p className="text-lg font-black text-slate-800">{stats.totalCount}</p>
          </div>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black uppercase text-slate-400">Total Cerrado</p>
            <p className="text-lg font-black text-emerald-600">
              S/ {stats.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black uppercase text-slate-400">Clientes con OS</p>
            <p className="text-lg font-black text-indigo-600">{stats.clientsCount}</p>
          </div>
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Folder className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black uppercase text-slate-400">Ticket Promedio</p>
            <p className="text-lg font-black text-slate-800">
              S/ {stats.avgTicket.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* CONTROLES - ULTRA COMPACT CON ETIQUETAS */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-end justify-between gap-3">
        <div className="space-y-1 w-full sm:w-72">
          <Label className="text-[8px] font-black uppercase text-slate-400 tracking-wider ml-0.5">Búsqueda Rápida</Label>
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input 
              placeholder="Buscar cliente, RUC o código..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 border-slate-200 bg-slate-50/50 font-bold text-xs rounded-lg"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2 w-full sm:w-auto justify-end">
          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-[8px] font-black uppercase text-slate-400 tracking-wider ml-0.5">Asesor Asignado</Label>
            <Select value={advisorFilter} onValueChange={(val) => setAdvisorFilter(val || "todos")}>
              <SelectTrigger className="w-full sm:w-[140px] h-8 border-slate-200 font-bold text-[10px] rounded-lg bg-white uppercase">
                <SelectValue placeholder="TODOS LOS ASESORES" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="todos" className="font-bold text-[10px] uppercase">TODOS</SelectItem>
                <SelectItem value="Angi" className="font-bold text-[10px] uppercase">Angi</SelectItem>
                <SelectItem value="Valentina" className="font-bold text-[10px] uppercase">Valentina</SelectItem>
                <SelectItem value="Ariana" className="font-bold text-[10px] uppercase">Ariana</SelectItem>
                <SelectItem value="Brenda" className="font-bold text-[10px] uppercase">Brenda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-[8px] font-black uppercase text-slate-400 tracking-wider ml-0.5">Fecha Desde</Label>
            <Input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 w-full sm:w-[138px] text-xs font-semibold border-slate-200 bg-white rounded-lg px-2.5 shadow-2xs"
            />
          </div>

          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-[8px] font-black uppercase text-slate-400 tracking-wider ml-0.5">Fecha Hasta</Label>
            <Input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 w-full sm:w-[138px] text-xs font-semibold border-slate-200 bg-white rounded-lg px-2.5 shadow-2xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[8px] font-black uppercase text-slate-400 tracking-wider ml-0.5">Modo de Vista</Label>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-8">
              <button
                onClick={() => setViewMode("folders")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all",
                  viewMode === "folders" ? "bg-white text-primary shadow-sm" : "text-slate-500"
                )}
              >
                <LayoutGrid className="w-3 h-3" /> Carpetas
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all",
                  viewMode === "table" ? "bg-white text-primary shadow-sm" : "text-slate-500"
                )}
              >
                <List className="w-3 h-3" /> Tabla
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[8px] font-black uppercase text-slate-400 tracking-wider ml-0.5">Reportes</Label>
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              className="h-8 font-black uppercase text-[8px] border-slate-200 rounded-lg gap-1 hover:bg-slate-50 px-2.5"
            >
              <Download className="w-3 h-3" /> Exportar
            </Button>
          </div>

          {(searchQuery || advisorFilter !== "todos" || startDate || endDate) && (
            <div className="space-y-1">
              <Label className="text-[8px] font-black uppercase text-slate-400 tracking-wider ml-0.5 opacity-0">Reset</Label>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearchQuery("");
                  setAdvisorFilter("todos");
                  setStartDate("");
                  setEndDate("");
                }}
                className="h-8 font-black uppercase text-[8px] text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg gap-1 px-2"
                title="Limpiar todos los filtros"
              >
                <FilterX className="w-3 h-3" /> Limpiar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* CONTENIDO: CARPETAS O TABLA */}
      {viewMode === "folders" ? (
        clientFolders.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl space-y-2">
            <FilterX className="w-6 h-6 text-slate-300 mx-auto" />
            <p className="text-xs font-black text-slate-500 uppercase">Sin órdenes de servicio registradas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {clientFolders.map((folder) => (
              <div 
                key={folder.empresa}
                onClick={() => setSelectedFolderClient(folder)}
                className="bg-white border border-slate-200 hover:border-emerald-500/60 hover:shadow-md transition-all rounded-xl p-3.5 cursor-pointer flex flex-col justify-between group gap-2.5 h-[155px]"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 bg-emerald-100/70 text-emerald-700 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Folder className="w-4 h-4 fill-current" />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 font-black text-[9px] uppercase border border-emerald-200 px-2 py-0.5 h-4.5">
                      {folder.quotes.length} OS
                    </Badge>
                  </div>

                  <div className="space-y-0.5">
                    <h3 
                      className="font-black text-xs text-slate-800 uppercase tracking-tight line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors" 
                      title={folder.empresa}
                    >
                      {folder.empresa}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      {folder.ruc ? `RUC: ${folder.ruc}` : (folder.zona || "Sin RUC")}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black uppercase text-slate-400">Total</p>
                    <p className="text-xs font-black text-slate-900">
                      S/ {folder.totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-black text-primary uppercase text-[8px] py-2.5 pl-3">#</TableHead>
                <TableHead className="font-black text-primary uppercase text-[8px]">CÓDIGO OS</TableHead>
                <TableHead className="font-black text-primary uppercase text-[8px]">CLIENTE</TableHead>
                <TableHead className="font-black text-primary uppercase text-[8px]">SERVICIO</TableHead>
                <TableHead className="font-black text-primary uppercase text-[8px] text-center">FECHA</TableHead>
                <TableHead className="font-black text-primary uppercase text-[8px] text-right">MONTO</TableHead>
                <TableHead className="font-black text-primary uppercase text-[8px] text-right pr-3">DOCUMENTO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((q, idx) => (
                <TableRow key={q.id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell className="font-black text-[8px] text-slate-400 pl-3 w-[25px]">{idx + 1}</TableCell>
                  <TableCell className="font-black text-[11px] text-primary">{q.codigo || "—"}</TableCell>
                  <TableCell className="font-black text-xs text-slate-800 uppercase max-w-[150px] truncate">{q.empresa}</TableCell>
                  <TableCell className="font-bold text-[11px] text-slate-700 uppercase break-words leading-snug">{q.referencia || "Servicio Técnico"}</TableCell>
                  <TableCell className="text-center text-[9px] font-bold text-slate-500 uppercase whitespace-nowrap">{formatDate(q.fecha)}</TableCell>
                  <TableCell className="text-right font-black text-xs text-slate-900 whitespace-nowrap">
                    {q.moneda === 'USD' ? '$' : 'S/'} {Number(q.monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right pr-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 px-1.5 font-black uppercase text-[8px] text-indigo-600 hover:bg-indigo-50 gap-0.5"
                        onClick={() => window.open(`/documental/cotizaciones/preview/${q.id}`, '_blank')}
                      >
                        <Eye className="w-3 h-3" /> Propuesta
                      </Button>
                      {(q as any).archivoAdjuntoUrl && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-1.5 font-black uppercase text-[8px] text-emerald-700 hover:bg-emerald-50 gap-0.5"
                          onClick={() => window.open(api.getFileUrl((q as any).archivoAdjuntoUrl), '_blank')}
                        >
                          <Download className="w-3 h-3" /> OS Firmada
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* MODAL EXPEDIENTE - ULTRA COMPACT */}
      {selectedFolderClient && (
        <Dialog open={!!selectedFolderClient} onOpenChange={() => setSelectedFolderClient(null)}>
          <DialogContent className="max-w-3xl w-full p-0 border-none bg-white shadow-2xl rounded-xl overflow-hidden">
            <DialogHeader className="p-4 bg-slate-900 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500 text-white font-black text-[7px] uppercase border-none px-1.5 py-0 h-3.5">
                      Expediente Comercial
                    </Badge>
                    <span className="text-[8px] text-slate-400 uppercase font-bold">RUC: {selectedFolderClient.ruc || "Sin RUC"}</span>
                  </div>
                  <DialogTitle className="text-lg font-black uppercase tracking-tight">{selectedFolderClient.empresa}</DialogTitle>
                </div>
                <div className="text-right">
                  <p className="text-[7px] font-black uppercase text-slate-400">Total Acumulado</p>
                  <p className="text-base font-black text-emerald-400">
                    S/ {selectedFolderClient.quotes.reduce((sum, q) => sum + Number(q.monto || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="p-4 space-y-2.5 max-h-[55vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h4 className="font-black text-[10px] uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-emerald-600" /> Órdenes ({selectedFolderClient.quotes.length})
                </h4>
                <Link href={`/crm/cotizaciones?newClient=${selectedFolderClient.id || ''}`}>
                  <Button size="sm" className="h-6 font-black uppercase text-[7px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1 px-2">
                    <Plus className="w-2.5 h-2.5" /> Nueva Cotización
                  </Button>
                </Link>
              </div>

              <div className="space-y-1.5">
                {selectedFolderClient.quotes.map((q) => (
                  <div key={q.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex items-center justify-between gap-3">
                    <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[11px] text-primary">{q.codigo || "—"}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" /> {formatDate(q.fecha)}
                        </span>
                      </div>
                      <p className="font-black text-xs text-slate-800 uppercase break-words line-clamp-2 leading-snug" title={q.referencia}>
                        {q.referencia || "Servicio Técnico"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-xs font-black text-slate-900 whitespace-nowrap">
                        {q.moneda === 'USD' ? '$' : 'S/'} {Number(q.monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 font-black uppercase text-[7px] border-indigo-200 text-indigo-700 px-1.5"
                        onClick={() => window.open(`/documental/cotizaciones/preview/${q.id}`, '_blank')}
                      >
                        <Eye className="w-2.5 h-2.5 mr-0.5" /> Propuesta
                      </Button>
                      {(q as any).archivoAdjuntoUrl && (
                        <Button 
                          size="sm" 
                          className="h-6 font-black uppercase text-[7px] bg-emerald-600 hover:bg-emerald-700 text-white px-1.5"
                          onClick={() => window.open(api.getFileUrl((q as any).archivoAdjuntoUrl), '_blank')}
                        >
                          <Download className="w-2.5 h-2.5 mr-0.5" /> OS
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
