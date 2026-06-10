"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  Truck,
  Plus,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLogisticaStore } from "@/store/logistica-store";
import { ProveedorForm } from "@/components/logistica/proveedor-form";

const StatsCard = ({ label, value, icon, color, bgColor }: any) => (
  <div className={cn("p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 bg-white", bgColor)}>
    <div className={cn("p-3 rounded-lg bg-white shadow-sm", color)}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider leading-none mb-1">{label}</p>
      <p className={cn("text-2xl font-black leading-none tracking-tight", color)}>{value}</p>
    </div>
  </div>
);

export default function ProveedoresPage() {
  const { 
    proveedores, loading, fetchProveedores 
  } = useLogisticaStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [isProveedorModalOpen, setIsProveedorModalOpen] = useState(false);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  const filteredProveedores = proveedores.filter(p => 
    p.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ruc.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-black text-primary tracking-tight uppercase">Directorio de Proveedores</h1>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wide">Gestión centralizada de socios comerciales.</p>
        </div>
        
        <Button onClick={() => setIsProveedorModalOpen(true)} className="h-10 px-6 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Nuevo Proveedor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="Total Registrados" value={proveedores.length} icon={<Users className="w-4 h-4"/>} color="text-primary" bgColor="bg-primary/5" />
        <StatsCard label="Nuevos (Mes)" value={proveedores.length} icon={<Plus className="w-4 h-4"/>} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatsCard label="Con Órdenes Activas" value={new Set(proveedores.map(p => p.id)).size} icon={<Truck className="w-4 h-4"/>} color="text-blue-600" bgColor="bg-blue-50" />
        <StatsCard label="Zonas de Atención" value={new Set(proveedores.map(p => p.direccion?.split(',')[0])).size} icon={<MapPin className="w-4 h-4"/>} color="text-orange-600" bgColor="bg-orange-50" />
      </div>

      <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
        <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
                placeholder="Buscar por RUC o Razón Social..." 
                className="pl-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs shadow-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProveedores.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase text-[10px]">No se encontraron proveedores.</div>
            ) : (
                filteredProveedores.map(p => (
                    <Card key={p.id} className="border-slate-200 shadow-none hover:border-primary transition-all group overflow-hidden">
                        <CardContent className="p-0">
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="bg-primary/5 p-2.5 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Truck className="w-5 h-5 text-primary group-hover:text-white" />
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-black tracking-widest border-slate-200">RUC: {p.ruc}</Badge>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="font-black text-sm uppercase text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">{p.razonSocial}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                                        <Users className="w-3 h-3"/> {p.contacto || 'Contacto no registrado'}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                        <Phone className="w-3 h-3 text-primary/60"/> {p.telefono || '-'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 truncate">
                                        <Mail className="w-3 h-3 text-primary/60"/> {p.email || '-'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center">
                                <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[180px]">
                                    <MapPin className="w-3 h-3 inline mr-1"/> {p.direccion || 'Dirección no registrada'}
                                </p>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary hover:text-white rounded-lg">
                                    <ExternalLink className="w-3.5 h-3.5"/>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
      </div>

      <ProveedorForm isOpen={isProveedorModalOpen} onClose={() => setIsProveedorModalOpen(false)} />
    </div>
  );
}
