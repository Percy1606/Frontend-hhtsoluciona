"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface CashFlowChartProps {
  data?: any[];
  isPrint?: boolean;
}

export function CashFlowChart({ data, isPrint = false }: CashFlowChartProps) {
  if (!data || data.length === 0) return (
    <div className="h-full w-full flex items-center justify-center opacity-30">
      <p className="font-bold uppercase text-xs tracking-widest">Sin datos analíticos</p>
    </div>
  );

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00B050" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#00B050" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E30613" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#E30613" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
            tickFormatter={(value) => `S/. ${value/1000}k`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
          <Area 
            type="monotone" 
            dataKey="ingresos" 
            stroke="#00B050" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorIngresos)" 
            isAnimationActive={!isPrint}
          />
          <Area 
            type="monotone" 
            dataKey="egresos" 
            stroke="#E30613" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorEgresos)" 
            isAnimationActive={!isPrint}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
