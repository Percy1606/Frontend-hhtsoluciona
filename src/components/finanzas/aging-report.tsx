"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Loader2, AlertCircle, Clock, Calendar } from "lucide-react";

interface AgingData {
  corriente: number;
  vencido1_30: number;
  vencido31_60: number;
  vencido61_90: number;
  vencido90_mas: number;
  detalle: {
    id: string;
    codigo: string;
    cliente: string;
    proyecto: string;
    monto: number;
    diasMora: number;
    fechaVencimiento: string;
  }[];
}

export function AgingReport() {
  const [data, setData] = useState<AgingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAging() {
      try {
        const response = await api.get("/finanzas/aging");
        setData(response.data);
      } catch (error) {
        console.error("Error loading aging report:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAging();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: "Al Día", value: data.corriente, color: "text-emerald-600" },
          { label: "1-30 Días", value: data.vencido1_30, color: "text-amber-500" },
          { label: "31-60 Días", value: data.vencido31_60, color: "text-orange-500" },
          { label: "61-90 Días", value: data.vencido61_90, color: "text-red-500" },
          { label: "+90 Días", value: data.vencido90_mas, color: "text-red-700 font-black" },
        ].map((bucket) => (
          <Card key={bucket.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">{bucket.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${bucket.color}`}>{formatCurrency(bucket.value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cartera Morosa Detallada</CardTitle>
          <Badge variant="outline" className="text-red-600 border-red-200">
            Total Vencido: {formatCurrency(data.vencido1_30 + data.vencido31_60 + data.vencido61_90 + data.vencido90_mas)}
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Cliente / Proyecto</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Mora</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.detalle.filter(f => f.diasMora > 0).sort((a,b) => b.diasMora - a.diasMora).map((f) => (
                <TableRow key={f.id} className="hover:bg-red-50/30 transition-colors">
                  <TableCell className="font-bold">{f.codigo}</TableCell>
                  <TableCell>
                    <div className="font-medium text-primary">{f.cliente}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{f.proyecto}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3" />
                      {new Date(f.fechaVencimiento).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-error">
                    {formatCurrency(f.monto)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-bold text-red-600">
                      <Clock className="w-3 h-3" />
                      {f.diasMora} días
                    </div>
                  </TableCell>
                  <TableCell>
                    {f.diasMora > 60 ? (
                      <Badge variant="destructive" className="animate-pulse">Legal / Crítico</Badge>
                    ) : f.diasMora > 30 ? (
                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none">Seguimiento</Badge>
                    ) : (
                      <Badge variant="secondary">Recordatorio</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {data.detalle.filter(f => f.diasMora > 0).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay facturas vencidas en este momento. ✨
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
