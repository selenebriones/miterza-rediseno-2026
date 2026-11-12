"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, Loader2Icon, LockIcon, Trash2Icon, UnlockIcon } from "lucide-react";
import { deleteCustomer, setCustomerActive } from "@/app/admin/(panel)/clientes/actions";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useSavedToast } from "@/components/ui/saved-toast";
import { cn } from "@/lib/utils";

// Botones como los del panel de terza-sitio: grises con borde y verdes al pasar el mouse; eliminar se pone rojo.
const GRAY = "border border-[#dee2e6] bg-white text-[#343a40] hover:border-brand hover:bg-brand-50 hover:text-brand";
const DELETE_ROW =
  "border border-[#dee2e6] bg-white text-[#343a40] hover:border-[#f1556c] hover:bg-[#fdeef0] hover:text-[#f1556c]";
const DELETE_PAGE = "border border-[#fbd3d9] bg-white text-[#f1556c] hover:border-[#f1556c]";

type Customer = { id: string; name: string | null; email: string; isActive: boolean };
type Pending = "block" | "unblock" | "delete" | null;

// Botones de un cliente: ver detalle, bloquear/activar y eliminar. Bloquear y eliminar piden
// confirmación en una ventana; activar no, porque no quita nada. `layout="row"` es la versión
// compacta (solo iconos con nombre accesible) de la tabla; "page" la del detalle, con texto.
export function CustomerActions({
  customer,
  layout,
  showDetail = true,
}: {
  customer: Customer;
  layout: "row" | "page";
  showDetail?: boolean;
}) {
  const router = useRouter();
  const { show, toast } = useSavedToast();
  const [confirm, setConfirm] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const who = customer.name || customer.email;

  function run(action: Exclude<Pending, null>) {
    setError(null);
    startTransition(async () => {
      const result =
        action === "delete" ? await deleteCustomer(customer.id) : await setCustomerActive(customer.id, action === "unblock");
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setConfirm(null);
      show(result.message);
      if (action === "delete" && layout === "page") router.push("/admin/clientes");
    });
  }

  const compact = layout === "row";
  const base = cn(
    "inline-flex shrink-0 items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50",
    // En la tabla: botones redondos con borde, como las acciones del panel de terza-sitio.
    compact ? "size-10 rounded-full" : "h-11 rounded-pill px-4 text-sm",
  );

  return (
    <>
      <div className={cn("flex items-center", compact ? "justify-end gap-2" : "flex-wrap gap-2")}>
        {showDetail && (
          <Link
            href={`/admin/clientes/${customer.id}`}
            aria-label={compact ? `Ver detalle de ${who}` : undefined}
            title={compact ? "Ver detalle" : undefined}
            className={cn(base, GRAY)}
          >
            <EyeIcon className="size-4" aria-hidden="true" />
            {!compact && "Ver detalle"}
          </Link>
        )}
        {customer.isActive ? (
          <button
            type="button"
            onClick={() => setConfirm("block")}
            disabled={pending}
            aria-label={compact ? `Bloquear a ${who}` : undefined}
            title={compact ? "Bloquear" : undefined}
            className={cn(base, GRAY)}
          >
            <LockIcon className="size-4" aria-hidden="true" />
            {!compact && "Bloquear"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => run("unblock")}
            disabled={pending}
            aria-label={compact ? `Activar a ${who}` : undefined}
            title={compact ? "Activar" : undefined}
            className={cn(base, GRAY)}
          >
            {pending && confirm === null ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <UnlockIcon className="size-4" aria-hidden="true" />
            )}
            {!compact && "Activar"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setConfirm("delete")}
          disabled={pending}
          aria-label={compact ? `Eliminar a ${who}` : undefined}
          title={compact ? "Eliminar" : undefined}
          className={cn(base, compact ? DELETE_ROW : DELETE_PAGE)}
        >
          <Trash2Icon className="size-4" aria-hidden="true" />
          {!compact && "Eliminar"}
        </button>
      </div>
      {error && confirm === null && (
        <p role="alert" className="mt-1 text-right text-sm text-danger">
          {error}
        </p>
      )}

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && !pending && (setConfirm(null), setError(null))}>
        <DialogContent className="gap-0 rounded-[28px] p-6 sm:max-w-md sm:p-8">
          <DialogTitle className="text-xl font-bold text-heading">
            {confirm === "delete" ? "¿Eliminar a este cliente?" : "¿Bloquear a este cliente?"}
          </DialogTitle>
          <DialogDescription className="mt-3 text-base text-body">
            <span className="block font-semibold text-heading">{who}</span>
            {customer.name && <span className="block">{customer.email}</span>}
            <span className="mt-3 block">
              {confirm === "delete"
                ? "Se borran su cuenta, sus direcciones guardadas y lo que tenga en el carrito sin comprar. No se puede deshacer. Sus pedidos se conservan como compra sin cuenta."
                : "No podrá entrar a su cuenta ni comprar hasta que lo vuelvas a activar. Sus pedidos no cambian."}
            </span>
          </DialogDescription>
          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setConfirm(null)}
              disabled={pending}
              className="h-11 rounded-pill px-5 font-semibold text-heading ring-1 ring-line hover:ring-brand"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => confirm && run(confirm)}
              disabled={pending}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-pill px-5 font-semibold text-white disabled:opacity-60",
                confirm === "delete" ? "bg-danger hover:bg-danger/90" : "bg-brand hover:bg-brand-hover",
              )}
            >
              {pending && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
              {confirm === "delete" ? "Sí, eliminar" : "Sí, bloquear"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {toast}
    </>
  );
}
