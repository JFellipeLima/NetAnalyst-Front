import { cn } from "@/lib/utils";
import { getStatusColor, getStatusCodeColor } from "@/lib/mock-data";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium capitalize", getStatusColor(status))}>
      <span className={cn("h-2 w-2 rounded-full", status === "healthy" ? "bg-primary" : status === "degraded" ? "bg-warning" : "bg-destructive")} />
      {status}
    </span>
  );
}

export function StatusCodeBadge({ code }: { code: number }) {
  return (
    <span className={cn("font-mono text-sm font-medium", getStatusCodeColor(code))}>
      {code}
    </span>
  );
}
