"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, FileUp, DollarSign, AlertCircle, Edit2, FileCheck, Landmark, CheckCircle2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DetalleCobrosDialogProps {
  proyectoId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function DetalleCobrosDialog({ proyectoId, open, onClose, onUpdate }: DetalleCobrosDialogProps) {
  const [detalle, setDetalle] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cajas, setCajas] = useState<any[]>([]);

  // States para edición de hito
  const [editingHitoId, setEditingHitoId] = useState<string | null>(null);
  const [editHitoDesc, setEditHitoDesc] = useState("");
  const [editHitoMonto, setEditHitoMonto] = useState("");

  // States para edición de Venta Contratada
  const [editingVenta, setEditingVenta] = useState(false);
  const [editVentaMonto, setEditVentaMonto] = useState("");

  useEffect(() => {
    if (open && proyectoId) {
      cargarDetalle();
      cargarCajas();
    }
  }, [open, proyectoId]);

  const cargarCajas = async () => {
    try {
      const data = await api.get("/finanzas/cajas");
      setCajas(data);
    } catch (e) {
      console.error("Error al cargar cajas", e);
    }
  };

  const cargarDetalle = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/finanzas/bandeja-proyectos/${proyectoId}/detalle`);
      setDetalle(data);
    } catch (error) {
      toast.error("Error al cargar los detalles financieros.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !proyectoId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tipo", "Financiero");

    try {
      await api.post(`/finanzas/bandeja-proyectos/${proyectoId}/documentos`, formData);
      toast.success("Archivo subido correctamente");
      e.target.value = '';
      cargarDetalle();
    } catch (error: any) {
      toast.error("Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const [creatingHito, setCreatingHito] = useState(false);
  const [newHitoDesc, setNewHitoDesc] = useState("");
  const [newHitoMonto, setNewHitoMonto] = useState("");

  const handleUpdateHito = async (hitoId: string) => {
    const montoNum = Number(editHitoMonto);
    if (!editHitoDesc || isNaN(montoNum) || montoNum <= 0) {
      toast.error("Ingresa una descripción y monto válido para el hito");
      return;
    }

    try {
      await api.patch(`/finanzas/bandeja-proyectos/${proyectoId}/hitos/${hitoId}`, {
        monto: montoNum,
        descripcion: editHitoDesc,
      });
      toast.success("Hito actualizado correctamente");
      setEditingHitoId(null);
      cargarDetalle();
    } catch (error: any) {
      toast.error(error.message || "No se pudo actualizar el hito");
    }
  };

  const handleCreateHito = async () => {
    const montoNum = Number(newHitoMonto);
    if (!newHitoDesc || isNaN(montoNum) || montoNum <= 0) {
      toast.error("Ingresa una descripción y monto válido para el nuevo hito");
      return;
    }

    try {
      await api.post(`/finanzas/bandeja-proyectos/${proyectoId}/hitos`, {
        monto: montoNum,
        descripcion: newHitoDesc,
      });
      toast.success("Hito creado correctamente");
      setCreatingHito(false);
      setNewHitoDesc("");
      setNewHitoMonto("");
      cargarDetalle();
    } catch (error: any) {
      toast.error(error.message || "No se pudo crear el hito");
    }
  };

  const [confirmDeleteHitoId, setConfirmDeleteHitoId] = useState<string | null>(null);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const handleDeleteHito = async () => {
    if (!confirmDeleteHitoId) return;
    try {
      await api.delete(`/finanzas/bandeja-proyectos/${proyectoId}/hitos/${confirmDeleteHitoId}`);
      toast.success("Hito eliminado correctamente");
      setConfirmDeleteHitoId(null);
      cargarDetalle();
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar el hito");
    }
  };

  const handleDeleteDoc = async () => {
    if (!confirmDeleteDocId) return;
    try {
      await api.delete(`/finanzas/bandeja-proyectos/${proyectoId}/documentos/${confirmDeleteDocId}`);
      toast.success("Documento eliminado correctamente");
      setConfirmDeleteDocId(null);
      cargarDetalle();
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar el documento");
    }
  };

  const handleUpdateVenta = async () => {
    const montoNum = Number(editVentaMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error("Ingresa un monto válido para el proyecto");
      return;
    }
    try {
      await api.patch(`/finanzas/bandeja-proyectos/${proyectoId}/venta-contratada`, { monto: montoNum });
      toast.success("Total del Proyecto actualizado");
      setEditingVenta(false);
      cargarDetalle();
      onUpdate();
    } catch (error) {
      toast.error("Error al actualizar el monto del proyecto");
    }
  };

  const handleFacturar = async (hito: any) => {
    if (!hito || Number(hito.monto) <= 0) {
      toast.error("El hito debe tener un monto válido antes de facturarse.");
      return;
    }

    try {
      await api.post(`/finanzas/bandeja-proyectos/${proyectoId}/facturar`, {
        hitoId: hito.id,
        monto: Number(hito.monto),
        descripcion: `Adelanto: ${hito.descripcion}`,
        fechaVencimiento: new Date().toISOString(),
      });
      toast.success("Factura generada exitosamente, vinculada al hito");
      cargarDetalle();
    } catch (error) {
      toast.error("No se pudo generar la factura");
    }
  };

  const [payingFacturaId, setPayingFacturaId] = useState<string | null>(null);
  const [payMonto, setPayMonto] = useState("");
  const [payCajaId, setPayCajaId] = useState("");

  const handleRegistrarPago = async (facturaId: string) => {
    try {
      if (!payCajaId) {
        toast.error("Seleccione una caja de destino");
        return;
      }
      const montoNum = Number(payMonto);
      if (isNaN(montoNum) || montoNum <= 0) {
        toast.error("Ingrese un monto válido");
        return;
      }
      
      await api.post(`/finanzas/bandeja-proyectos/${proyectoId}/pagar`, {
        facturaId,
        cajaId: payCajaId,
        monto: montoNum,
        referencia: "Pago registrado desde Bandeja",
      });
      toast.success("Pago registrado correctamente");
      setPayingFacturaId(null);
      setPayMonto("");
      setPayCajaId("");
      cargarDetalle();
      onUpdate();
    } catch (error) {
      toast.error("Error al registrar el pago");
    }
  };

  if (!detalle && loading) return null;

  // Cálculos Financieros Generales
  const ventaContratada = Number(detalle?.ventaContratada) || Number(detalle?.cotizacionOrigen?.monto) || 0;
  
  const facturas = detalle?.facturas || [];
  const totalFacturado = facturas.reduce((sum: number, f: any) => sum + Number(f.montoTotal), 0);
  
  const totalCobrado = facturas.reduce((sum: number, f: any) => {
    const pagado = Number(f.montoTotal) - Number(f.saldoPendiente);
    return sum + (pagado > 0 ? pagado : 0);
  }, 0);

  const saldoPorFacturar = Math.max(0, ventaContratada - totalFacturado);
  const saldoPorCobrar = Math.max(0, totalFacturado - totalCobrado);

  // Mapeo de Hitos facturados para saber su estado visual
  const hitosPagosList = detalle?.cotizacionOrigen?.hitosPago || [];
  
  return (
    <>
      <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-6xl bg-slate-50 border-slate-200 shadow-2xl overflow-hidden p-0 flex flex-col h-[90vh]">
        {/* HEADER & DASHBOARD */}
        <div className="bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
          <DialogHeader className="p-5 pb-4">
            <DialogTitle className="text-xl font-black uppercase text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Landmark className="w-6 h-6 text-emerald-600" />
                <span>Cobros: {detalle?.codigo}</span>
              </div>
              <Badge variant="outline" className="text-sm border-blue-200 bg-blue-50 text-blue-700 px-3 py-1">
                Cliente: {detalle?.cliente?.empresa}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-slate-200 border-t border-slate-100">
            <div className="bg-white p-4 relative group">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black uppercase text-slate-400">Total Proyecto</p>
                {!editingVenta && (
                  <button onClick={() => {
                    setEditVentaMonto(ventaContratada.toString());
                    setEditingVenta(true);
                  }} className="text-slate-300 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100">
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              {editingVenta ? (
                <div className="flex gap-2 items-center mt-1">
                  <Input 
                    value={editVentaMonto} 
                    onChange={(e) => setEditVentaMonto(e.target.value)} 
                    className="h-7 text-xs font-bold" 
                    type="number"
                  />
                  <Button size="sm" onClick={handleUpdateVenta} className="h-7 w-7 p-0 bg-blue-600 shrink-0"><CheckCircle2 className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingVenta(false)} className="h-7 w-7 p-0 shrink-0 text-slate-400"><AlertCircle className="w-3 h-3" /></Button>
                </div>
              ) : (
                <p className="text-lg font-bold text-slate-800">S/ {ventaContratada.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
              )}
            </div>
            <div className="bg-white p-4">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Facturado</p>
              <p className="text-lg font-bold text-blue-600">S/ {totalFacturado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Cobrado</p>
              <p className="text-lg font-bold text-emerald-600">S/ {totalCobrado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Saldo x Facturar</p>
              <p className="text-lg font-bold text-amber-600">S/ {saldoPorFacturar.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Saldo x Cobrar</p>
              <p className="text-lg font-bold text-red-600">S/ {saldoPorCobrar.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL SCROLLABLE */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMNA 1: EL PLAN (HITOS) */}
            <div className="lg:col-span-4 space-y-6 min-w-0">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                  El Plan (Hitos)
                </h3>
              </div>
              
              <div className="space-y-4">
                {hitosPagosList.map((hito: any, i: number) => {
                  const montoValido = Number(hito.monto) > 0;
                  const isEditing = editingHitoId === hito.id;
                  // Buscar si este hito ya tiene facturas asociadas
                  const facturasDelHito = facturas.filter((f: any) => f.hitoPagoId === hito.id);
                  const isFacturado = facturasDelHito.length > 0;

                  return (
                    <div key={hito.id} className={`p-4 rounded-xl border shadow-sm relative overflow-hidden ${montoValido ? 'bg-white border-slate-200' : 'bg-red-50/30 border-red-200'}`}>
                      {/* Estado lateral */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isFacturado ? 'bg-blue-500' : (montoValido ? 'bg-amber-400' : 'bg-red-500')}`} />
                      
                      {isEditing ? (
                        <div className="pl-3 space-y-3">
                          <Input 
                            value={editHitoDesc} 
                            onChange={(e) => setEditHitoDesc(e.target.value)} 
                            className="h-8 text-xs" 
                            placeholder="Descripción del Hito"
                          />
                          <Input 
                            value={editHitoMonto} 
                            onChange={(e) => setEditHitoMonto(e.target.value)} 
                            className="h-8 text-xs" 
                            type="number"
                            placeholder="Monto S/"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateHito(hito.id)} className="h-7 text-[10px] w-full">Guardar</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingHitoId(null)} className="h-7 text-[10px] w-full">Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="pl-3">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-700 leading-tight pr-4">{hito.descripcion || `Hito ${i + 1}`}</p>
                            {!isFacturado && (
                              <div className="flex gap-2">
                                <button onClick={() => {
                                  setEditingHitoId(hito.id);
                                  setEditHitoDesc(hito.descripcion || "");
                                  setEditHitoMonto(hito.monto);
                                }} className="text-slate-400 hover:text-blue-600 transition-colors">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => setConfirmDeleteHitoId(hito.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {montoValido ? (
                            <p className="text-sm font-black text-slate-900 mb-3">S/ {Number(hito.monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                          ) : (
                            <div className="flex items-center gap-1 text-red-500 mb-3 bg-red-50 p-1.5 rounded-md w-fit">
                              <AlertCircle className="w-3 h-3" />
                              <span className="text-[10px] font-bold">MONTO NO DEFINIDO</span>
                            </div>
                          )}

                          {isFacturado ? (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200 text-[9px]"><FileCheck className="w-3 h-3 mr-1"/> YA FACTURADO</Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => handleFacturar(hito)} 
                              variant="default" 
                              disabled={!montoValido}
                              className="w-full text-[10px] uppercase font-bold h-7 bg-slate-800"
                            >
                              Emitir Factura
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {hitosPagosList.length === 0 && !creatingHito && (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium mb-2">No hay hitos en la cotización.</p>
                  </div>
                )}
                
                {creatingHito ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <h4 className="text-xs font-black uppercase text-slate-700 mb-3">Nuevo Plan de Cobro</h4>
                    <div className="space-y-3">
                      <Input 
                        value={newHitoDesc} 
                        onChange={(e) => setNewHitoDesc(e.target.value)} 
                        className="h-8 text-xs" 
                        placeholder="Ej. Adelanto 50% o Pago Final"
                      />
                      <Input 
                        value={newHitoMonto} 
                        onChange={(e) => setNewHitoMonto(e.target.value)} 
                        className="h-8 text-xs" 
                        type="number"
                        placeholder="Monto S/"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleCreateHito} className="h-7 text-[10px] w-full bg-blue-600 hover:bg-blue-700">Guardar</Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setCreatingHito(false);
                          setNewHitoDesc("");
                          setNewHitoMonto("");
                        }} className="h-7 text-[10px] w-full">Cancelar</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed border-2 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => setCreatingHito(true)}
                  >
                    + Agregar Plan de Cobro
                  </Button>
                )}
              </div>
            </div>

            {/* COLUMNA 2: LA EJECUCIÓN (FACTURAS Y PAGOS) */}
            <div className="lg:col-span-5 space-y-6 min-w-0">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                  La Ejecución (Facturas)
                </h3>
              </div>

              <div className="space-y-4">
                {facturas.map((fac: any) => {
                  const isPagada = Number(fac.saldoPendiente) <= 0;
                  // Encontrar el nombre del hito
                  const hitoOriginal = hitosPagosList.find((h:any) => h.id === fac.hitoPagoId);

                  return (
                    <div key={fac.id} className={`bg-white p-5 rounded-xl border shadow-sm ${isPagada ? 'border-emerald-200' : 'border-blue-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-800">{fac.codigo}</span>
                          <Badge variant="outline" className={`text-[9px] ${isPagada ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                            {isPagada ? "PAGADA COMPLETAMENTE" : "PENDIENTE DE COBRO"}
                          </Badge>
                        </div>
                      </div>
                      
                      {hitoOriginal && (
                        <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                          <Badge variant="secondary" className="px-1 py-0 text-[8px]">Ref Hito</Badge> {hitoOriginal.descripcion}
                        </p>
                      )}
                      
                      <p className="text-[11px] text-slate-600 mb-4 line-clamp-2">{fac.observaciones || fac.concepto}</p>
                      
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Facturado</p>
                          <p className="text-base font-black text-slate-800">S/ {Number(fac.montoTotal).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                        </div>
                        {!isPagada && (
                          <div className="flex flex-col items-end gap-2">
                              <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Saldo: S/ {Number(fac.saldoPendiente).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                              
                              {payingFacturaId === fac.id ? (
                                <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg w-64 shadow-inner">
                                  <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Registrar Cobro</div>
                                  <Input 
                                    type="number" 
                                    placeholder="Monto a cobrar" 
                                    value={payMonto}
                                    onChange={e => setPayMonto(e.target.value)}
                                    className="h-8 text-xs"
                                  />
                                  <select 
                                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={payCajaId}
                                    onChange={e => setPayCajaId(e.target.value)}
                                  >
                                    <option value="" disabled>Selecciona Caja/Banco</option>
                                    {cajas.map(c => (
                                      <option key={c.id} value={c.id}>{c.nombre} (S/ {Number(c.saldoReal).toLocaleString("es-PE")})</option>
                                    ))}
                                  </select>
                                  <div className="flex gap-2 mt-1">
                                    <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]" onClick={() => setPayingFacturaId(null)}>Cancelar</Button>
                                    <Button size="sm" className="flex-1 h-7 bg-emerald-600 hover:bg-emerald-700 text-[10px] text-white" onClick={() => handleRegistrarPago(fac.id)}>Guardar</Button>
                                  </div>
                                </div>
                              ) : (
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    setPayingFacturaId(fac.id);
                                    setPayMonto(fac.saldoPendiente);
                                    if (cajas.length > 0) setPayCajaId(cajas[0].id);
                                  }} 
                                  className="bg-emerald-600 hover:bg-emerald-700 text-[10px] uppercase font-black h-8"
                                >
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  Registrar Pago
                                </Button>
                              )}
                          </div>
                        )}
                        {isPagada && (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-xs font-black uppercase">Cancelada</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {facturas.length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No se han emitido facturas</p>
                    <p className="text-[10px] text-slate-400 mt-1">Genera la primera factura desde el panel "El Plan".</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA 3: SOPORTES (ARCHIVOS) */}
            <div className="lg:col-span-3 space-y-6 min-w-0">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold">3</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                  Soportes
                </h3>
              </div>

              <div className="bg-slate-100/50 p-5 rounded-2xl border border-dashed border-slate-300 hover:bg-slate-100 transition-colors">
                <label className="flex flex-col items-center justify-center w-full cursor-pointer text-center">
                  <div className="flex flex-col items-center justify-center pb-2">
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-600">
                      {uploading ? "Subiendo..." : "Subir Comprobante"}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 mt-1">Vouchers, Contratos (PDF/IMG)</p>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png" />
                </label>
              </div>

              <div className="space-y-2">
                {detalle?.documentos?.filter((d: any) => d.tipo === "Financiero").map((doc: any, i: number) => (
                  <div key={doc.id || i} className="flex items-center gap-2 group w-full">
                    <button onClick={() => setPreviewDoc(doc)} className="flex-1 min-w-0 flex items-center text-left gap-3 p-3 bg-white border border-slate-100 shadow-sm rounded-xl hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100">
                        <FileText className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-[11px] font-bold text-slate-700 truncate">{doc.nombre}</p>
                        <p className="text-[9px] font-medium text-slate-400">{doc.fechaSubida ? format(new Date(doc.fechaSubida), "dd MMM, HH:mm", { locale: es }) : "Fecha desconocida"}</p>
                      </div>
                    </button>
                    <button onClick={() => setConfirmDeleteDocId(doc.id)} className="shrink-0 p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>

      <Dialog open={!!confirmDeleteHitoId} onOpenChange={(o) => !o && setConfirmDeleteHitoId(null)}>
        <DialogContent className="max-w-sm rounded-2xl border-0 shadow-2xl p-6 bg-white">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Eliminar Plan de Cobro</h3>
              <p className="text-sm text-slate-500">¿Estás seguro que deseas eliminar este hito? Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteHitoId(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteHito}>Sí, Eliminar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteDocId} onOpenChange={(o) => !o && setConfirmDeleteDocId(null)}>
        <DialogContent className="max-w-sm rounded-2xl border-0 shadow-2xl p-6 bg-white">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Eliminar Documento</h3>
              <p className="text-sm text-slate-500">¿Estás seguro que deseas eliminar este soporte? Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteDocId(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteDoc}>Sí, Eliminar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl bg-slate-50 border-slate-200 shadow-2xl overflow-hidden p-0 flex flex-col h-[85vh]">
          <DialogHeader className="p-4 bg-white border-b border-slate-200 shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              {previewDoc?.nombre}
            </DialogTitle>
            <div className="flex items-center gap-2 pr-6">
              <Button size="sm" variant="outline" className="h-8" onClick={() => window.open(api.getFileUrl(previewDoc?.url), '_blank')}>
                Descargar / Abrir en pestaña
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 flex items-center justify-center p-4">
            {previewDoc && (
              previewDoc.url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                <img src={api.getFileUrl(previewDoc.url)} alt={previewDoc.nombre} className="max-w-full max-h-full object-contain shadow-sm border border-slate-200 rounded-lg" />
              ) : (
                <iframe src={api.getFileUrl(previewDoc.url)} className="w-full h-full border-0 rounded-lg shadow-sm bg-white" title="Preview" />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
