import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
}

export default function StatCard({ title, value, subtitle, icon: Icon, variant = "default" }: StatCardProps) {
  return (
    <div className={cn("glass rounded-xl p-5 transition-all hover:border-muted-foreground/20", variant === "success" && "glow-green", variant === "danger" && "glow-red")}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("rounded-lg p-2", variant === "success" ? "bg-primary/10 text-primary" : variant === "danger" ? "bg-destructive/10 text-destructive" : variant === "warning" ? "bg-warning/10 text-warning" : "bg-accent text-muted-foreground")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
