"use client";

import { useState } from "react";
import { CheckIcon, ChevronDownIcon, CreditCardIcon, LandmarkIcon, LockIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { PaymentMethodOption } from "@/lib/payments";
import { cn } from "@/lib/utils";

// Método de pago en dos botones grandes (estilo del botón de medidas de las persianas). Solo uno queda
// elegido, con una palomita encima.
//
// PAGO CON TARJETA: por ahora es solo el diseño. Los datos de la tarjeta se quedan en el navegador
// (los campos no tienen `name`, así que no viajan con el formulario) y no se guardan: el número se
// descarta al guardar y solo queda la marca y los últimos 4 dígitos para mostrarlos. Cuando se conecte
// la pasarela (Stripe, Mercado Pago, Openpay o Conekta), estos campos se cambian por los seguros de la
// pasarela; la tienda nunca debe recibir el número ni el CVV.

export type PaymentChoice = "card" | "transfer" | null;
type SavedCard = { brand: string; last4: string; name: string; bank: string };

// Bancos emisores más comunes en México (orden alfabético) y "Otro".
const BANKS = [
  "Afirme",
  "American Express",
  "Banamex",
  "BanBajío",
  "BanCoppel",
  "Banco Azteca",
  "Banorte",
  "Banregio",
  "BBVA",
  "Hey Banco",
  "HSBC",
  "Inbursa",
  "Invex",
  "Liverpool",
  "Mercado Pago",
  "Nu",
  "Santander",
  "Scotiabank",
  "Stori",
  "Otro",
];

const tileClass =
  "group/pay relative flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-2xl px-4 py-5 text-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30";

export function PaymentChooser({
  transfer,
  choice,
  onChoiceChange,
  error,
}: {
  transfer: PaymentMethodOption | undefined;
  choice: PaymentChoice;
  onChoiceChange: (choice: PaymentChoice) => void;
  error?: string;
}) {
  const [card, setCard] = useState<SavedCard | null>(null);
  const [cardOpen, setCardOpen] = useState(false);

  return (
    <fieldset aria-describedby={error ? "paymentMethodId-error" : undefined}>
      <legend className="sr-only">Método de pago</legend>
      {/* El servidor solo recibe el método; con tarjeta no se puede enviar el pedido todavía. */}
      <input type="hidden" name="paymentMethodId" value={choice === "transfer" && transfer ? transfer.id : ""} />

      <div role="radiogroup" aria-label="Método de pago" className="grid grid-cols-2 gap-4">
        <Tile
          selected={choice === "card"}
          icon={<CreditCardIcon className="size-11" strokeWidth={1.5} aria-hidden="true" />}
          label="Pago con tarjeta"
          detail={choice === "card" && card ? `${card.brand} •••• ${card.last4}` : "Crédito o débito"}
          onClick={() => setCardOpen(true)}
        />
        <Tile
          selected={choice === "transfer"}
          icon={<LandmarkIcon className="size-11" strokeWidth={1.5} aria-hidden="true" />}
          label="Transferencia o depósito"
          detail="Te enviamos los datos bancarios"
          disabled={!transfer}
          onClick={() => onChoiceChange("transfer")}
        />
      </div>

      {choice === "transfer" && transfer?.description && <p className="mt-3 text-sm">{transfer.description}</p>}
      {choice === "card" && card && (
        <p className="mt-3 text-sm">
          Tarjeta {card.bank} a nombre de <strong className="text-heading">{card.name}</strong>.{" "}
          <button
            type="button"
            onClick={() => setCardOpen(true)}
            className="font-semibold text-brand underline underline-offset-2"
          >
            Cambiar tarjeta
          </button>
        </p>
      )}
      {error && (
        <p id="paymentMethodId-error" className="mt-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <Dialog open={cardOpen} onOpenChange={setCardOpen}>
        <DialogContent className="gap-0 rounded-[28px] p-6 sm:max-w-md sm:p-8">
          <DialogTitle className="flex items-center gap-2 border-b border-line pb-4 text-2xl font-bold text-heading">
            <CreditCardIcon className="size-6 text-brand" aria-hidden="true" />
            Pago con tarjeta
          </DialogTitle>
          <DialogDescription className="sr-only">
            Captura el nombre como aparece en la tarjeta, el banco, el número y el código de seguridad.
          </DialogDescription>
          {cardOpen && (
            <CardForm
              initialName={card?.name ?? ""}
              initialBank={card?.bank ?? ""}
              onSave={(saved) => {
                setCard(saved);
                onChoiceChange("card");
                setCardOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </fieldset>
  );
}

function Tile({
  selected,
  icon,
  label,
  detail,
  disabled,
  onClick,
}: {
  selected: boolean;
  icon: React.ReactNode;
  label: string;
  detail: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        tileClass,
        // Elegido: verde de la marca con texto blanco (sobre lima el blanco casi no se lee).
        selected ? "bg-brand text-white" : "bg-accent-light text-brand hover:bg-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {selected && (
        <span className="absolute -top-2.5 -right-2.5 grid size-8 place-items-center rounded-full border-2 border-white bg-accent text-brand shadow-md">
          <CheckIcon className="size-5" strokeWidth={3} aria-hidden="true" />
        </span>
      )}
      {icon}
      <span className="text-base leading-tight lg:text-lg">{label}</span>
      <span className={cn("-mt-2 text-xs font-medium", selected ? "text-white/85" : "text-brand/80")}>{detail}</span>
    </button>
  );
}

// --- Formulario de tarjeta (solo en el navegador) ---

function cardBrand(digits: string) {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "American Express";
  return "Tarjeta";
}

// Algoritmo de Luhn: detecta errores al teclear el número.
function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

// "4242424242424242" → "4242 4242 4242 4242" (American Express: 4-6-5).
function formatCardNumber(digits: string) {
  const groups = /^3[47]/.test(digits) ? [4, 6, 5] : [4, 4, 4, 4, 3];
  const parts: string[] = [];
  let rest = digits;
  for (const size of groups) {
    if (!rest) break;
    parts.push(rest.slice(0, size));
    rest = rest.slice(size);
  }
  return parts.join(" ");
}

type CardErrors = Partial<Record<"name" | "bank" | "number" | "cvv", string>>;

function CardForm({
  initialName,
  initialBank,
  onSave,
}: {
  initialName: string;
  initialBank: string;
  onSave: (card: SavedCard) => void;
}) {
  const [name, setName] = useState(initialName);
  const [bank, setBank] = useState(initialBank);
  const [number, setNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState<CardErrors>({});

  const digits = number.replace(/\D/g, "");
  const brand = cardBrand(digits);
  const cvvLength = brand === "American Express" ? 4 : 3;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    // El diálogo vive dentro del formulario del checkout: sin esto, React pasaría el envío al formulario
    // de afuera (validaría la dirección o hasta mandaría el pedido).
    event.stopPropagation();
    const found: CardErrors = {};
    if (name.trim().split(/\s+/).length < 2) found.name = "Escribe el nombre completo como aparece en la tarjeta.";
    if (!bank) found.bank = "Elige el banco de tu tarjeta.";
    if (digits.length < 13 || digits.length > 19 || !luhn(digits)) found.number = "Revisa el número de tu tarjeta.";
    if (!new RegExp(`^\\d{${cvvLength}}$`).test(cvv)) found.cvv = `Escribe los ${cvvLength} dígitos del CVV.`;
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    // Solo se conserva lo necesario para mostrarla; el número completo y el CVV se descartan.
    onSave({ brand, last4: digits.slice(-4), name: name.trim(), bank });
  }

  const inputClass = (error?: string) =>
    cn(
      "h-12 w-full rounded-card border bg-white px-4 text-base text-heading focus-visible:ring-2 focus-visible:outline-none",
      error ? "border-danger focus-visible:ring-danger/25" : "border-input focus-visible:border-brand focus-visible:ring-brand/25",
    );

  return (
    <form onSubmit={submit} noValidate className="mt-5 space-y-5">
      <p className="rounded-card bg-surface px-4 py-3 text-sm text-heading">
        El pago con tarjeta estará disponible muy pronto. Mientras tanto puedes completar tu compra con transferencia o
        depósito.
      </p>

      <CardField id="tarjeta-nombre" label="Nombre completo" error={errors.name}>
        <input
          id="tarjeta-nombre"
          autoComplete="cc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "tarjeta-nombre-error" : undefined}
          className={inputClass(errors.name)}
        />
      </CardField>

      <CardField id="tarjeta-banco" label="Banco" error={errors.bank}>
        <div className="relative">
          <select
            id="tarjeta-banco"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            aria-invalid={Boolean(errors.bank)}
            aria-describedby={errors.bank ? "tarjeta-banco-error" : undefined}
            className={cn(inputClass(errors.bank), "cursor-pointer appearance-none pr-10", !bank && "text-muted-foreground")}
          >
            <option value="" disabled>
              Elige tu banco
            </option>
            {BANKS.map((b) => (
              <option key={b} value={b} className="text-heading">
                {b}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-brand"
          />
        </div>
      </CardField>

      <CardField id="tarjeta-numero" label="Número de tarjeta" error={errors.number} hint={digits.length >= 2 ? brand : undefined}>
        <input
          id="tarjeta-numero"
          autoComplete="cc-number"
          inputMode="numeric"
          placeholder="0000 0000 0000 0000"
          value={formatCardNumber(digits)}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 19))}
          aria-invalid={Boolean(errors.number)}
          aria-describedby={errors.number ? "tarjeta-numero-error" : undefined}
          className={cn(inputClass(errors.number), "tracking-wider tabular-nums")}
        />
      </CardField>

      <CardField id="tarjeta-cvv" label="CVV" error={errors.cvv} hint={`${cvvLength} dígitos al reverso`}>
        <input
          id="tarjeta-cvv"
          type="password"
          autoComplete="cc-csc"
          inputMode="numeric"
          maxLength={cvvLength}
          value={cvv}
          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, cvvLength))}
          aria-invalid={Boolean(errors.cvv)}
          aria-describedby={errors.cvv ? "tarjeta-cvv-error" : undefined}
          className={cn(inputClass(errors.cvv), "max-w-32 tracking-widest tabular-nums")}
        />
      </CardField>

      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-brand font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        <LockIcon className="size-4" aria-hidden="true" />
        Guardar tarjeta
      </button>
    </form>
  );
}

function CardField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[0.9375rem] font-medium text-heading">
        {label}
        {hint && !error && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
