"use client";

import { useRef } from "react";
import { 
  FileText, 
  Download, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  Info,
  ChevronRight,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const sections = [
  {
    title: "Primeros Pasos y Acceso",
    icon: BookOpen,
    content: "Conceptos fundamentales para iniciar su jornada en el ecosistema SOFTWARE HH.",
    steps: [
      "Autenticación: Inicie sesión con su Usuario y Contraseña asignados por el administrador.",
      "Seguridad: Su sesión expirará automáticamente tras un periodo de inactividad por protección de datos.",
      "Interfaz: El menú lateral izquierdo es su centro de navegación principal.",
      "Dashboard: Visualice KPI's críticos, estados de proyectos y alertas recientes al ingresar."
    ]
  },
  {
    title: "Módulo CRM Comercial (Ventas)",
    icon: Users,
    content: "Potencie la gestión de sus clientes y el embudo de ventas.",
    steps: [
      "Cartera de Clientes: Registre prospectos con RUC, empresa, zona y tarifa específica (MT1-MT4).",
      "Pipeline Comercial: Mueva sus oportunidades a través de etapas (Contactado, Propuesta, Negociación, Ganado).",
      "Seguimiento: Registre cada interacción (llamada, reunión, correo) para mantener el historial vivo.",
      "Cotizaciones: Genere documentos PDF profesionales vinculados directamente a la ficha del cliente.",
      "Estadísticas: Analice la tasa de conversión y el volumen de ventas proyectadas."
    ]
  },
  {
    title: "Operaciones y Proyectos",
    icon: Briefcase,
    content: "El motor de ejecución técnica de HH T-SOLUCIONA.",
    steps: [
      "Gestión de Proyectos: Cree proyectos asignando un Responsable Principal y personal de apoyo.",
      "Cronograma (Timeline): Visualice el avance temporal de cada fase del proyecto.",
      "Actividades Técnicas: Desglose el proyecto en tareas específicas con estados Pendiente, En Progreso y Completada.",
      "Validaciones de Campo: Asegure la calidad mediante la aprobación obligatoria de hitos técnicos.",
      "Bandeja de Entrada: Los técnicos reciben notificaciones directas de sus asignaciones diarias."
    ]
  },
  {
    title: "Logística y Almacén",
    icon: Truck,
    content: "Control de inventario y cadena de suministro.",
    steps: [
      "Inventario: Monitoree el stock de insumos, herramientas y equipos en tiempo real.",
      "Órdenes de Compra (OC): Genere solicitudes de compra vinculadas a proyectos específicos.",
      "Kardex Digital: Rastree cada entrada y salida de material con fecha, responsable y motivo.",
      "Proveedores: Mantenga un directorio actualizado de sus aliados logísticos."
    ]
  },
  {
    title: "Finanzas e Ingresos",
    icon: BarChart3,
    content: "Transparencia económica y control de flujos.",
    steps: [
      "Facturación: Registre facturas emitidas (Ingresos) vinculándolas a proyectos y cotizaciones.",
      "Gestión de Gastos: Controle los costos operativos (Egresos) para calcular la rentabilidad real.",
      "Reportes Financieros: Gráficos de ingresos vs egresos y saldos pendientes de cobro."
    ]
  },
  {
    title: "Configuración y Auditoría",
    icon: Settings,
    content: "Administración de usuarios y seguridad del sistema.",
    steps: [
      "Usuarios: Gestione quién accede a qué módulos mediante perfiles de permisos.",
      "Vinculación: Conecte cuentas de usuario con perfiles de trabajadores para reportes operativos.",
      "Auditoría del Sistema: Historial inmutable de quién hizo qué, cuándo y desde qué IP.",
      "Personalización: Ajuste de parámetros globales y mantenimiento de catálogos."
    ]
  }
];


interface Html2PdfOptions {
  margin?: number | [number, number] | [number, number, number, number];
  filename?: string;
  image?: { 
    type?: 'jpeg' | 'png' | 'webp'; 
    quality?: number;
  };
  enableLinks?: boolean;
  html2canvas?: {
    scale?: number;
    useCORS?: boolean;
    letterRendering?: boolean;
    allowTaint?: boolean;
    logging?: boolean;
  };
  jsPDF?: {
    unit?: 'pt' | 'mm' | 'cm' | 'in';
    format?: string | [number, number];
    orientation?: 'portrait' | 'landscape';
    compress?: boolean;
    precision?: number;
  };
  pagebreak?: {
    mode?: 'avoid-all' | 'css' | 'legacy' | ('avoid-all' | 'css' | 'legacy')[];
    before?: string | string[];
    after?: string | string[];
    avoid?: string | string[];
  };
}

export default function ManualPage() {
  const manualRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (typeof window === 'undefined') return;

    // We need to import it dynamically inside the function too to be safe
    const html2pdf = (await import('html2pdf.js')).default;

    const element = manualRef.current;
    if (!element) return;

    const opt: Html2PdfOptions = {
      margin: 10,
      filename: `Manual_Usuario_SOFTWARE_HH_${new Date().getFullYear()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        logging: false,
        letterRendering: true,
        allowTaint: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use a clone or specific styles to ensure it looks good in PDF
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-[#001F3F] rounded-xl text-white">
                <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-[#001F3F]">Documentación Oficial</h1>
        </div>
        <Button 
          onClick={handleDownload}
          className="bg-[#E30613] hover:bg-[#E30613E6] text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-[#E3061333] transition-all"
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar Manual PDF
        </Button>
      </div>

      <Alert className="bg-[#EFF6FF] border-[#DBEAFE] border-2 rounded-2xl">
        <Info className="h-5 w-5 text-[#2563EB]" />
        <AlertTitle className="font-black text-[#1E40AF] uppercase text-xs tracking-wider">Centro de Ayuda</AlertTitle>
        <AlertDescription className="text-[#1E40AF] text-sm font-medium">
          Este manual interactivo contiene las guías de uso para todos los módulos del sistema HH T-SOLUCIONA. Puede consultarlo aquí o descargarlo para uso offline.
        </AlertDescription>
      </Alert>

      <div ref={manualRef} className="space-y-8 bg-[#FFFFFF80] p-2 rounded-3xl">
        {/* Header for PDF */}
        <div className="hidden pdf-only flex flex-col items-center justify-center p-12 border-b-2 border-[#F1F5F9] mb-8">
            <div className="flex items-center gap-4 mb-4">
                <Zap className="w-12 h-12 text-[#001F3F]" />
                <h1 className="text-4xl font-black text-[#001F3F]">SOFTWARE HH</h1>
            </div>
            <h2 className="text-2xl font-bold text-[#475569] uppercase tracking-widest">Manual de Usuario</h2>
            <p className="text-[#94A3B8] mt-2 font-mono">Versión 2026.1 - HH T-SOLUCIONA S.A.C.</p>
        </div>

        <div className="grid gap-6">
            {sections.map((section, idx) => (
            <Card key={idx} className="border-none shadow-xl bg-white rounded-3xl overflow-hidden hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="flex flex-row items-center gap-5 space-y-0 p-8 pb-4">
                <div className="p-4 rounded-2xl bg-[#F8FAFC] text-[#001F3F] shadow-inner">
                    <section.icon className="h-8 w-8" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-black text-[#001F3F] uppercase tracking-tight">{section.title}</CardTitle>
                    <CardDescription className="text-[#64748B] font-medium text-base">{section.content}</CardDescription>
                </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                <div className="h-px bg-[#F1F5F9] mb-6" />
                <ul className="space-y-4">
                    {section.steps.map((step, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-4 group">
                        <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#E306131A] text-[#E30613] group-hover:bg-[#E30613] group-hover:text-white transition-colors duration-300">
                            <ChevronRight className="h-3 w-3 shrink-0" />
                        </div>
                        <span className="text-[#475569] font-semibold leading-relaxed group-hover:text-[#001F3F] transition-colors">{step}</span>
                    </li>
                    ))}
                </ul>
                </CardContent>
            </Card>
            ))}
        </div>

        <div className="text-center p-8 mt-12 border-t border-[#F1F5F9]">
            <p className="text-xs font-black text-[#CBD5E1] uppercase tracking-[0.2em]">
                © 2026 HH T-SOLUCIONA S.A.C. - Confidencial
            </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
            .pdf-only { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
