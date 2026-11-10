"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ChevronDownIcon, Loader2Icon, MapPinIcon, PencilIcon, PlusIcon, StarIcon, Trash2Icon } from "lucide-react";
import {
  deleteAddress,
  saveAddress,
  setDefaultAddress,
  type AddressFormState,
} from "@/app/(tienda)/cuenta/informacion/actions";
import { LocationMap, type AddressQuery } from "@/components/checkout/location-map";
import { PinMap } from "@/components/checkout/pin-map";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useSavedToast } from "@/components/ui/saved-toast";
import type { SavedAddress } from "@/lib/addresses";
import { MEXICAN_STATES } from "@/lib/mexico";
import { cn } from "@/lib/utils";

// "Mis direcciones": tarjetas con las direcciones guardadas (la predeterminada primero) y una ventana
// para agregar o editar, con el mismo mapa del checkout. Se pueden guardar hasta 10.

type Defaults = { firstName: string; lastName: string; phone: string };

export function AddressBook({ addresses, defaults, max }: { addresses: SavedAddress[]; defaults: Defaults; max: number }) {
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);
  const { show, toast } = useSavedToast();
  const full = addresses.length >= max;

  return (
    <>
      {addresses.length === 0 ? (
        <div className="mt-5 flex flex-col items-start gap-4 rounded-2xl bg-white p-6">
          <p className="flex items-center gap-2 text-heading">
            <MapPinIcon className="size-5 text-brand" aria-hidden="true" />
            Aún no tienes direcciones guardadas.
          </p>
          <p className="text-sm">Guárdalas aquí y elígelas con un clic al pagar.</p>
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => setEditing(address)}
              onDone={show}
            />
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setEditing("new")}
        disabled={full}
        aria-haspopup="dialog"
        className="mt-5 inline-flex h-12 items-center gap-2 rounded-pill border border-brand bg-white px-6 font-semibold text-brand transition-colors hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlusIcon className="size-4" aria-hidden="true" />
        Agregar dirección
      </button>
      {full && <p className="mt-2 text-sm">Puedes guardar hasta {max} direcciones.</p>}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto rounded-[28px] p-6 sm:max-w-2xl sm:p-8">
          <DialogTitle className="border-b border-line pb-4 text-2xl font-bold text-heading">
            {editing === "new" ? "Agregar dirección" : "Editar dirección"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Captura quién recibe, la dirección y, si quieres, confirma la ubicación en el mapa.
          </DialogDescription>
          {editing !== null && (
            <AddressForm
              address={editing === "new" ? null : editing}
              defaults={defaults}
              firstAddress={addresses.length === 0}
              onSaved={(message) => {
                setEditing(null);
                show(message);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      {toast}
    </>
  );
}

function AddressCard({
  address,
  onEdit,
  onDone,
}: {
  address: SavedAddress;
  onEdit: () => void;
  onDone: (message: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <li
      className={cn(
        "flex flex-col rounded-2xl bg-white p-5",
        address.isDefault ? "ring-2 ring-brand" : "ring-1 ring-line",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold text-heading">{address.label}</h3>
        {address.isDefault && (
          <span className="rounded-pill bg-accent px-2.5 py-0.5 text-xs font-bold text-brand">Predeterminada</span>
        )}
      </div>
      <address className="mt-2 flex-1 text-sm not-italic">
        <span className="block font-semibold text-heading">
          {address.firstName} {address.lastName} · {address.phone}
        </span>
        <span className="block">
          {address.street}, {address.neighborhood}
        </span>
        <span className="block">
          {address.postalCode} {address.city}, {address.state}
        </span>
        {address.references && <span className="mt-1 block text-muted-foreground">Referencias: {address.references}</span>}
      </address>
      {/* Mapa de solo lectura con el pin que el cliente confirmó. */}
      {address.lat !== null && address.lng !== null && (
        <PinMap lat={address.lat} lng={address.lng} className="mt-4 h-40 w-full ring-1 ring-line" />
      )}

      {confirming ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-destructive/5 p-3 text-sm">
          <span className="font-medium text-heading">¿Eliminar esta dirección?</span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteAddress(address.id);
                onDone("Eliminamos la dirección");
              })
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-destructive px-4 font-semibold text-white"
          >
            {pending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />}
            Sí, eliminar
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-9 rounded-pill px-3 font-semibold text-heading hover:bg-mist"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-mist px-4 text-brand hover:bg-brand hover:text-white"
          >
            <PencilIcon className="size-3.5" aria-hidden="true" />
            Editar
          </button>
          {!address.isDefault && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await setDefaultAddress(address.id);
                  onDone("Cambiamos tu dirección predeterminada");
                })
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-mist px-4 text-brand hover:bg-brand hover:text-white"
            >
              <StarIcon className="size-3.5" aria-hidden="true" />
              Hacer predeterminada
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-pill px-3 text-destructive hover:bg-destructive/5"
          >
            <Trash2Icon className="size-3.5" aria-hidden="true" />
            Eliminar
          </button>
        </div>
      )}
    </li>
  );
}

const MAP_FIELDS: (keyof AddressQuery)[] = ["street", "neighborhood", "postalCode", "city", "state"];

function AddressForm({
  address,
  defaults,
  firstAddress,
  onSaved,
}: {
  address: SavedAddress | null;
  defaults: Defaults;
  firstAddress: boolean;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState<AddressFormState, FormData>(saveAddress, {});
  const formRef = useRef<HTMLFormElement>(null);
  const v = state.values ?? {
    label: address?.label ?? (firstAddress ? "Casa" : ""),
    firstName: address?.firstName ?? defaults.firstName,
    lastName: address?.lastName ?? defaults.lastName,
    phone: address?.phone ?? defaults.phone,
    street: address?.street ?? "",
    neighborhood: address?.neighborhood ?? "",
    postalCode: address?.postalCode ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    references: address?.references ?? "",
  };
  const errors = state.fieldErrors ?? {};
  const [mapAddress, setMapAddress] = useState<AddressQuery>({
    street: v.street,
    neighborhood: v.neighborhood,
    postalCode: v.postalCode,
    city: v.city,
    state: v.state,
  });

  useEffect(() => {
    if (state.status === "saved") onSaved(state.message ?? "Guardamos tu dirección");
  }, [state, onSaved]);

  // El mapa se ubica con la dirección al salir de cada campo (no en cada tecla).
  function syncMap(event: React.FocusEvent<HTMLFormElement> | React.ChangeEvent<HTMLFormElement>) {
    const target = event.target as unknown as HTMLInputElement;
    if (!MAP_FIELDS.includes(target.name as keyof AddressQuery) || !formRef.current) return;
    const data = new FormData(formRef.current);
    const next = Object.fromEntries(MAP_FIELDS.map((f) => [f, String(data.get(f) ?? "").trim()])) as AddressQuery;
    setMapAddress((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }

  return (
    <form
      ref={formRef}
      action={action}
      onBlur={syncMap}
      onChange={(e) => (e.target as HTMLElement).tagName === "SELECT" && syncMap(e)}
      noValidate
      className="mt-5 space-y-5"
    >
      {address && <input type="hidden" name="id" value={address.id} />}
      <Field name="label" label="Nombre de la dirección" placeholder="Casa, Oficina…" defaultValue={v.label} error={errors.label} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="firstName" label="Nombre de quien recibe" autoComplete="given-name" defaultValue={v.firstName} error={errors.firstName} />
        <Field name="lastName" label="Apellidos" autoComplete="family-name" defaultValue={v.lastName} error={errors.lastName} />
      </div>
      <Field
        name="phone"
        label="Teléfono"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        defaultValue={v.phone}
        error={errors.phone}
        hint="10 dígitos. Para coordinar la entrega."
      />
      <Field name="street" label="Calle y número" autoComplete="address-line1" defaultValue={v.street} error={errors.street} />
      <Field name="neighborhood" label="Colonia" autoComplete="address-line2" defaultValue={v.neighborhood} error={errors.neighborhood} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          name="postalCode"
          label="Código postal"
          inputMode="numeric"
          maxLength={5}
          autoComplete="postal-code"
          defaultValue={v.postalCode}
          error={errors.postalCode}
        />
        <Field name="city" label="Ciudad o municipio" autoComplete="address-level2" defaultValue={v.city} error={errors.city} />
      </div>
      <div>
        <label htmlFor="direccion-state" className="mb-1.5 block text-sm font-bold text-brand">
          Estado
        </label>
        <div className="relative">
          <select
            id="direccion-state"
            name="state"
            defaultValue={v.state}
            autoComplete="address-level1"
            aria-invalid={errors.state ? true : undefined}
            aria-describedby={errors.state ? "direccion-state-error" : undefined}
            className={cn(inputClass(errors.state), "cursor-pointer appearance-none pr-10")}
          >
            <option value="" disabled>
              Elige tu estado
            </option>
            {MEXICAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-brand" aria-hidden="true" />
        </div>
        {errors.state && (
          <p id="direccion-state-error" className="mt-1.5 text-sm text-danger">
            {errors.state}
          </p>
        )}
      </div>

      <LocationMap
        address={mapAddress}
        initial={address && address.lat !== null && address.lng !== null ? { lat: address.lat, lng: address.lng } : null}
      />

      <Field
        name="references"
        label="Referencias (opcional)"
        defaultValue={v.references}
        error={errors.references}
        hint="Entre qué calles está, color de la fachada…"
      />

      {!firstAddress && !address?.isDefault && (
        <label className="flex cursor-pointer items-center gap-3 text-[0.9375rem] text-heading">
          <input type="checkbox" name="isDefault" className="size-5 accent-brand" />
          Usar como dirección predeterminada
        </label>
      )}

      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-brand px-8 font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-line disabled:text-muted-foreground"
      >
        {pending && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
        {pending ? "Guardando…" : "Guardar dirección"}
      </button>
    </form>
  );
}

const inputClass = (error?: string) =>
  cn(
    "h-12 w-full rounded-card border bg-white px-4 text-base text-heading focus-visible:ring-2 focus-visible:outline-none",
    error ? "border-danger focus-visible:ring-danger/25" : "border-input focus-visible:border-brand focus-visible:ring-brand/25",
  );

function Field({
  label,
  name,
  error,
  hint,
  ...props
}: { label: string; name: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `direccion-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-brand">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-ayuda` : undefined}
        className={inputClass(error)}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-ayuda`} className="mt-1.5 text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
