import { cn } from "@/lib/utils";

// Estado de la cuenta del cliente en el panel: Activo en verde, Inactivo (bloqueado) en rojo.
export function CustomerStatus({ active, className }: { active: boolean; className?: string }) {
  return <span className={cn("insignia", active ? "exito" : "peligro", className)}>{active ? "Activo" : "Inactivo"}</span>;
}
