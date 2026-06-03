import { cn } from "@/lib/utils";
import React from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export function StatsCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: StatsCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-border shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <div className={cn("w-5 h-5", color)}>{icon}</div>
        </div>
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase">{label}</p>
          <p className={cn("text-2xl font-black", color)}>{value}</p>
        </div>
      </div>
    </div>
  );
}
