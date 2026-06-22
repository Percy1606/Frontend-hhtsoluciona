"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Receipt, Calendar, AlertCircle, CheckCircle2, Award, FileText, DollarSign } from 'lucide-react';
import { api } from "@/lib/api";
import { formatCurrency, formatLargeCurrency } from "@/lib/utils";

export default function ReportesAvanzadosPage() {
  const [loading, setLoading] = useState(true);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  
  // Filtros
  const [vista, setVista] = useState<'DIA' | 'MES' | 'ANIO'>('MES');
  const [anioFiltro, setAnioFiltro] = useState<string>(new Date().getFullYear().toString());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facturasRes, gastosRes] = await Promise.all([
        api.get<any[]>('/finanzas/facturas'),
        api.get<any[]>('/finanzas/gastos?limit=5000') 
      ]);
      setFacturas(Array.isArray(facturasRes) ? facturasRes : []);
      setGastos(Array.isArray(gastosRes) ? gastosRes : ((gastosRes as any).data || []));
    } catch (error) {
      console.error("Error loading reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [dataAgrupada, totales, rankingClientes, facturasSinCobro] = useMemo(() => {
    const map = new Map<string, { label: string, facturado: number, cobrado: number, gastos: number, sortKey: string }>();
    const clientesMap = new Map<string, { nombre: string, facturado: number, cobrado: number }>();
    const fSinCobro: any[] = [];
    
    // Inicializar mapa según la vista
    if (vista === 'MES') {
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      meses.forEach((m, i) => map.set(m, { label: m, facturado: 0, cobrado: 0, gastos: 0, sortKey: String(i).padStart(2, '0') }));
    }

    const processDate = (dateString: string, amount: number, type: 'facturado' | 'cobrado' | 'gastos') => {
      if (!dateString || isNaN(amount)) return;
      const d = new Date(dateString);
      if (d.getFullYear().toString() !== anioFiltro && vista !== 'ANIO') return;

      let key = '';
      let sortKey = '';
      if (vista === 'DIA') {
        key = d.toISOString().split('T')[0];
        sortKey = key;
      } else if (vista === 'MES') {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        key = meses[d.getMonth()];
        sortKey = String(d.getMonth()).padStart(2, '0');
      } else if (vista === 'ANIO') {
        key = d.getFullYear().toString();
        sortKey = key;
      }

      if (!map.has(key)) {
        map.set(key, { label: key, facturado: 0, cobrado: 0, gastos: 0, sortKey });
      }
      const entry = map.get(key)!;
      entry[type] += amount;
    };

    // Procesar Facturas
    facturas.forEach(f => {
      const isCurrentYear = new Date(f.fechaEmision).getFullYear().toString() === anioFiltro || vista === 'ANIO';
      const fMonto = Number(f.montoTotal) || 0;
      const fPendiente = Number(f.saldoPendiente);

      // Agrupacion
      processDate(f.fechaEmision, fMonto, 'facturado');
      
      let cobradoFactura = 0;
      if (f.pagos && Array.isArray(f.pagos) && f.pagos.length > 0) {
        f.pagos.forEach((p: any) => {
          const m = Number(p.monto);
          cobradoFactura += m;
          processDate(p.fechaPago || f.fechaEmision, m, 'cobrado');
        });
      } else if (f.estado === 'PAGADO') {
        cobradoFactura = fMonto;
        processDate(f.fechaEmision, fMonto, 'cobrado');
      } else if (!isNaN(fPendiente)) {
        cobradoFactura = fMonto - fPendiente;
        if (cobradoFactura > 0) processDate(f.fechaEmision, cobradoFactura, 'cobrado');
      }

      // Ranking de clientes
      if (isCurrentYear && f.cliente) {
        const cName = f.cliente.nombreEmpresa || f.cliente.nombre || 'Cliente Desconocido';
        if (!clientesMap.has(cName)) clientesMap.set(cName, { nombre: cName, facturado: 0, cobrado: 0 });
        const cEntry = clientesMap.get(cName)!;
        cEntry.facturado += fMonto;
        cEntry.cobrado += cobradoFactura;
      }

      // Alertas: Sin cobro y vencidas (o con tiempo)
      if (isCurrentYear && fPendiente > 0 && f.estado !== 'ANULADA') {
        fSinCobro.push(f);
      }
    });

    // Procesar Gastos
    gastos.forEach(g => {
      if (g.estado === 'PAGADO') {
        processDate(g.fechaPago || g.createdAt, Number(g.montoTotal), 'gastos');
      }
    });

    const resultAgrupado = Array.from(map.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    
    const t = resultAgrupado.reduce((acc, curr) => ({
      facturado: acc.facturado + curr.facturado,
      cobrado: acc.cobrado + curr.cobrado,
      gastos: acc.gastos + curr.gastos,
    }), { facturado: 0, cobrado: 0, gastos: 0 });

    const ranking = Array.from(clientesMap.values()).sort((a, b) => b.facturado - a.facturado).slice(0, 5);
    const sortedAlertas = fSinCobro.sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()).slice(0, 5);

    return [resultAgrupado, t, ranking, sortedAlertas];

  }, [facturas, gastos, vista, anioFiltro]);

  const pendienteCobrar = totales.facturado - totales.cobrado;
  const porcentajeCobranza = totales.facturado > 0 ? ((totales.cobrado / totales.facturado) * 100) : 0;
  const utilidadNeta = totales.cobrado - totales.gastos; // Flujo Neto Real

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Cargando Reportes Financieros...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900">Inteligencia Financiera</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Análisis de Facturación, Utilidad y Desempeño
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={vista} onValueChange={(val: any) => setVista(val)}>
            <SelectTrigger className="w-[140px] rounded-xl font-bold text-xs uppercase bg-slate-50 border-none shadow-sm">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              <SelectValue placeholder="Vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DIA" className="text-xs font-bold uppercase">Por Día</SelectItem>
              <SelectItem value="MES" className="text-xs font-bold uppercase">Por Mes</SelectItem>
              <SelectItem value="ANIO" className="text-xs font-bold uppercase">Por Año</SelectItem>
            </SelectContent>
          </Select>

          {vista !== 'ANIO' && (
            <Select value={anioFiltro} onValueChange={(val) => setAnioFiltro(val || '')}>
              <SelectTrigger className="w-[120px] rounded-xl font-bold text-xs uppercase bg-slate-50 border-none shadow-sm">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {['2024', '2025', '2026', '2027'].map(a => (
                  <SelectItem key={a} value={a} className="text-xs font-bold uppercase">{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* RESUMEN EJECUTIVO (IA-like) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-10 -translate-y-20 pointer-events-none"></div>
        <div className="relative z-10 flex gap-4 items-start">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-300 mb-2">Resumen Ejecutivo del Período</h3>
            <p className="text-sm font-medium leading-relaxed text-slate-100">
              Durante la vista seleccionada, la empresa ha facturado <strong className="text-white">{formatCurrency(totales.facturado)}</strong>. 
              De este monto, se ha logrado recaudar el <strong className={porcentajeCobranza >= 80 ? "text-emerald-400" : "text-amber-400"}>{porcentajeCobranza.toFixed(1)}%</strong>. 
              {pendienteCobrar > 0 && ` Aún queda un pendiente de cobro de ${formatCurrency(pendienteCobrar)}.`} 
              Con gastos operativos de {formatCurrency(totales.gastos)}, el Flujo Neto o Utilidad resultante es de <strong className={utilidadNeta >= 0 ? "text-emerald-400" : "text-rose-400"}>{formatCurrency(utilidadNeta)}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Facturado */}
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-5 relative">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Facturado</p>
            <p className="text-xl font-black tracking-tighter mt-1 text-slate-800" title={formatCurrency(totales.facturado)}>
              {formatLargeCurrency(totales.facturado)}
            </p>
          </CardContent>
        </Card>

        {/* Cobrado */}
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-5 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dinero Cobrado</p>
            <p className="text-xl font-black tracking-tighter mt-1 text-emerald-600" title={formatCurrency(totales.cobrado)}>
              {formatLargeCurrency(totales.cobrado)}
            </p>
          </CardContent>
        </Card>

        {/* Pendiente Cobrar */}
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-5 relative">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="absolute top-5 right-5">
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-none text-[8px] font-black px-1.5">{porcentajeCobranza.toFixed(0)}% Eficiencia</Badge>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pendiente de Cobro</p>
            <p className="text-xl font-black tracking-tighter mt-1 text-amber-600" title={formatCurrency(pendienteCobrar)}>
              {formatLargeCurrency(pendienteCobrar)}
            </p>
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-5 relative">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center mb-3 group-hover:bg-rose-100 transition-colors">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gastos Pagados</p>
            <p className="text-xl font-black tracking-tighter mt-1 text-rose-600" title={formatCurrency(totales.gastos)}>
              {formatLargeCurrency(totales.gastos)}
            </p>
          </CardContent>
        </Card>

        {/* Utilidad Neta */}
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-5 relative">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Flujo Neto / Utilidad</p>
            <p className={`text-xl font-black tracking-tighter mt-1 ${utilidadNeta >= 0 ? "text-indigo-600" : "text-rose-600"}`} title={formatCurrency(utilidadNeta)}>
              {formatLargeCurrency(utilidadNeta)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAFICO */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-tighter text-slate-800">
                Evolución de Flujo Financiero
              </CardTitle>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Tendencias de Ingresos y Egresos</p>
            </div>
          </div>
          <CardContent className="p-6 h-[400px]">
            {dataAgrupada.length === 0 ? (
               <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase">
                 No hay datos en este periodo
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataAgrupada} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFacturado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCobrado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} 
                    dy={10}
                    interval="preserveStartEnd"
                    minTickGap={20}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }}
                    tickFormatter={(val) => `S/ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                    width={50}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', color: '#64748b', marginBottom: '8px' }}
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', paddingTop: '20px' }} />
                  
                  <Area type="monotone" name="Facturado" dataKey="facturado" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFacturado)" />
                  <Area type="monotone" name="Cobrado" dataKey="cobrado" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCobrado)" />
                  <Area type="monotone" name="Gastos" dataKey="gastos" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* SIDE PANELS */}
        <div className="space-y-6">
          {/* TOP CLIENTS */}
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <div className="p-5 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-800">
                <Award className="w-4 h-4 text-amber-500" />
                Top Clientes ({anioFiltro})
              </h3>
            </div>
            <CardContent className="p-0">
              {rankingClientes.length === 0 ? (
                <div className="p-6 text-center text-[10px] font-bold text-slate-400 uppercase">Sin facturación aún</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {rankingClientes.map((c, idx) => (
                    <div key={c.nombre} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-black">
                          {idx + 1}
                        </div>
                        <div className="w-32">
                          <p className="text-[10px] font-black uppercase text-slate-700 truncate" title={c.nombre}>{c.nombre}</p>
                          <p className="text-[9px] font-bold text-slate-400">{formatCurrency(c.cobrado)} cobrado</p>
                        </div>
                      </div>
                      <p className="text-xs font-black text-slate-900">{formatLargeCurrency(c.facturado)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ALERTAS */}
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <div className="p-5 border-b border-red-50 bg-red-50/50">
              <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                Alertas de Cobro
              </h3>
            </div>
            <CardContent className="p-0">
              {facturasSinCobro.length === 0 ? (
                <div className="p-6 text-center text-[10px] font-bold text-emerald-500 uppercase flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Todo al día
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {facturasSinCobro.map((f, idx) => (
                    <div key={f.id || idx} className="p-4 hover:bg-red-50/30 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] font-black uppercase text-slate-700">{f.codigo || 'Factura'}</p>
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-none text-[8px] font-black px-1.5 py-0">Pendiente</Badge>
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 mb-1 truncate">{f.cliente?.nombreEmpresa || f.cliente?.nombre || 'Cliente'}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Vence: {new Date(f.fechaVencimiento).toLocaleDateString()}</p>
                        <p className="text-xs font-black text-red-600">{formatCurrency(Number(f.saldoPendiente))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
