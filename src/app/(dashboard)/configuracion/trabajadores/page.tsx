"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Briefcase, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MoreVertical,
  Loader2,
  Check,
  X,
  Palette,
  ShieldCheck,
  User,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/store/auth-store";

const workerSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  area: z.string().min(1, "El área es obligatoria"),
  cargo: z.string().min(2, "El cargo es obligatorio"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional().or(z.literal("")),
  color: z.string().min(1, "El color es obligatorio"),
});

interface Worker {
  id: string;
  nombre: string;
  area: string;
  cargo: string;
  email: string | null;
  telefono: string | null;
  color: string;
  activo: boolean;
}

const areaColors: Record<string, string> = {
  LogisticaYRecursos: "bg-blue-100 text-blue-700 border-blue-200",
  IngenieriaYSupervision: "bg-emerald-100 text-emerald-700 border-emerald-200",
  GestionDocumentaria: "bg-amber-100 text-amber-700 border-amber-200",
  OperacionesDeCampo: "bg-purple-100 text-purple-700 border-purple-200",
};

const predefinedColors = [
  { name: "Navy", value: "bg-[#001F3F]" },
  { name: "Blue", value: "bg-[#003087]" },
  { name: "Emerald", value: "bg-emerald-600" },
  { name: "Amber", value: "bg-amber-600" },
  { name: "Rose", value: "bg-rose-600" },
  { name: "Purple", value: "bg-purple-600" },
  { name: "Slate", value: "bg-slate-600" },
];

// Main Component
export default function TrabajadoresPage() {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.rol === "ADMIN";

  if (isAdmin) {
    return <AdminTrabajadoresView />;
  } else {
    return <UserTrabajadorView />;
  }
}

