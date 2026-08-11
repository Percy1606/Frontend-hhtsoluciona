import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HH T Soluciona S.A.C. | Sistema de Gestión",
  description: "Sistema integral de CRM, Operaciones y Finanzas para HH T Soluciona S.A.C.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <style dangerouslySetInnerHTML={{ __html: `
          [data-sonner-toast] {
            opacity: 1 !important;
            transform: scale(1) !important;
          }
          [data-sonner-toast]:hover {
            opacity: 1 !important;
          }
          .sonner-loading-wrapper {
            display: none;
          }
          
          /* ========================================= */
          /* PRINT STYLES                              */
          /* ========================================= */
          @media print {
            body {
              background-color: white !important;
              color: black !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            /* Hide the sidebar explicitly during print */
            aside {
              display: none !important;
            }
            /* Reset the main content margin for print */
            main {
              margin-left: 0 !important;
              padding: 0 !important;
            }
            /* Remove shadows, fixed positions and borders for a cleaner print */
            .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl {
              box-shadow: none !important;
            }
            .border {
              border-color: #e2e8f0 !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />
        <Toaster 
          position="top-right" 
          closeButton
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: 'w-full flex items-start gap-4 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-4 min-w-[380px] border border-white/20 animate-in slide-in-from-right-5 duration-300 opacity-100 bg-opacity-100',
              title: 'text-[14px] font-black uppercase tracking-tight leading-none mb-1',
              description: 'text-[12px] font-bold leading-snug opacity-100',
              success: 'bg-[#059669] text-white',
              error: 'bg-[#dc2626] text-white',
              warning: 'bg-[#f59e0b] text-[#0f172a]',
              info: 'bg-[#2563eb] text-white',
            }
          }}
        />
      </body>
    </html>
  );
}
