"use client";

import { useActionState, useState } from "react";
import { AlertTriangleIcon, CheckCircle2Icon, AlertCircleIcon, Loader2Icon } from "lucide-react";
import { updateOrderStatus, type StatusFormState } from "@/app/admin/(panel)/pedidos/[id]/actions";
import type { OrderStatus } from "@/generated/prisma/enums";
import { NEXT_STATUSES, STATUS_META } from "@/lib/order-status";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-white px-3 text-base text-heading focus-visible:border-brand aria-invalid:border-destructive";

// El estado de la acción vive aquí; el formulario se vuelve a montar (key) cuando cambia el
// estado del pedido, así se limpia tras guardar pero el mensaje de confirmación permanece.
export function StatusPanel({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, action, pending] = useActionState<StatusFormState, FormData>(updateOrderStatus, { status: "idle" });
  const options = NEXT_STATUSES[status];

  return (
    <section aria-labelledby="actualizar-estado" className="rounded-card bg-white p-5 shadow-card">
      <h2 id="actualizar-estado" className="text-lg font-bold">
        Actualizar estado
      </h2>

      {state.status === "success" && (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm font-medium text-success"
        >
          <CheckCircle2Icon className="size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      )}

      {options.length === 0 ? (
        <p className="mt-3 text-sm">
          Este pedido está {STATUS_META[status].label.toLowerCase()}; ya no tiene más pasos.
        </p>
      ) : (
        <StatusForm
          key={status}
          orderId={orderId}
          status={status}
          options={options}
          state={state}
          pending={pending}
          action={action}
        />
      )}
    </section>
  );
}

function StatusForm({
  orderId,
  status,
  options,
  state,
  pending,
  action,
}: {
  orderId: string;
  status: OrderStatus;
  options: OrderStatus[];
  state: StatusFormState;
  pending: boolean;
  action: (data: FormData) => void;
}) {
  // El siguiente paso natural queda preseleccionado; cancelar nunca es la opción por defecto.
  const [next, setNext] = useState<OrderStatus>(options.find((o) => o !== "CANCELLED") ?? options[0]);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    // Acción de servidor en `action`: se envía por POST aunque JavaScript aún no haya cargado.
    <form
      action={action}
      className="group/status mt-4 space-y-4"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="expectedStatus" value={status} />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-heading">Nuevo estado</legend>
        <div className="space-y-2">
          {options.map((option) => (
            <label
              key={option}
              className={cn(
                "flex min-h-tap cursor-pointer items-center gap-3 rounded-lg border px-3 transition-colors",
                next === option
                  ? option === "CANCELLED"
                    ? "border-destructive bg-destructive/5"
                    : "border-brand bg-surface"
                  : "border-input hover:border-brand",
              )}
            >
              <input
                type="radio"
                name="toStatus"
                value={option}
                checked={next === option}
                onChange={() => setNext(option)}
                className="size-5 accent-brand"
              />
              <span className="font-medium text-heading">
                {option === "CANCELLED" ? "Cancelar pedido" : `Marcar como ${STATUS_META[option].label.toLowerCase()}`}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Los bloques extra se muestran con :has() según la opción marcada: funciona aun sin JavaScript. */}
      {options.includes("SHIPPED") && (
        <div className="hidden gap-3 group-has-[input[value=SHIPPED]:checked]/status:grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Field name="carrier" label="Paquetería" error={errors.carrier} placeholder="Estafeta, DHL…" />
          <Field name="trackingNumber" label="Número de guía" error={errors.trackingNumber} />
        </div>
      )}

      {options.includes("CANCELLED") && (
        <div className="hidden rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-heading group-has-[input[value=CANCELLED]:checked]/status:block">
          <p className="flex gap-2">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            Las piezas de este pedido regresarán al inventario. Esta acción no se puede deshacer.
          </p>
          <label className="mt-3 flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              name="confirm"
              aria-invalid={Boolean(errors.confirm)}
              aria-describedby={errors.confirm ? "confirm-error" : undefined}
              className="size-5 accent-destructive"
            />
            Sí, cancelar este pedido
          </label>
          {errors.confirm && (
            <p id="confirm-error" className="mt-1 text-destructive">
              {errors.confirm}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-heading">
          Nota interna <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={1000}
          placeholder="Ej. Pago confirmado por transferencia, folio 12345"
          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-base text-heading focus-visible:border-brand"
        />
        <p className="mt-1 text-xs">Solo la ve el equipo; queda en el historial.</p>
      </div>

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-heading"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill font-semibold text-white transition-colors disabled:bg-line disabled:text-muted-foreground",
          next === "CANCELLED" ? "bg-destructive hover:bg-destructive/90" : "bg-brand hover:bg-brand-hover",
        )}
      >
        {pending && <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />}
        {pending ? "Guardando…" : next === "CANCELLED" ? "Cancelar pedido" : `Guardar: ${STATUS_META[next].label}`}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  error,
  placeholder,
}: {
  name: string;
  label: string;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-heading">
        {label}
      </label>
      <input
        id={name}
        name={name}
        maxLength={80}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClass}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
