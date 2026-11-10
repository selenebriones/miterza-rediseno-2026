"use client";

import { PaymentChooser, type PaymentChoice } from "./payment-chooser";
import { LocationMap, type AddressQuery } from "./location-map";
import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { AlertCircleIcon, ArrowLeftIcon, ChevronDownIcon, ImageIcon, InfoIcon, Loader2Icon, LockIcon } from "lucide-react";
import { placeOrder, type CheckoutState } from "@/app/(checkout)/checkout/actions";
import { cartLineKey, useCart, type AppliedCoupon, type CartItem } from "@/components/cart/cart-provider";
import { OrderTotals } from "@/components/cart/order-totals";
import { useCartValidation } from "@/components/cart/use-cart-validation";
import {
  CHECKOUT_FIELDS,
  validateCheckout,
  validateField,
  type CheckoutErrors,
  type CheckoutField,
  type CheckoutValues,
} from "@/lib/checkout-validation";
import { MEXICAN_STATES } from "@/lib/mexico";
import type { PaymentMethodOption } from "@/lib/payments";
import { computeTotals, formatPrice } from "@/lib/store-config";
import { cn } from "@/lib/utils";

const initialState: CheckoutState = { status: "idle" };

const ADDRESS_FIELDS: (keyof AddressQuery)[] = ["street", "neighborhood", "postalCode", "city", "state"];

type Customer = { email: string; firstName: string; lastName: string; phone: string };
export type CheckoutAddress = {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  references: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
};

