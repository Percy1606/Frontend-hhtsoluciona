"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { Loader2, Calendar, AlertCircle } from "lucide-react";

interface Gasto {
  id: string;
  codigo?: string;
  concepto: string;
  montoTotal: number;
  saldoPendiente?: number;
  fechaVencimiento?: string;
  estado: string;
  prioridad: string;
  tipo: string;
  proveedor?: {
    razonSocial: string;
  };
  proyecto?: {
    nombre: string;
  };
}

export function ObligacionesReport() {
  const [data, setData] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadObligaciones() {
      try {
        const response: any = await api.get("/finanzas/gastos?limit=100");
        
        const allExpenses: Gasto[] = response.data || [];
        const obligaciones = allExpenses.filter(g => 
          g.estado !== "PAGADO" && 
          g.estado !== "ANULADO"
        );
        setData(obligaciones);
      } catch (error) {
        console.error("Error loading obligations:", error);
      } finally {
        setLoading(false);
      }
    }
    loadObligaciones();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let vencidas = 0;
  let venceEstaSemana = 0;
  let venceEsteMes = 0;
  let totalPendiente = 0;

  const getDiasMora = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return null;
    const v = new Date(fechaVencimiento);
    v.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - v.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const processedData = data.map(g => {
    const diasMora = getDiasMora(g.fechaVencimiento);
    const monto = Number(g.montoTotal) || 0;
    
    totalPendiente += monto;

    if (diasMora !== null) {
      if (diasMora > 0) {
        vencidas += monto;
      } else if (diasMora >= -7) {
        venceEstaSemana += monto;
        venceEsteMes += monto;
      } else if (diasMora >= -30) {
        venceEsteMes += monto;
      }
    }

    return { ...g, diasMora, monto };
  }).sort((a, b) => {
    if (!a.fechaVencimiento) return 1;
    if (!b.fechaVencimiento) return -1;
    return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Total por Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-primary">{formatCurrency(totalPendiente)}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-red-600">{formatCurrency(vencidas)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-orange-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Vence esta semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-orange-600">{formatCurrency(venceEstaSemana)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Vence este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-amber-600">{formatCurrency(venceEsteMes)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cronograma de Obligaciones (Cuentas por Pagar)</CardTitle>
          <Badge variant="outline" className="text-slate-500">
            {processedData.length} obligaciones pendientes
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obligación / Concepto</TableHead>
                <TableHead>Proveedor / Proyecto</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay obligaciones pendientes.
                  </TableCell>
                </TableRow>
              ) : (
                processedData.map((g) => (
                  <TableRow key={g.id} className={cn(
                    "transition-colors",
                    (g.diasMora && g.diasMora > 0) ? "hover:bg-red-50/50" : "hover:bg-slate-50/50"
                  )}>
                    <TableCell>
                      <div className="font-bold text-primary">{g.codigo || 'S/C'}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={g.concepto}>{g.concepto}</div>
                      <Badge variant="outline" className="mt-1 text-[9px] uppercase">{g.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-700">{g.proveedor?.razonSocial || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{g.proyecto?.nombre || 'General'}</div>
                    </TableCell>
                    <TableCell>
                      {g.fechaVencimiento ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium text-sm">
                            {new Date(g.fechaVencimiento).toLocaleDateString()}
                          </span>
                          {g.diasMora !== null && g.diasMora > 0 ? (
                            <Badge className="bg-red-100 text-red-700 border-none text-[9px] uppercase px-1 py-0 shadow-none">
                              Vencido hace {g.diasMora} días
                            </Badge>
                          ) : g.diasMora !== null && g.diasMora === 0 ? (
                            <Badge className="bg-orange-100 text-orange-700 border-none text-[9px] uppercase px-1 py-0 shadow-none">
                              Vence hoy
                            </Badge>
                          ) : g.diasMora !== null && g.diasMora >= -7 ? (
                            <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] uppercase px-1 py-0 shadow-none">
                              Vence en {Math.abs(g.diasMora)} días
                            </Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-300 italic text-xs">Sin fecha</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] uppercase border-none shadow-none",
                        g.prioridad === 'CRITICA' ? "bg-red-100 text-red-700" :
                        g.prioridad === 'ALTA' ? "bg-orange-100 text-orange-700" :
                        g.prioridad === 'MEDIA' ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {g.prioridad}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase shadow-none font-bold">
                        {g.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-black text-primary">
                      {formatCurrency(g.monto)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
