"use client";

import { useRef, useState } from "react";
import { 
  FileText, 
  Download, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  Info,
  ChevronRight,
  ChevronDown,
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
      "Autenticación y Login: Ingrese sus credenciales únicas (Usuario y Contraseña) en la pantalla de inicio provista por su administrador.",
      "Seguridad de la Sesión: El sistema cuenta con cierre de sesión automático tras inactividad para garantizar la protección de la información de la empresa.",
      "Navegación Principal: Utilice el menú lateral izquierdo para acceder rápidamente a los módulos asignados a su perfil de usuario.",
      "Dashboard Ejecutivo: Pantalla de inicio con KPI's críticos en tiempo real, alertas de sistema, estados de proyectos y resumen de actividades recientes.",
      "Perfil de Usuario: Puede actualizar sus datos personales, cambiar su contraseña y ajustar preferencias visuales desde la esquina superior derecha."
    ]
  },
  {
    title: "Módulo CRM Comercial (Ventas)",
    icon: Users,
    content: "Gestión integral de clientes, prospectos y control exhaustivo del embudo de ventas.",
    steps: [
      "Mantenimiento de Cartera: Registre y actualice perfiles de clientes detallados (RUC, Razón Social, Zona, Tarifario MT1-MT4, Contactos clave).",
      "Gestión del Pipeline Comercial: Visualice y mueva oportunidades a través de etapas personalizadas (Prospecto, Contactado, Propuesta, Negociación, Cierre Ganado/Perdido).",
      "Bitácora de Interacciones: Registre cada punto de contacto (llamadas, reuniones, correos) para mantener un historial completo y evitar pérdida de información.",
      "Módulo de Cotizaciones: Genere propuestas económicas profesionales en formato PDF, con cálculo automático de impuestos y descuentos, vinculadas al cliente.",
      "Análisis de Conversión: Monitoree indicadores de rendimiento comercial, volumen de ventas proyectadas y efectividad del equipo de ventas."
    ]
  },
  {
    title: "Operaciones y Proyectos",
    icon: Briefcase,
    content: "El motor de ejecución técnica, planificación y seguimiento de HH T-SOLUCIONA.",
    steps: [
      "Creación de Proyectos: Estructure nuevos proyectos definiendo alcances, presupuesto inicial, Responsable Principal (Jefe de Proyecto) y equipo asignado.",
      "Cronograma y Gantt (Timeline): Visualice de forma gráfica el avance temporal de las fases del proyecto, identificando cuellos de botella y dependencias.",
      "Gestión de Tareas y Actividades: Desglose el trabajo en tareas específicas, asignando responsables y controlando estados (Pendiente, En Progreso, Observado, Completado).",
      "Control de Calidad y Validaciones: Implemente flujos de aprobación obligatorios y checklist de hitos técnicos para garantizar los estándares de calidad en campo.",
      "Centro de Notificaciones: Los técnicos e ingenieros reciben alertas directas sobre nuevas asignaciones, fechas de vencimiento y cambios en los requerimientos."
    ]
  },
  {
    title: "Logística y Almacén",
    icon: Truck,
    content: "Administración eficiente de inventario, trazabilidad de activos y cadena de suministro.",
    steps: [
      "Control de Inventario en Tiempo Real: Monitoree el stock disponible de materiales, insumos, EPPs y ubicación de herramientas o equipos pesados.",
      "Gestión de Órdenes de Compra (OC): Genere, apruebe y envíe solicitudes de compra a proveedores, vinculando los costos directamente a proyectos específicos.",
      "Kardex Digital Avanzado: Registre cada movimiento (entrada, salida, transferencia, merma) con fecha exacta, responsable y sustento del movimiento.",
      "Gestión de Proveedores: Mantenga un directorio actualizado, evaluando tiempos de respuesta, calidad y condiciones crediticias.",
      "Alertas de Stock Mínimo: El sistema notificará automáticamente cuando un material crítico alcance su punto de reposición."
    ]
  },
  {
    title: "Finanzas e Ingresos",
    icon: BarChart3,
    content: "Transparencia económica, facturación y control de flujos de caja operativos.",
    steps: [
      "Emisión y Control de Facturas: Registre comprobantes de pago emitidos, controlando fechas de vencimiento y vinculándolos al progreso de los proyectos.",
      "Gestión de Cuentas por Cobrar: Realice seguimiento a saldos pendientes de clientes, enviando recordatorios y registrando pagos parciales o totales.",
      "Control de Gastos (Egresos): Registre facturas de proveedores y comprobantes de caja chica para calcular la rentabilidad real y márgenes de cada proyecto.",
      "Reportes y Dashboards Financieros: Analice gráficos dinámicos de ingresos vs egresos, flujo de caja proyectado y estados de resultados por centro de costo.",
      "Conciliación Básica: Cruce la información de pagos registrados en sistema con los abonos reales en cuentas bancarias."
    ]
  },
  {
    title: "Configuración y Auditoría",
    icon: Settings,
    content: "Administración global del sistema, gestión de seguridad y personalización avanzada.",
    steps: [
      "Gestión de Usuarios y Roles: Cree cuentas de acceso y asigne roles con permisos granulares (lectura, escritura, eliminación) por cada módulo.",
      "Parametrización del Sistema: Ajuste variables globales como tipo de cambio, correlativos de documentos, impuestos y datos de la empresa.",
      "Mantenimiento de Catálogos: Gestione listas desplegables (categorías, zonas, marcas, unidades de medida) que alimentan todos los formularios.",
      "Log de Auditoría Inmutable: Consulte el registro detallado de transacciones (quién, qué, cuándo, desde qué IP) para rastrear cambios críticos o eliminaciones.",
      "Copias de Seguridad (Backups): Programe y monitoree los respaldos automáticos de la base de datos para garantizar la continuidad del negocio."
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
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleDownload = async () => {
    if (typeof window === 'undefined') return;

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

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

    try {
      // Forzar a expandir todo antes de exportar
      const allIds = sections.map((_, i) => i);
      setExpandedSections(allIds);

      // Pequeño delay para dejar que React renderice las secciones expandidas
      await new Promise(r => setTimeout(r, 500));

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
    } catch (error) {
      console.error("Error loading html2pdf module:", error);
    }
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
            {sections.map((section, idx) => {
              const isExpanded = expandedSections.includes(idx);
              return (
                <div key={idx} className="border-none shadow-xl bg-white rounded-3xl overflow-hidden hover:scale-[1.01] transition-all duration-300">
                    <div 
                      className="flex flex-row items-center justify-between gap-5 p-8 pb-4 cursor-pointer select-none"
                      onClick={() => toggleSection(idx)}
                    >
                        <div className="flex flex-row items-center gap-5">
                            <div className="p-4 rounded-2xl bg-[#F8FAFC] text-[#001F3F] shadow-inner">
                                <section.icon className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[#001F3F] uppercase tracking-tight">{section.title}</h3>
                                <p className="text-[#64748B] font-medium text-sm mt-1">{section.content}</p>
                            </div>
                        </div>
                        <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F1F5F9] transition-colors">
                            <ChevronDown className={`w-6 h-6 text-[#001F3F] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                    {isExpanded && (
                      <div className="p-8 pt-0 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="h-px bg-[#F1F5F9] mb-6" />
                      <ul className="space-y-4">
                          {section.steps.map((step, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-4 group">
                              <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#E306131A] text-[#E30613] group-hover:bg-[#E30613] group-hover:text-white transition-colors duration-300">
                                  <ChevronRight className="h-3 w-3 shrink-0" />
                              </div>
                              <span className="text-[#475569] text-sm font-semibold leading-relaxed group-hover:text-[#001F3F] transition-colors">{step}</span>
                          </li>
                          ))}
                      </ul>
                      </div>
                    )}
                </div>
              );
            })}
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
