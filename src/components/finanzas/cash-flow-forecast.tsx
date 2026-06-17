"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { ProyeccionFinanciera } from "@/types/finanzas";
import { formatCurrency } from "@/lib/utils";
import { Loader2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

interface ForecastData {
  saldoActual: number;
  proyeccion: (ProyeccionFinanciera & {
    detalleEgresos: {
      planillas: number;
      impuestos: number;
      otros: number;
    }
  })[];
}

export function CashFlowForecast() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadForecast() {
      try {
        const response = await api.get("/finanzas/forecast");
        setData(response.data);
      } catch (error) {
        console.error("Error loading forecast:", error);
      } finally {
        setLoading(false);
      }
    }
    loadForecast();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.proyeccion.map(p => ({
    name: `${p.dias}d`,
    ingresos: p.cobros,
    egresos: p.pagos,
    saldo: p.saldoProyectado,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Saldo Operativo Actual</CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.saldoActual)}</div>
            <p className="text-xs text-muted-foreground mt-1">Soles (PEN)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Cobros Proyectados (90d)</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(data.proyeccion[4]?.cobros || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Estimado según fechas de cobro</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pagos Programados (90d)</CardTitle>
            <TrendingDown className="w-4 h-4 text-error" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">
              {formatCurrency(data.proyeccion[4]?.pagos || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Incluye planillas e impuestos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Liquidez Proyectada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="ingresos" name="Cobros (+)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresos" name="Pagos (-)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="saldo" name="Saldo Final" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle Cronológico</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intervalo</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead className="text-right">Cobros (+)</TableHead>
                <TableHead className="text-right">Pagos (-)</TableHead>
                <TableHead className="text-right">Saldo Proyectado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.proyeccion.map((p) => (
                <TableRow key={p.dias}>
                  <TableCell className="font-medium">{p.dias} días</TableCell>
                  <TableCell>{new Date(p.fecha).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right text-emerald-600 font-semibold">
                    {formatCurrency(p.cobros)}
                  </TableCell>
                  <TableCell className="text-right text-error font-semibold">
                    {formatCurrency(p.pagos)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(p.saldoProyectado)}
                  </TableCell>
                  <TableCell>
                    {p.saldoProyectado > 0 ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Estable</Badge>
                    ) : (
                      <Badge variant="destructive">Riesgo de Liquidez</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
