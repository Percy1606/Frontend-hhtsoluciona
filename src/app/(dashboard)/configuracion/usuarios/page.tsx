"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit2, 
  UserX, 
  UserCheck, 
  Shield, 
  MoreVertical,
  Loader2,
  Check,
  X,
  User as UserIcon,
  Lock,
  Mail,
  Briefcase
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

const userSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
  nombre: z.string().min(2, "El nombre es obligatorio"),
  rol: z.string().min(1, "El rol es obligatorio"),
  responsableId: z.string().optional().nullable(),
  modulos: z.array(z.string()),
});

const AVAILABLE_MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "crm", label: "CRM Comercial" },
  { id: "operaciones", label: "Operaciones" },
  { id: "logistica", label: "Logística" },
  { id: "finanzas", label: "Finanzas" },
  { id: "configuracion", label: "Configuración" },
];

interface User {
  id: string;
  username: string;
  nombre: string;
  rol: string;
  activo: boolean;
  modulos: string[];
  responsableId?: string | null;
  responsable?: {
    id: string;
    nombre: string;
    area: string;
  };
}

interface Responsable {
  id: string;
  nombre: string;
  area: string;
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.rol === "ADMIN";

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      nombre: "",
      rol: "USER",
      responsableId: null,
      modulos: ["dashboard"],
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, workersData] = await Promise.all([
        api.get("/config/usuarios"),
        api.get("/operaciones/responsables")
      ]);
      setUsuarios(usersData);
      setResponsables(workersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      form.reset({
        username: user.username,
        password: "",
        nombre: user.nombre,
        rol: user.rol,
        responsableId: user.responsableId || null,
        modulos: Array.isArray(user.modulos) ? user.modulos : ["dashboard"],
      });
    } else {
      setEditingUser(null);
      form.reset({
        username: "",
        password: "",
        nombre: "",
        rol: "USER",
        responsableId: null,
        modulos: ["dashboard"],
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof userSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Filtrar el payload para no enviar campos inválidos
      const payload: any = { ...values };
      
      // Validar responsableId: si está vacío, enviar null para desvincular
      if (!payload.responsableId || payload.responsableId === "") {
        payload.responsableId = null;
      }
      
      if (editingUser) {
        if (!payload.password) delete payload.password;
        await api.patch(`/config/usuarios/${editingUser.id}`, payload);
        toast.success("Usuario actualizado correctamente");
      } else {
        await api.post("/config/usuarios", payload);
        toast.success("Usuario creado correctamente");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving user:", error);
      toast.error(error.message || "Error al guardar el usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      await api.patch(`/config/usuarios/${user.id}`, { activo: !user.activo });
      toast.success(`Usuario ${user.activo ? "desactivado" : "activado"} correctamente`);
      fetchData();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Error al cambiar el estado del usuario");
    }
  };

  const filteredUsuarios = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#001F3F] flex items-center gap-3">
            <Users className="h-8 w-8 text-[#003087]" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground mt-1">Administre las credenciales y niveles de acceso del personal.</p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => handleOpenModal()}
            className="bg-[#001F3F] hover:bg-[#003087] rounded-xl h-11 px-6 transition-all shadow-md"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o usuario..." 
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
                <p className="text-sm text-muted-foreground animate-pulse">Cargando usuarios...</p>
              </div>
            </div>
          ) : (
            <>
              {/* VISTA MÓVIL */}
              <div className="block md:hidden space-y-4 p-4">
                {filteredUsuarios.length === 0 ? (
                  <div className="text-center text-muted-foreground p-8">No se encontraron usuarios que coincidan con su búsqueda.</div>
                ) : (
                  filteredUsuarios.map((user) => (
                    <div key={user.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative">
                      <div className="absolute top-4 right-4 flex items-center">
                        {isAdmin ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-500 transition-all outline-none cursor-pointer">
                              <MoreVertical className="h-5 w-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-slate-100">
                              <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" onClick={() => handleOpenModal(user)}>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit2 className="h-4 w-4" /></div>
                                <div className="flex flex-col"><span className="font-semibold text-sm">Editar Datos</span></div>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer mt-1" onClick={() => toggleUserStatus(user)}>
                                <div className={user.activo ? "p-2 bg-rose-50 text-rose-600 rounded-lg" : "p-2 bg-emerald-50 text-emerald-600 rounded-lg"}>
                                  {user.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </div>
                                <div className="flex flex-col text-left"><span className={`font-semibold text-sm ${user.activo ? "text-rose-600" : "text-emerald-600"}`}>{user.activo ? "Desactivar" : "Activar"}</span></div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400">Lectura</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pr-10">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#001F3F] to-[#003087] flex items-center justify-center text-white font-bold shadow-sm">
                          {user.nombre.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{user.nombre}</span>
                          <span className="text-xs font-medium text-[#003087]">@{user.username}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-50 px-2 py-1 rounded-md w-fit">
                            <Shield className="h-3.5 w-3.5 text-slate-500" /> {user.rol}
                          </div>
                          <Badge className={user.activo ? "bg-emerald-50 text-emerald-700 border-emerald-100 px-2 py-0.5 rounded-md flex items-center w-fit gap-1 text-[9px]" : "bg-rose-50 text-rose-700 border-rose-100 px-2 py-0.5 rounded-md flex items-center w-fit gap-1 text-[9px]"}>
                            {user.activo ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {user.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-0.5 justify-center">
                          <span className="text-[11px] font-bold text-slate-700 truncate">{user.responsable?.nombre || "No vinculado"}</span>
                          {user.responsable && (
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">{user.responsable.area.replace(/([A-Z])/g, ' $1').trim()}</span>
                          )}
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
                  <TableHead className="py-4 px-6">Información Personal</TableHead>
                  <TableHead>Nivel de Acceso</TableHead>
                  <TableHead>Estado de Cuenta</TableHead>
                  <TableHead>Personal Vinculado</TableHead>
                  <TableHead className="text-right px-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                      No se encontraron usuarios que coincidan con su búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map((user) => (
                    <TableRow key={user.id} className="group transition-colors hover:bg-slate-50/50 border-slate-300 border-dashed">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#001F3F] to-[#003087] flex items-center justify-center text-white font-bold shadow-sm">
                            {user.nombre.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{user.nombre}</p>
                            <p className="text-xs font-medium text-[#003087]">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-100">
                            <Shield className="h-4 w-4 text-slate-600" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{user.rol}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={user.activo 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 px-3 py-1 rounded-full flex items-center w-fit gap-1" 
                            : "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50 px-3 py-1 rounded-full flex items-center w-fit gap-1"
                          }
                        >
                          {user.activo ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {user.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-slate-700">
                            {user.responsable?.nombre || "No vinculado"}
                          </span>
                          {user.responsable && (
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                              {user.responsable.area.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        {isAdmin ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-9 w-9 inline-flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 text-slate-500 transition-all outline-none cursor-pointer">
                              <MoreVertical className="h-5 w-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-slate-100">
                              <DropdownMenuItem 
                                className="group flex items-center gap-3 p-3 rounded-lg cursor-pointer focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors"
                                onClick={() => handleOpenModal(user)}
                              >
                                <div className="p-2 bg-blue-50 text-blue-600 group-data-[highlighted]:!bg-white/10 group-data-[highlighted]:!text-white rounded-lg">
                                  <Edit2 className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sm group-data-[highlighted]:!text-white">Editar Datos</span>
                                  <span className="text-[10px] text-muted-foreground group-data-[highlighted]:!text-white/80">Modificar perfil y acceso</span>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="group flex items-center gap-3 p-3 rounded-lg cursor-pointer focus:!bg-[#001F3F] focus:!text-white data-[highlighted]:!bg-[#001F3F] data-[highlighted]:!text-white transition-colors mt-1"
                                onClick={() => toggleUserStatus(user)}
                              >
                                <div className={user.activo ? "p-2 bg-rose-50 text-rose-600 group-data-[highlighted]:!bg-white/10 group-data-[highlighted]:!text-white rounded-lg" : "p-2 bg-emerald-50 text-emerald-600 group-data-[highlighted]:!bg-white/10 group-data-[highlighted]:!text-white rounded-lg"}>
                                  {user.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className={`font-semibold text-sm group-data-[highlighted]:!text-white ${user.activo ? "text-rose-600" : "text-emerald-600"}`}>
                                    {user.activo ? "Desactivar Acceso" : "Activar Acceso"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground group-data-[highlighted]:!text-white/80">
                                    {user.activo ? "Suspenderá el ingreso" : "Restaurará el ingreso"}
                                  </span>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400">Solo Lectura</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                ))}
              </TableBody>
            </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#001F3F] to-[#003087] p-6 text-white">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              {editingUser ? <Edit2 className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
              {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1">
              {editingUser 
                ? "Actualice la información de acceso y vinculación del usuario." 
                : "Complete los datos para habilitar una nueva cuenta en el sistema."}
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
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input placeholder="Ej. Juan Pérez" className="pl-10 rounded-xl" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Nombre de Usuario</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input placeholder="usuario" className="pl-10 rounded-xl" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Rol del Sistema</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl w-full">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                          <SelectItem value="USER">Usuario Estándar</SelectItem>
                          <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">
                      Contraseña {editingUser && <span className="text-xs font-normal text-muted-foreground">(Dejar en blanco para no cambiar)</span>}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input type="password" placeholder="••••••••" className="pl-10 rounded-xl" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsableId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700 text-sm">Vincular con Trabajador</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-xl w-full bg-white border-slate-200">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-slate-400" />
                            <SelectValue placeholder="Seleccione un trabajador (opcional)" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-slate-100 shadow-xl z-[100]">
                        <SelectItem value="" className="font-medium text-slate-500">Sin vincular</SelectItem>
                        {responsables.map((r) => (
                          <SelectItem key={r.id} value={r.id} className="cursor-pointer">
                            {r.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel className="font-bold text-slate-700">Acceso a Módulos</FormLabel>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {AVAILABLE_MODULES.map((module) => (
                    <FormField
                      key={module.id}
                      control={form.control}
                      name="modulos"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={module.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(module.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, module.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== module.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {module.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-slate-50 bg-slate-50/50 -mx-6 -mb-6 px-6 pb-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
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
                    "Guardar Usuario"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
