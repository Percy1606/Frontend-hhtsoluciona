"use client";

import { 
  FileText, 
  Download, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  Info,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const sections = [
  {
    title: "Primeros Pasos",
    icon: BookOpen,
    content: "Bienvenido al sistema de gestión SOFTWARE HH. Este manual le ayudará a navegar y utilizar todas las funcionalidades disponibles.",
    steps: [
      "Inicie sesión con sus credenciales institucionales.",
      "Explore el dashboard para ver el resumen de operaciones.",
      "Utilice el menú lateral para acceder a cada módulo especializado."
    ]
  },
  {
    title: "Módulos de Operaciones",
    icon: CheckCircle2,
    content: "Gestione sus proyectos y actividades de manera eficiente.",
    steps: [
      "Creación de nuevos proyectos y asignación de responsables.",
      "Seguimiento de actividades en tiempo real.",
      "Validaciones de campo y reportes diarios."
    ]
  },
  {
    title: "CRM y Ventas",
    icon: HelpCircle,
    content: "Administre su base de clientes y oportunidades comerciales.",
    steps: [
      "Registro de clientes y contactos.",
      "Proceso de ventas y seguimiento de cotizaciones.",
      "Informes de rendimiento comercial."
    ]
  }
];

export default function ManualPage() {
  const handleDownload = () => {
    // In a real app, this would be a link to a static PDF file
    alert("Iniciando descarga del Manual de Usuario (PDF)...");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#001F3F]/10 text-[#001F3F] mb-2">
          <FileText className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#001F3F]">Manual del Usuario</h1>
        <p className="text-xl text-muted-foreground">Guía completa para el uso del sistema SOFTWARE HH</p>
      </div>

      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertTitle className="font-bold">Información Importante</AlertTitle>
        <AlertDescription>
          Este manual se actualiza periódicamente con cada nueva funcionalidad. Asegúrese de revisar la versión más reciente.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {sections.map((section, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="p-2 rounded-lg bg-slate-100 text-[#001F3F]">
                <section.icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <CardDescription>{section.content}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {section.steps.map((step, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <ChevronRight className="h-4 w-4 text-[#003087] mt-0.5 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-6">
        <Button 
          size="lg" 
          className="bg-[#001F3F] hover:bg-[#003087] px-8 py-6 text-lg h-auto shadow-lg"
          onClick={handleDownload}
        >
          <Download className="mr-3 h-6 w-6" />
          Descargar Manual Completo (PDF)
        </Button>
      </div>

      <footer className="text-center text-sm text-muted-foreground pt-12">
        <p>© 2026 HH T-SOLUCIONA S.A.C. - Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
