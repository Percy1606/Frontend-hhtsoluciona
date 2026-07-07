"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Lock, User, Eye, EyeOff, ShieldCheck, Mail, Phone, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

const loginSchema = z.object({
  username: z.string().min(2, {
    message: "El usuario debe tener al menos 2 caracteres.",
  }),
  password: z.string().min(3, {
    message: "La contraseña debe tener al menos 3 caracteres.",
  }),
});

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams?.get('expired') === 'true';
  const { setAuth, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", values);
      setAuth(response.user, response.access_token);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas. Verifique e intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 lg:bg-white relative">
      {/* Fondo Móvil */}
      <div className="absolute inset-0 lg:hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#001F3F] via-[#001F3F]/95 to-[#003087]/90 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop"
          alt="Background"
          fill
          className="object-cover opacity-30 grayscale"
          priority
        />
      </div>

      {/* Lado Izquierdo: Branding e Imagen (Oculto en móvil) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#001F3F] items-center justify-center overflow-hidden">
        {/* Fondo con Overlay y Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#001F3F] via-[#001F3F]/90 to-[#003087]/80 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop"
          alt="Engineering Background"
          fill
          className="object-cover opacity-40 grayscale"
          priority
        />
        
        {/* Contenido Flotante */}
        <div className="relative z-20 px-12 text-center flex flex-col items-center">
            <div className="bg-white p-6 rounded-3xl shadow-2xl mb-8 transform transition-transform hover:scale-105 duration-500">
                <Image
                    src="/hh_t_soluciona_per_oficial_logo.jpg"
                    alt="HH T-SOLUCIONA Logo"
                    width={200}
                    height={80}
                    className="object-contain"
                />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">
                Potenciando la Ingeniería <br/> del Futuro
            </h2>
            <div className="h-1 w-20 bg-accent mb-6 rounded-full" />
            <p className="text-blue-100/70 max-w-md font-medium text-lg italic">
                "Soluciones integrales en ingeniería eléctrica, civil y mantenimiento industrial con los más altos estándares de calidad."
            </p>
        </div>

        {/* Decoración Inferior */}
        <div className="absolute bottom-10 left-10 z-20 flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>Sistema de Gestión Centralizado v2.0</span>
        </div>
      </div>

      {/* Lado Derecho: Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative z-20 lg:bg-slate-50/30">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            {/* Logo solo para móvil */}
            <div className="lg:hidden flex justify-center mb-6">
                <div className="bg-white p-6 rounded-3xl shadow-2xl">
                    <Image
                        src="/hh_t_soluciona_per_oficial_logo.jpg"
                        alt="HH T-SOLUCIONA Logo"
                        width={180}
                        height={70}
                        className="object-contain"
                    />
                </div>
            </div>
            
            {isExpired ? (
              <div className="mb-6 bg-red-50/80 border border-red-200 rounded-2xl p-4 flex gap-3 text-left items-start shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-red-500 text-white rounded-full p-1.5 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase text-red-600 tracking-widest mb-0.5">Control de Seguridad</h3>
                  <p className="text-sm font-medium text-red-900 leading-tight">
                    Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente.
                  </p>
                </div>
              </div>
            ) : null}

            <h1 className="text-3xl font-black text-white lg:text-[#001F3F] tracking-tight uppercase drop-shadow-md lg:drop-shadow-none">Bienvenido al Sistema</h1>
            <p className="text-blue-100 lg:text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 flex items-center justify-center lg:justify-start gap-2 drop-shadow-md lg:drop-shadow-none">
                <Lock className="w-3 h-3" /> Ingrese sus credenciales para continuar
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-2xl lg:shadow-xl lg:shadow-slate-200/60 border-none lg:border lg:border-slate-100">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black uppercase text-[#001F3F] tracking-widest ml-1">Usuario</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#001F3F] transition-colors" />
                          <Input
                            placeholder="Ej: jperalta"
                            className="pl-12 h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-100/50 font-bold text-xs rounded-xl transition-all shadow-none"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <div className="flex justify-between items-end pr-1">
                        <FormLabel className="text-[10px] font-black uppercase text-[#001F3F] tracking-widest ml-1">Contraseña</FormLabel>
                        <button 
                            type="button" 
                            onClick={() => setIsForgotModalOpen(true)}
                            className="text-[9px] font-black text-slate-400 hover:text-[#001F3F] uppercase tracking-tighter"
                        >
                            ¿Olvidó su clave?
                        </button>
                      </div>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#001F3F] transition-colors" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-12 pr-12 h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-100/50 font-bold text-xs rounded-xl transition-all shadow-none"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="rounded-xl bg-red-50 p-4 text-[10px] font-black uppercase tracking-tight text-red-600 border border-red-100 flex items-center gap-3">
                    <div className="bg-red-600 p-1 rounded-md"><AlertCircle className="w-3 h-3 text-white" /></div>
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-[#001F3F] hover:bg-[#003087] text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validando Acceso...
                      </>
                    ) : (
                      "Entrar al Sistema"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <p className="text-[10px] text-center text-blue-200 lg:text-slate-400 font-bold uppercase tracking-[0.15em] pt-4 drop-shadow-md lg:drop-shadow-none">
            &copy; 2026 HH T-SOLUCIONA S.A.C. <br/>
            <span className="text-[9px] opacity-60">Infraestructura Crítica & Seguridad</span>
          </p>
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
        <DialogContent className="max-w-md p-0 border-none bg-white overflow-hidden rounded-3xl shadow-2xl">
          <DialogHeader className="p-8 bg-[#001F3F] text-white shrink-0">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3 uppercase">
              <ShieldCheck className="w-6 h-6 text-accent" />
              Recuperar Acceso
            </DialogTitle>
            <DialogDescription className="text-blue-100/60 font-bold text-xs uppercase tracking-widest mt-1 text-left">
                Protocolo de Seguridad Corporativa
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    Por su seguridad, para restablecer sus credenciales es indispensable verificar su identidad. Por favor, póngase en contacto con soporte y tenga a la mano una fotografía de su DNI o Fotocheck vigente para completar el proceso.
                </p>
                <p className="text-xs text-slate-400 font-bold italic">
                    "Garantizamos la integridad de su información mediante procesos de validación directa."
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <Button 
                    className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-emerald-200/50 gap-3"
                    onClick={() => window.open('https://wa.me/51948553419?text=Hola,%20necesito%20restablecer%20mi%20contraseña.%20Adjunto%20mi%20evidencia%20de%20identidad.', '_blank')}
                >
                    <Phone className="w-4 h-4" /> Contactar por WhatsApp
                </Button>
                <Button 
                    variant="outline"
                    className="h-12 border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-50 gap-3"
                    onClick={() => {
                        const email = 'soportehhtsoluciona@gmail.com';
                        const subject = 'Restablecimiento de Contraseña - Sistema HH';
                        const body = 'Hola Soporte de HH T-SOLUCIONA,\n\nSolicito el restablecimiento de mi contraseña de acceso al sistema.\n\nMis datos son:\n- Nombre Completo: [ESCRIBA AQUÍ]\n- Usuario del Sistema: [ESCRIBA AQUÍ]\n- Área / Cargo: [ESCRIBA AQUÍ]\n\nADJUNTO EVIDENCIA: [POR FAVOR, ADJUNTE AQUÍ FOTO DE DNI O FOTOCHECK]\n\nMuchas gracias.';
                        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                        window.open(gmailUrl, '_blank');
                    }}
                >
                    <Mail className="w-4 h-4 text-primary" /> Enviar Correo via Gmail
                </Button>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button 
                variant="ghost" 
                onClick={() => setIsForgotModalOpen(false)}
                className="w-full h-10 font-black uppercase text-[10px] tracking-widest text-slate-400"
            >
                Entendido, cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#001F3F]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
