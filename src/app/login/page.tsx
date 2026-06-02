"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Lock, User } from "lucide-react";

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
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
//import logo from "@/img/hh_t_soluciona_per_oficial_logo.jpg";

const loginSchema = z.object({
  username: z.string().min(2, {
    message: "El usuario debe tener al menos 2 caracteres.",
  }),
  password: z.string().min(3, {
    message: "La contraseña debe tener al menos 3 caracteres.",
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.message || "Error al iniciar sesión. Verifique sus credenciales.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="space-y-4 flex flex-col items-center">
          <div className="relative h-20 w-48 mb-2">
            <Image
              src="/hh_t_soluciona_per_oficial_logo.jpg"
              alt="HH T-SOLUCIONA Logo"
              fill
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-[#001F3F] text-center">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Credenciales de Acceso al Sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#001F3F] font-semibold">Usuario</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Ingrese su usuario"
                          className="pl-10 focus-visible:ring-[#003087]"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#001F3F] font-semibold">Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="password"
                          placeholder="••••••"
                          className="pl-10 focus-visible:ring-[#003087]"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#001F3F] hover:bg-[#003087] text-white font-bold h-11 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 pb-8">
          <p className="text-xs text-center text-gray-400">
            &copy; 2026 HH T-SOLUCIONA S.A.C. Todos los derechos reservados.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