// View for Standard Users
function UserTrabajadorView() {
  const [profile, setProfile] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/config/trabajadores/me');
      setProfile(data);
    } catch (e: any) {
      console.error("Failed to fetch user profile:", e);
      setError("No tienes un perfil de trabajador asignado. Por favor, contacta a un administrador para que te cree uno.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  const handleOpenModal = () => {
    if(profile) {
      setIsModalOpen(true);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#001F3F] flex items-center gap-3">
            <User className="h-8 w-8 text-[#003087]" />
            Mi Perfil de Trabajador
          </h1>
          <p className="text-muted-foreground mt-1">Consulta y actualiza tu información profesional.</p>
        </div>
      </div>
      
      {loading && (
        <div className="flex h-60 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#001F3F]" />
            <p className="text-sm text-muted-foreground animate-pulse">Cargando tu perfil...</p>
          </div>
        </div>
      )}

      {error && !loading && (
         <Card className="border-amber-200 bg-amber-50/50 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-4">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
            <div>
              <CardTitle className="text-amber-900">Perfil no encontrado</CardTitle>
              <CardDescription className="text-amber-800/80">{error}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {profile && !loading && (
        <>
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex-row flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-sm ${profile.color}`}>
                  {profile.nombre.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{profile.nombre}</h2>
                  <p className="font-medium text-muted-foreground uppercase tracking-tight">{profile.cargo}</p>
                </div>
              </div>
              <Button onClick={handleOpenModal} className="bg-[#001F3F] hover:bg-[#003087] rounded-xl h-11 px-6 transition-all shadow-md">
                <Edit2 className="mr-2 h-5 w-5" />
                Editar Perfil
              </Button>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-500 text-sm">Área Operativa</h4>
                <Badge className={`${areaColors[profile.area] || "bg-slate-100 text-slate-700"} border shadow-none px-3 py-1 rounded-lg font-medium text-base`}>
                  {profile.area.replace(/([A-Z])/g, ' $1').trim()}
                </Badge>
              </div>
               <div className="space-y-2">
                <h4 className="font-semibold text-slate-500 text-sm">Estado</h4>
                 <Badge 
                    className={profile.activo 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 px-3 py-1 rounded-full flex items-center w-fit gap-1 text-base" 
                      : "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50 px-3 py-1 rounded-full flex items-center w-fit gap-1 text-base"
                    }
                  >
                    {profile.activo ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {profile.activo ? "Activo" : "Baja"}
                  </Badge>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-500 text-sm">Correo Institucional</h4>
                 <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="h-4 w-4 text-[#003087]" />
                    {profile.email || "Sin correo"}
                  </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-500 text-sm">Teléfono</h4>
                 <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-4 w-4 text-[#003087]" />
                    {profile.telefono || "Sin teléfono"}
                  </div>
              </div>
            </CardContent>
          </Card>
          
          {isModalOpen && <TrabajadorModal editingWorker={profile} isOpen={isModalOpen} setIsOpen={setIsModalOpen} onFinished={fetchProfile} />}

        </>
      )}
    </div>
  )
}

// View for Admins
function AdminTrabajadoresView() {
  const { user: currentUser } = useAuthStore();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get("/config/trabajadores");
      setWorkers(data || []);
    } catch (error) {
      console.error("Error fetching workers:", error);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleOpenModal = (worker?: Worker) => {
    setEditingWorker(worker || null);
    setIsModalOpen(true);
  };

  const toggleWorkerStatus = async (worker: Worker) => {
    try {
      await api.patch(`/config/trabajadores/${worker.id}`, { activo: !worker.activo });
      fetchWorkers();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.cargo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#001F3F] flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-[#003087]" />
            Gestión de Personal
          </h1>
          <p className="text-muted-foreground mt-1">Administre el equipo, áreas operativas y cargos de la empresa.</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          className="bg-[#001F3F] hover:bg-[#003087] rounded-xl h-11 px-6 transition-all shadow-md"
        >
          <Plus className="mr-2 h-5 w-5" />
          Registrar Trabajador
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, cargo o área..." 
                className="pl-10 bg-white border-slate-200 rounded-xl focus:ring-[#003087]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#001F3F]" />
                <p className="text-sm text-muted-foreground animate-pulse">Cargando personal...</p>
              </div>
            </div>
          ) : (
            <>
              {/* VISTA MÓVIL */}
              <div className="block md:hidden space-y-4 p-4">
                {filteredWorkers.length === 0 ? (
                  <div className="text-center text-muted-foreground p-8">No se encontró personal registrado.</div>
                ) : (
                  filteredWorkers.map((worker) => (
                    <div key={worker.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative">
                      <div className="absolute top-4 right-4 flex items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-500 transition-all outline-none">
                            <MoreVertical className="h-5 w-5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-slate-100">
                            <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-50" onClick={() => handleOpenModal(worker)}>
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit2 className="h-4 w-4" /></div>
                              <div className="flex flex-col"><span className="font-semibold text-sm">Editar Perfil</span><span className="text-[10px] text-muted-foreground">Actualizar datos y contacto</span></div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="group flex items-center gap-3 p-3 rounded-lg cursor-pointer mt-1" onClick={() => toggleWorkerStatus(worker)}>
                              <div className={worker.activo ? "p-2 bg-rose-50 text-rose-600 rounded-lg" : "p-2 bg-emerald-50 text-emerald-600 rounded-lg"}>
                                {worker.activo ? <Trash2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                              </div>
                              <div className="flex flex-col text-left">
                                <span className={`font-semibold text-sm ${worker.activo ? "text-rose-600" : "text-emerald-600"}`}>{worker.activo ? "Dar de Baja" : "Reincorporar"}</span>
                                <span className="text-[10px] text-muted-foreground">{worker.activo ? "Cesará sus funciones" : "Habilitará al trabajador"}</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-3 pr-10">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm ${worker.color}`}>
                          {worker.nombre.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 leading-tight">{worker.nombre}</span>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">{worker.cargo}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="flex flex-col gap-2">
                          <Badge className={`${areaColors[worker.area] || "bg-slate-100 text-slate-700"} border shadow-none px-2 py-0.5 rounded-md font-medium text-[9px] w-fit uppercase`}>
                            {worker.area.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                          <Badge className={worker.activo ? "bg-emerald-50 text-emerald-700 border-emerald-100 px-2 py-0.5 rounded-md flex items-center w-fit gap-1 text-[9px]" : "bg-rose-50 text-rose-700 border-rose-100 px-2 py-0.5 rounded-md flex items-center w-fit gap-1 text-[9px]"}>
                            {worker.activo ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {worker.activo ? "Activo" : "Baja"}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px]">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="h-3 w-3 text-[#003087]" /> <span className="truncate">{worker.email || "Sin correo"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="h-3 w-3 text-[#003087]" /> {worker.telefono || "Sin teléfono"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* VISTA PC */}
              <div className="hidden md:block">
                <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-4 px-6">Trabajador</TableHead>
                  <TableHead>Área Operativa</TableHead>
                  <TableHead>Información de Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right px-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                      No se encontró personal registrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkers.map((worker) => (
                    <TableRow key={worker.id} className="group transition-colors hover:bg-slate-50/50 border-slate-50">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${worker.color}`}>
                            {worker.nombre.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{worker.nombre}</p>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">{worker.cargo}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${areaColors[worker.area] || "bg-slate-100 text-slate-700"} border shadow-none px-3 py-1 rounded-lg font-medium`}>
                          {worker.area.replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-[#003087]" />
                            {worker.email || "Sin correo"}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-[#003087]" />
                            {worker.telefono || "Sin teléfono"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={worker.activo 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 px-3 py-1 rounded-full flex items-center w-fit gap-1" 
                            : "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50 px-3 py-1 rounded-full flex items-center w-fit gap-1"
                          }
                        >
                          {worker.activo ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {worker.activo ? "Activo" : "Baja"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-9 w-9 inline-flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 text-slate-500 transition-all outline-none cursor-pointer">
                            <MoreVertical className="h-5 w-5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-slate-100">
                            <DropdownMenuItem 
                              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                              onClick={() => handleOpenModal(worker)}
                            >
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Edit2 className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm">Editar Perfil</span>
                                <span className="text-[10px] text-muted-foreground">Actualizar datos y contacto</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="group flex items-center gap-3 p-3 rounded-lg cursor-pointer focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors mt-1"
                                onClick={() => toggleWorkerStatus(worker)}
                              >
                                <div className={worker.activo ? "p-2 bg-rose-50 text-rose-600 group-data-[highlighted]:!bg-white/10 group-data-[highlighted]:!text-white rounded-lg" : "p-2 bg-emerald-50 text-emerald-600 group-data-[highlighted]:!bg-white/10 group-data-[highlighted]:!text-white rounded-lg"}>
                                  {worker.activo ? <Trash2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className={`font-semibold text-sm group-data-[highlighted]:!text-white ${worker.activo ? "text-rose-600" : "text-emerald-600"}`}>
                                    {worker.activo ? "Dar de Baja" : "Reincorporar"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground group-data-[highlighted]:!text-white/80">
                                    {worker.activo ? "Cesará sus funciones" : "Habilitará al trabajador"}
                                  </span>
                                </div>
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {isModalOpen && <TrabajadorModal editingWorker={editingWorker} isOpen={isModalOpen} setIsOpen={setIsModalOpen} onFinished={fetchWorkers} />}
    </div>
  );
}

// Reusable Modal Component
interface ModalProps {
  editingWorker: Worker | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onFinished: () => void;
}

function TrabajadorModal({ editingWorker, isOpen, setIsOpen, onFinished }: ModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof workerSchema>>({
    resolver: zodResolver(workerSchema),
  });

  useEffect(() => {
    if (editingWorker) {
      form.reset({
        nombre: editingWorker.nombre,
        area: editingWorker.area,
        cargo: editingWorker.cargo,
        email: editingWorker.email || "",
        telefono: editingWorker.telefono || "",
        color: editingWorker.color,
      });
    } else {
      form.reset({
        nombre: "",
        area: "LogisticaYRecursos",
        cargo: "",
        email: "",
        telefono: "",
        color: "bg-[#003087]",
      });
    }
  }, [editingWorker, form]);


  const onSubmit = async (values: z.infer<typeof workerSchema>) => {
    try {
      setIsSubmitting(true);
      if (editingWorker) {
        await api.patch(`/config/trabajadores/${editingWorker.id}`, values);
      } else {
        await api.post("/config/trabajadores", values);
      }
      setIsOpen(false);
      onFinished(); // Refresh data
    } catch (error) {
      console.error("Error saving worker:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-[#001F3F] to-[#003087] p-6 text-white">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            {editingWorker ? <Edit2 className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            {editingWorker ? "Editar Perfil" : "Registrar Trabajador"}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm mt-1">
            {editingWorker 
              ? "Actualice la información profesional y de contacto." 
              : "Ingrese los datos del nuevo integrante del equipo HH T-SOLUCIONA."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-6 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="font-bold text-slate-700">Nombre Completo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Ej. Pedro Sullón" className="pl-10 rounded-xl" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">Área de Trabajo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl w-full">
                          <SelectValue placeholder="Seleccionar área" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LogisticaYRecursos">Logística y Recursos</SelectItem>
                        <SelectItem value="IngenieriaYSupervision">Ingeniería y Supervisión</SelectItem>
                        <SelectItem value="GestionDocumentaria">Gestión Documentaria</SelectItem>
                        <SelectItem value="OperacionesDeCampo">Operaciones de Campo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">Cargo / Función</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Ej. Residente" className="pl-10 rounded-xl" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">Correo Institucional</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="correo@hh.com" className="pl-10 rounded-xl" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">Teléfono</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="999 999 999" className="pl-10 rounded-xl" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-slate-700 flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Color Distintivo
                  </FormLabel>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => field.onChange(color.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${field.value === color.value ? "border-slate-800 scale-110 shadow-md" : "border-transparent"} ${color.value}`}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 border-t border-slate-50 bg-slate-50/50 -mx-6 -mb-6 px-6 pb-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="rounded-xl border-slate-200"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#001F3F] hover:bg-[#003087] rounded-xl px-8 shadow-lg transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                   editingWorker ? "Guardar Cambios" : "Crear Trabajador"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
