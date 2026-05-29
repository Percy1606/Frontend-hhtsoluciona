"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function CRMHeader({ title, subtitle }: { title: string, subtitle: string }) {
  return (
    <div className="space-y-2 mb-8">
      <h1 className="text-3xl font-black text-primary tracking-tight uppercase leading-none">{title}</h1>
      <p className="text-muted-foreground font-medium">{subtitle}</p>
      <div className="h-1 w-20 bg-accent rounded-full mt-4" />
    </div>
  );
}
