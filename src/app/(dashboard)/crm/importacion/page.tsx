"use client";

import { ExcelImporter } from "@/components/crm/excel-importer";
import { WordImporter } from "@/components/crm/word-importer";
import { CRMHeader } from "@/components/crm/crm-header";
import { FileSpreadsheet, FileText, Users, Calculator } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ImportacionPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <CRMHeader 
        title="Módulo de Importación" 
        subtitle="Carga y actualización de datos masivos (Clientes y Proformas)." 
      />

      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="bg-white p-1 border border-border rounded-xl">
          <TabsTrigger value="clients" className="gap-2 px-6 font-black text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
            <Users className="w-4 h-4" /> Base de Clientes (Excel)
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-2 px-6 font-black text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
            <FileText className="w-4 h-4" /> Proformas / Word
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <div className="bg-white p-12 rounded-2xl border border-border shadow-sm text-center max-w-3xl mx-auto space-y-6">
            <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Importar Clientes</h2>
              <p className="text-muted-foreground text-sm font-medium">
                Sube tus archivos de Excel con el formato de BASE CRM o MT4 ANGIE. 
                El sistema mapeará automáticamente los campos comerciales.
              </p>
            </div>
            <div className="pt-4">
              <ExcelImporter onImportComplete={() => router.push("/crm/cartera")} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quotes">
          <div className="bg-white p-12 rounded-2xl border border-border shadow-sm text-center max-w-3xl mx-auto space-y-6">
            <div className="bg-accent/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-10 h-10 text-accent" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Importar Proformas (Word)</h2>
              <p className="text-muted-foreground text-sm font-medium">
                Sube tus documentos Word (.docx). El sistema extraerá automáticamente 
                el cliente, contacto y montos para que puedas editarlos en Cotizaciones.
              </p>
            </div>
            <div className="pt-4 text-left">
              <WordImporter onImportComplete={() => router.push("/crm/cotizaciones")} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