export function CheckoutForm({
  paymentMethods,
  customer,
  addresses = [],
}: {
  paymentMethods: PaymentMethodOption[];
  customer: Customer;
  addresses?: CheckoutAddress[];
}) {
  // Direcciones guardadas: se preselecciona la predeterminada; "other" = capturar una nueva.
  const [addressChoice, setAddressChoice] = useState<string>(
    () => addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "other",
  );
  const chosenAddress = addresses.find((a) => a.id === addressChoice) ?? null;
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const { items, subtotal, coupon, hydrated } = useCart();
  const { validating, notices } = useCartValidation();
  const [state, formAction, pending] = useActionState(placeOrder, initialState);
  const [clientErrors, setClientErrors] = useState<CheckoutErrors>({});
  // Método de pago elegido. Con tarjeta todavía no se puede enviar: falta conectar la pasarela.
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>(null);
  const cardChosen = paymentChoice === "card";
  const formRef = useRef<HTMLFormElement>(null);

  // Errores del servidor del último envío, sustituidos por los de cliente al corregir cada campo.
  const errors: CheckoutErrors = { ...state.fieldErrors, ...clientErrors };
  // Antes del primer envío, los datos de la cuenta; después, lo que se capturó.
  const values: Partial<CheckoutValues> = state.values ?? customer;
  const { total } = computeTotals(subtotal, coupon?.amount);
  // Dirección para ubicar el pin del mapa: se actualiza al salir de cada campo (no en cada tecla).
  const [address, setAddress] = useState<AddressQuery>(() => ({
    street: values.street ?? "",
    neighborhood: values.neighborhood ?? "",
    postalCode: values.postalCode ?? "",
    city: values.city ?? "",
    state: values.state ?? "",
  }));

  function syncAddress(field: string) {
    if (!ADDRESS_FIELDS.includes(field as keyof AddressQuery) || !formRef.current) return;
    const data = new FormData(formRef.current);
    const next = Object.fromEntries(ADDRESS_FIELDS.map((f) => [f, String(data.get(f) ?? "").trim()])) as AddressQuery;
    setAddress((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }

  function onBlur(event: React.FocusEvent<HTMLFormElement>) {
    const field = event.target.name as CheckoutField;
    syncAddress(field);
    if (!CHECKOUT_FIELDS.includes(field)) return;
    setClientErrors((prev) => ({ ...prev, [field]: validateField(field, event.target.value) }));
  }

  function onChange(event: React.ChangeEvent<HTMLFormElement>) {
    // Al corregir, el mensaje desaparece en cuanto el valor es válido (no mientras sigue mal).
    const field = event.target.name as CheckoutField;
    // El estado es una lista: se ubica en cuanto se elige, sin esperar a salir del campo.
    if (field === "state") syncAddress(field);
    if (errors[field] && !validateField(field, event.target.value)) {
      setClientErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  // La acción se envía desde aquí (y no con `action=` en el <form>) porque React reinicia el
  // formulario al terminar una acción de formulario: si el pedido falla, se perderían los datos.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const current = Object.fromEntries(CHECKOUT_FIELDS.map((f) => [f, String(data.get(f) ?? "")])) as CheckoutValues;
    const found = validateCheckout(current);
    if (Object.keys(found).length > 0) {
      setClientErrors(found);
      const first = CHECKOUT_FIELDS.find((f) => found[f]);
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    startTransition(() => formAction(data));
  }

  if (!hydrated) {
    return (
      <div className="container py-10" aria-busy="true" aria-label="Cargando">
        <div className="h-96 animate-pulse rounded-card bg-muted" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center py-20 text-center">
        <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
        <p className="mt-2">Agrega productos para continuar con tu compra.</p>
        <Link
          href="/productos"
          className="mt-6 inline-flex h-12 items-center rounded-pill bg-brand px-6 font-semibold text-white hover:bg-accent hover:text-brand"
        >
          Explorar productos
        </Link>
      </div>
    );
  }

  return (
    <div className="container pt-4 pb-16 lg:pt-10">
      {/* Móvil: resumen plegable con el total siempre visible. */}
      <details className="group -mx-4 border-b border-line bg-white lg:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 text-brand [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 font-semibold">
            <span className="group-open:hidden">Ver resumen</span>
            <span className="hidden group-open:inline">Ocultar resumen</span>
            <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </span>
          <span className="text-2xl font-bold text-black tabular-nums">{formatPrice(total)}</span>
        </summary>
        <div className="px-4 pb-5">
          <Summary items={items} subtotal={subtotal} coupon={coupon} />
        </div>
      </details>

      <div className="mt-6 lg:mt-0 lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <Link
            href="/carrito"
            className="inline-flex items-center gap-2 rounded-pill bg-mist px-5 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Volver al carrito
          </Link>
          <h1 className="mt-2 text-[1.75rem] leading-tight font-bold lg:text-[2.25rem]">Finalizar compra</h1>
          <p className="mt-1 text-sm">
            Comprando como <strong className="font-semibold text-heading">{customer.email}</strong>
          </p>

          {notices.length > 0 && (
            <div
              role="status"
              className="mt-5 flex gap-3 rounded-card border border-warning/30 bg-warning/5 p-4 text-sm text-heading"
            >
              <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
              <ul className="space-y-1">
                {notices.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          <form
            ref={formRef}
            onSubmit={onSubmit}
            onBlur={onBlur}
            onChange={onChange}
            noValidate
            // Defensa: si algún día se enviara sin JavaScript, nunca por GET (los datos irían en la URL).
            method="post"
            className="mt-6 space-y-10"
          >
            <input
              type="hidden"
              name="items"
              value={JSON.stringify(items.map(({ variantId, quantity, size }) => ({ variantId, quantity, size })))}
            />
            {/* Solo el código: el servidor vuelve a validarlo y decide el monto. */}
            <input type="hidden" name="coupon" value={coupon?.code ?? ""} />
            {/* Campo trampa para bots: oculto para personas y lectores de pantalla. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="website">No llenar</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <Section number={1} title="Contacto">
              <Field
                name="email"
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                inputMode="email"
                hint="Para enviarte el seguimiento de tu pedido."
                error={errors.email}
                defaultValue={values.email}
              />
              <Field
                name="phone"
                label="Teléfono"
                type="tel"
                autoComplete="tel-national"
                inputMode="tel"
                hint="10 dígitos. Para coordinar la entrega."
                error={errors.phone}
                defaultValue={values.phone}
              />
            </Section>

            <Section number={2} title="Dirección de envío">
              {addresses.length > 0 && (
                <AddressPicker addresses={addresses} value={addressChoice} onChange={setAddressChoice} />
              )}
              {chosenAddress ? (
                // Dirección guardada: viaja en campos ocultos con los mismos nombres que los del formulario.
                <>
                  <input type="hidden" name="firstName" value={chosenAddress.firstName} />
                  <input type="hidden" name="lastName" value={chosenAddress.lastName} />
                  <input type="hidden" name="street" value={chosenAddress.street} />
                  <input type="hidden" name="neighborhood" value={chosenAddress.neighborhood} />
                  <input type="hidden" name="postalCode" value={chosenAddress.postalCode} />
                  <input type="hidden" name="city" value={chosenAddress.city} />
                  <input type="hidden" name="state" value={chosenAddress.state} />
                  <input type="hidden" name="references" value={chosenAddress.references} />
                  {chosenAddress.lat !== null && chosenAddress.lng !== null && (
                    <>
                      <input type="hidden" name="lat" value={chosenAddress.lat.toFixed(6)} />
                      <input type="hidden" name="lng" value={chosenAddress.lng.toFixed(6)} />
                    </>
                  )}
                </>
              ) : (
                <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  name="firstName"
                  label="Nombre"
                  autoComplete="given-name"
                  error={errors.firstName}
                  defaultValue={values.firstName}
                />
                <Field
                  name="lastName"
                  label="Apellidos"
                  autoComplete="family-name"
                  error={errors.lastName}
                  defaultValue={values.lastName}
                />
              </div>
              <Field
                name="street"
                label="Calle y número"
                autoComplete="address-line1"
                error={errors.street}
                defaultValue={values.street}
              />
              <Field
                name="neighborhood"
                label="Colonia"
                autoComplete="address-line2"
                error={errors.neighborhood}
                defaultValue={values.neighborhood}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  name="postalCode"
                  label="Código postal"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={5}
                  error={errors.postalCode}
                  defaultValue={values.postalCode}
                />
                <Field
                  name="city"
                  label="Ciudad o municipio"
                  autoComplete="address-level2"
                  error={errors.city}
                  defaultValue={values.city}
                />
              </div>
              <SelectField
                name="state"
                label="Estado"
                autoComplete="address-level1"
                error={errors.state}
                defaultValue={values.state}
                options={MEXICAN_STATES}
              />
              <LocationMap address={address} />
              <Field
                name="references"
                label="Referencias"
                optional
                autoComplete="off"
                hint="Entre qué calles está, color de la fachada…"
                error={errors.references}
                defaultValue={values.references}
              />
                  {/* Guardar la dirección nueva en la cuenta para la próxima compra. */}
                  <div className="rounded-card bg-surface p-4">
                    <label className="flex cursor-pointer items-center gap-3 text-[0.9375rem] font-medium text-heading">
                      <input
                        type="checkbox"
                        name="saveAddress"
                        checked={saveNewAddress}
                        onChange={(e) => setSaveNewAddress(e.target.checked)}
                        className="size-5 accent-brand"
                      />
                      Guardar esta dirección en mi cuenta
                    </label>
                    {saveNewAddress && (
                      <div className="mt-3">
                        <label htmlFor="addressLabel" className="mb-1.5 block text-[0.9375rem] font-medium text-heading">
                          Nombre de la dirección
                        </label>
                        <input
                          id="addressLabel"
                          name="addressLabel"
                          placeholder="Casa, Oficina…"
                          maxLength={40}
                          defaultValue={addresses.length === 0 ? "Casa" : ""}
                          autoComplete="off"
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </Section>

            <Section number={3} title="Pago">
              <PaymentChooser
                transfer={paymentMethods.find((m) => m.provider === "BANK_TRANSFER")}
                choice={paymentChoice}
                onChoiceChange={(next) => {
                  setPaymentChoice(next);
                  setClientErrors((prev) => ({ ...prev, paymentMethodId: undefined }));
                }}
                error={errors.paymentMethodId}
              />
            </Section>

            <div>
              {state.status === "error" && state.message && (
                <div
                  role="alert"
                  className="mb-4 flex gap-3 rounded-card border border-destructive/30 bg-destructive/5 p-4 text-sm text-heading"
                >
                  <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
                  <div>
                    <p>{state.message}</p>
                    {state.cartIssue && (
                      <Link href="/carrito" className="mt-1 inline-block font-semibold text-brand underline">
                        Ir al carrito
                      </Link>
                    )}
                  </div>
                </div>
              )}
              {cardChosen && (
                <p role="status" className="mb-4 flex gap-3 rounded-card bg-surface p-4 text-sm text-heading">
                  <InfoIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                  El pago con tarjeta estará disponible muy pronto. Para completar tu compra hoy, elige transferencia o
                  depósito.
                </p>
              )}
              <button
                type="submit"
                disabled={pending || validating || cardChosen}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-pill bg-brand text-base font-semibold text-white transition-colors hover:bg-accent hover:text-brand active:bg-accent-hover disabled:bg-line disabled:text-muted-foreground"
              >
                {pending ? (
                  <>
                    <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />
                    Procesando…
                  </>
                ) : (
                  <>
                    <LockIcon className="size-4" aria-hidden="true" />
                    Realizar pedido · {formatPrice(total)}
                  </>
                )}
              </button>
              <p className="mt-3 text-center text-xs">
                Al realizar tu pedido aceptas el{" "}
                <Link href="/politicas/privacidad" className="underline hover:text-brand">
                  aviso de privacidad
                </Link>{" "}
                y la{" "}
                <Link href="/politicas/devoluciones" className="underline hover:text-brand">
                  política de devoluciones
                </Link>
                .
              </p>
            </div>
          </form>
        </div>

        <aside className="hidden lg:col-span-5 lg:block" aria-label="Resumen del pedido">
          <div className="sticky top-8 rounded-[28px] bg-mist p-6 md:p-8">
            <h2 className="text-2xl font-bold text-black">Resumen del pedido</h2>
            <Summary items={items} subtotal={subtotal} coupon={coupon} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Summary({ items, subtotal, coupon }: { items: CartItem[]; subtotal: number; coupon: AppliedCoupon | null }) {
  return (
    <div>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={cartLineKey(item)} className="flex items-center gap-3">
            <span className="relative grid size-16 shrink-0 place-items-center rounded-lg border border-line bg-white">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="size-full rounded-lg object-cover" />
              ) : (
                <ImageIcon className="size-5 text-brand/40" aria-hidden="true" />
              )}
              <span className="absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-pill bg-brand px-1 text-xs font-bold text-white">
                <span className="sr-only">Cantidad: </span>
                {item.quantity}
              </span>
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="line-clamp-2 font-medium text-heading">{item.name}</span>
              {item.variantLabel && <span className="block">{item.variantLabel}</span>}
            </span>
            <span className="text-sm font-semibold text-heading tabular-nums">
              {formatPrice(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <OrderTotals subtotal={subtotal} coupon={coupon} className="mt-5 border-t border-black/10 pt-5" />
    </div>
  );
}

// Tarjetas con las direcciones guardadas y la opción de capturar otra (una sola a la vez).
function AddressPicker({
  addresses,
  value,
  onChange,
}: {
  addresses: CheckoutAddress[];
  value: string;
  onChange: (id: string) => void;
}) {
  const cardClass =
    "flex cursor-pointer gap-3 rounded-card border p-4 transition-colors has-checked:border-brand has-checked:bg-surface has-focus-visible:ring-2 has-focus-visible:ring-brand/25";
  return (
    <fieldset>
      <legend className="mb-3 text-[0.9375rem] font-medium text-heading">¿A dónde enviamos tu pedido?</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <label key={a.id} className={cn(cardClass, "border-input")}>
            <input
              type="radio"
              name="addressChoice"
              checked={value === a.id}
              onChange={() => onChange(a.id)}
              className="mt-1 size-5 shrink-0 accent-brand"
            />
            <span className="min-w-0 text-sm">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-heading">{a.label}</span>
                {a.isDefault && (
                  <span className="rounded-pill bg-accent px-2 py-0.5 text-[0.6875rem] font-bold text-brand">
                    Predeterminada
                  </span>
                )}
              </span>
              <span className="mt-1 block">
                {a.firstName} {a.lastName}
              </span>
              <span className="block">
                {a.street}, {a.neighborhood}
              </span>
              <span className="block">
                {a.postalCode} {a.city}, {a.state}
              </span>
            </span>
          </label>
        ))}
        <label className={cn(cardClass, "items-center border-dashed border-input")}>
          <input
            type="radio"
            name="addressChoice"
            checked={value === "other"}
            onChange={() => onChange("other")}
            className="size-5 shrink-0 accent-brand"
          />
          <span className="font-semibold text-brand">Usar otra dirección</span>
        </label>
      </div>
      <Link href="/cuenta/informacion" className="mt-2 inline-block text-sm font-semibold text-brand underline underline-offset-2">
        Administrar mis direcciones
      </Link>
    </fieldset>
  );
}

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`paso-${number}`}>
      <h2 id={`paso-${number}`} className="flex items-center gap-3 text-xl font-bold">
        <span className="grid size-8 place-items-center rounded-full bg-brand text-sm text-white" aria-hidden="true">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "name"> & {
  name: CheckoutField;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

const inputClass =
  "h-12 w-full rounded-lg border border-input bg-white px-4 text-base text-heading transition-colors focus-visible:border-brand aria-invalid:border-destructive";

function Field({ name, label, hint, error, optional, ...props }: FieldProps) {
  const describedBy = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-heading">
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (opcional)</span>}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={inputClass}
        {...props}
      />
      {hint && !error && (
        <p id={`${name}-hint`} className="mt-1.5 text-xs">
          {hint}
        </p>
      )}
      {error && <ErrorText id={`${name}-error`}>{error}</ErrorText>}
    </div>
  );
}

// Controlado: al terminar la acción React reinicia el formulario y un <select> no controlado
// volvería a su primera opción, perdiendo lo que eligió el usuario.
function SelectField({
  name,
  label,
  error,
  options,
  defaultValue,
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name" | "defaultValue"> & {
  name: CheckoutField;
  label: string;
  error?: string;
  options: readonly string[];
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-heading">
        {label}
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={cn(inputClass, "cursor-pointer appearance-none pr-10")}
          {...props}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        >
          <option value="" disabled>
            Elige tu estado
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-brand"
          aria-hidden="true"
        />
      </div>
      {error && <ErrorText id={`${name}-error`}>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-destructive">
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}
