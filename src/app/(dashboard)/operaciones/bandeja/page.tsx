"use client";

import { useEffect, useState } from "react";
import { useOperacionesStore } from "@/store/operaciones-store";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ClipboardList, Calendar, User, Clock, CheckCircle2, FileText, Printer, FilterX, Search, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegistroVisitaImpresion } from "@/components/operaciones/registro-visita-impresion";
import { ConstanciaVisitaImpresion } from "@/components/operaciones/constancia-visita-impresion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BandejaTecnicaPage() {
  const { user } = useAuthStore();
  const { 
    fichasTecnicas, 
    totalFichas,
    fichaPage,
    fichaTotalPages,
    fetchFichasTecnicas, 
    submitFichaTecnica, 
    loading,
    borradoresImpresion,
    setBorradorImpresion,
    borradoresConstancia,
    setBorradorConstancia,
    fichaStats
  } = useOperacionesStore();
  const [selectedFicha, setSelectedFicha] = useState<any>(null);
  const [isRouteSheetOpen, setIsRouteSheetOpen] = useState(false);
  const [isConstanciaOpen, setIsConstanciaOpen] = useState(false);
  
  // Filtros - Por defecto el día actual
  const [startDate, setStartDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const isAdminOrSupervisor = user?.rol === 'ADMIN' || user?.rol === 'SUPERVISOR';
    const tecnicoId = isAdminOrSupervisor ? undefined : user?.responsable?.id;
    
    // Si no es admin/sup y no tiene responsable vinculado, el técnicoId será undefined
    // pero el backend filtrará por 'NONE' si el usuario no tiene responsableId.
    fetchFichasTecnicas(1, 20, tecnicoId, searchTerm, startDate, endDate);
  }, [fetchFichasTecnicas, user, searchTerm, startDate, endDate]);

  const handlePageChange = (newPage: number) => {
    const isAdminOrSupervisor = user?.rol === 'ADMIN' || user?.rol === 'SUPERVISOR';
    const tecnicoId = isAdminOrSupervisor ? undefined : user?.responsable?.id;
    fetchFichasTecnicas(newPage, 20, tecnicoId, searchTerm, startDate, endDate);
  };

  const filteredFichas = fichasTecnicas;

  const handleOpenRouteSheet = (ficha: any) => {
    setSelectedFicha(ficha);
    setIsRouteSheetOpen(true);
  };

  const handleOpenConstancia = (ficha: any) => {
    setSelectedFicha(ficha);
    setIsConstanciaOpen(true);
  };

  const handleDirectSubmit = async (ficha: any) => {
    try {
      const borrador = borradoresImpresion[ficha.id] || {};
      const dataToSubmit = {
        hallazgos: borrador.comentariosCliente || "Ver Hoja de Ruta física/PDF para detalles.",
        recomendaciones: borrador.comentariosExtras || "Ver Hoja de Ruta física/PDF para detalles.",
        observaciones: "Inspección finalizada directamente desde la Bandeja Técnica usando los datos de la Hoja de Ruta.",
        firmaTecnico: "",
        adjuntos: ficha.adjuntos || [],
        datosTecnicos: {
          ...ficha.datosTecnicos,
          ...borrador
        }
      };

      await submitFichaTecnica(ficha.id, dataToSubmit);
      toast.success("Ficha Técnica Finalizada", { description: "La información ha sido sincronizada correctamente." });
    } catch (error) {
      toast.error("Error al Guardar", { description: "No se pudo sincronizar la ficha técnica." });
    }
  };

  const handlePrint = () => {
    if (selectedFicha) {
      window.open(`/operaciones/imprimir/${selectedFicha.id}`, '_blank');
    }
  };

  const handlePrintConstancia = () => {
    if (selectedFicha) {
      window.open(`/operaciones/constancia/${selectedFicha.id}`, '_blank');
    }
  };

  const isUserLinked = !!user?.responsable?.id || user?.rol === 'ADMIN' || user?.rol === 'SUPERVISOR';

  return (
    <div className="space-y-4">
      {!isUserLinked && (
        <Alert className="bg-amber-50 border-amber-200 rounded-xl">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 font-black text-xs uppercase tracking-tight">Usuario no Vinculado</AlertTitle>
            <AlertDescription className="text-amber-700 text-[11px] font-medium leading-relaxed">
                Su cuenta de usuario no está vinculada a un perfil de trabajador. No podrá ver las visitas técnicas que se le asignen hasta que un administrador vincule su usuario en la sección de Configuración.
            </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-black text-primary tracking-tight uppercase">Bandeja Técnica</h1>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wide">
            Gestión de inspecciones y visitas de campo asignadas.
          </p>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-4 shadow-sm h-10">
          <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-[10px] font-black text-slate-400 uppercase">Pendientes:</span>
            <span className="text-sm font-black text-primary">{fichaStats.pending}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-[10px] font-black text-slate-400 uppercase">Completadas:</span>
            <span className="text-sm font-black text-primary">{fichaStats.completed}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="relative flex-1 max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por cliente o técnico..." 
              className="pl-10 h-9 border-slate-200 bg-slate-50/30 focus:bg-white transition-all shadow-none font-bold text-xs rounded-xl" 
              value={searchTerm}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-primary tracking-widest ml-1">Desde</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 border-slate-200 bg-white font-bold text-[10px] rounded-xl w-32" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-primary tracking-widest ml-1">Hasta</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 border-slate-200 bg-white font-bold text-[10px] rounded-xl w-32" 
              />
            </div>
            {(startDate || endDate || searchTerm) && (
              <Button 
                variant="outline" 
                onClick={() => { setStartDate(""); setEndDate(""); setSearchQuery(""); }}
                className="h-9 text-slate-400 hover:text-error hover:bg-red-50 border border-slate-200 rounded-xl gap-2 font-black text-[10px] uppercase"
              >
                <FilterX className="w-3.5 h-3.5" /> LIMPIAR
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden print:hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="font-black text-primary text-[10px] uppercase py-3 pl-6">Fecha Programada</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase">Cliente / Empresa</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase text-center">Técnico</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase text-center">Estado</TableHead>
              <TableHead className="font-black text-primary text-[10px] uppercase text-right pr-6">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFichas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FilterX className="w-8 h-8 text-slate-200" />
                    <p className="text-slate-400 font-bold italic text-xs uppercase">
                      {fichasTecnicas.length === 0 
                        ? (startDate || endDate ? "No hay visitas para las fechas seleccionadas." : "No hay visitas técnicas asignadas.") 
                        : "No hay resultados para los filtros aplicados."}
                    </p>
                    {(startDate || endDate) && (
                        <Button 
                            variant="link" 
                            className="text-primary font-black text-[10px] uppercase"
                            onClick={() => { setStartDate(""); setEndDate(""); }}
                        >
                            Ver todo el historial
                        </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredFichas.map((ficha) => (
                <TableRow key={ficha.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="py-3 pl-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-xs text-slate-700">
                        {ficha.fechaVisita ? format(new Date(ficha.fechaVisita), "dd MMM yyyy", { locale: es }) : "---"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-xs text-primary uppercase leading-tight">{ficha.cliente?.empresa}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">RUC: {ficha.cliente?.ruc}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-black text-accent border border-accent/20" title={ficha.tecnico?.nombre}>
                        {ficha.tecnico?.nombre ? ficha.tecnico.nombre[0] : "?"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "font-black text-[8px] uppercase px-2 h-4.5 shadow-none border-none",
                      ficha.estado === 'PENDIENTE' ? "bg-warning/20 text-warning-foreground" : "bg-success text-white"
                    )}>
                      {ficha.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-all">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-primary" onClick={() => handleOpenRouteSheet(ficha)} title="Hoja de Ruta">
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleOpenConstancia(ficha)} title="Constancia">
                        <ClipboardList className="w-4 h-4" />
                      </Button>
                      {ficha.estado === 'PENDIENTE' ? (
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-white font-black text-[9px] uppercase h-7 px-3"
                          onClick={() => handleDirectSubmit(ficha)}
                          disabled={loading}
                        >
                          {loading ? "..." : "Finalizar"}
                        </Button>
                      ) : (
                        <div className="w-16 flex justify-center">
                           <CheckCircle2 className="w-4 h-4 text-success" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginación Integrada (Estilo Cartera) */}
        {fichaTotalPages > 1 && (
            <div className="p-3 bg-slate-50 border-t border-border flex items-center justify-between">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">
                    Página {fichaPage} de {fichaTotalPages} — Total: {totalFichas} visitas
                </p>
                <div className="flex gap-2 mr-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={fichaPage <= 1 || loading}
                        onClick={() => handlePageChange(fichaPage - 1)}
                        className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white"
                    >
                        Anterior
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={fichaPage >= fichaTotalPages || loading}
                        onClick={() => handlePageChange(fichaPage + 1)}
                        className="h-7 px-4 font-black text-[9px] uppercase border-slate-200 bg-white"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        )}
      </div>

      <Dialog open={isRouteSheetOpen} onOpenChange={setIsRouteSheetOpen}>
        <DialogContent className="max-w-4xl p-0 border-none bg-white shadow-2xl rounded-xl overflow-hidden">
          <DialogHeader className="p-6 bg-[#001529] text-white shrink-0 flex flex-row items-center justify-between print:hidden">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
              <FileText className="w-6 h-6 text-accent" />
              Vista de Impresión: Registro de Visita Técnica
            </DialogTitle>
            <Button className="bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase h-9 px-6 shadow-lg shadow-accent/20" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Generar PDF
            </Button>
          </DialogHeader>
          {selectedFicha && (
            <ScrollArea className="max-h-[85vh] p-0 bg-slate-100">
              <div className="py-8">
                <RegistroVisitaImpresion 
                  ficha={selectedFicha} 
                  borrador={borradoresImpresion[selectedFicha.id]} 
                  onBorradorChange={(data) => setBorradorImpresion(selectedFicha.id, data)}
                />
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConstanciaOpen} onOpenChange={setIsConstanciaOpen}>
        <DialogContent className="max-w-4xl p-0 border-none bg-white shadow-2xl rounded-xl overflow-hidden">
          <DialogHeader className="p-6 bg-emerald-900 text-white shrink-0 flex flex-row items-center justify-between print:hidden">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
              <ClipboardList className="w-6 h-6 text-emerald-200" />
              Vista de Impresión: Constancia de Visita Técnica
            </DialogTitle>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase h-9 px-6 shadow-lg shadow-emerald-500/20" onClick={handlePrintConstancia}>
              <Printer className="w-4 h-4 mr-2" /> Generar PDF
            </Button>
          </DialogHeader>
          {selectedFicha && (
            <ScrollArea className="max-h-[85vh] p-0 bg-slate-100">
              <div className="py-8">
                <ConstanciaVisitaImpresion 
                  ficha={selectedFicha} 
                  borrador={borradoresConstancia[selectedFicha.id]} 
                  onBorradorChange={(data) => setBorradorConstancia(selectedFicha.id, data)}
                />
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
