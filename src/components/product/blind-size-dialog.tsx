"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DEFAULT_BLIND_CM,
  validateBlindSize,
  type BlindSize,
  type BlindSizeErrors,
  type BlindSizeLimits,
  type ChainSide,
} from "@/lib/blind-size";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limits: BlindSizeLimits;
  value: BlindSize | null;
  onSave: (size: BlindSize) => void;
  // Texto extra arriba del formulario (p. ej. al intentar comprar sin medidas).
  notice?: string;
};

// Formulario "Personaliza tu producto" de las persianas: alto, ancho y lado de la cadena. Abre con
// 100 cm (ajustado a los límites) y no deja guardar medidas fuera de lo que admite la persiana.
export function BlindSizeDialog({ open, onOpenChange, limits, value, onSave, notice }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 rounded-[28px] p-6 sm:max-w-md sm:p-8">
        <DialogTitle className="border-b border-line pb-4 text-2xl font-bold text-heading">
          Personaliza tu producto
        </DialogTitle>
        <DialogDescription className="sr-only">
          Captura el alto y el ancho de tu ventana en centímetros y elige el lado de la cadena.
        </DialogDescription>
        {/* Se monta al abrir: así cada apertura parte de la medida guardada (o de 100 cm). */}
        {open && <SizeForm limits={limits} value={value} notice={notice} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  );
}

const clamp = (n: number, { min, max }: { min: number; max: number }) => Math.min(Math.max(n, min), max);

function SizeForm({ limits, value, notice, onSave }: Omit<Props, "open" | "onOpenChange">) {
  const [alto, setAlto] = useState(String(value?.alto ?? clamp(DEFAULT_BLIND_CM, limits.alto)));
  const [ancho, setAncho] = useState(String(value?.ancho ?? clamp(DEFAULT_BLIND_CM, limits.ancho)));
  const [lado, setLado] = useState<ChainSide>(value?.lado ?? "izquierdo");
  const [errors, setErrors] = useState<BlindSizeErrors>({});

  const toNumber = (text: string) => (text.trim() === "" ? NaN : Number(text.replace(",", ".")));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const size = { alto: toNumber(alto), ancho: toNumber(ancho), lado };
    const found = validateBlindSize(size, limits);
    setErrors(found);
    if (Object.keys(found).length === 0) onSave(size);
  }

  return (
    <form onSubmit={submit} noValidate className="mt-5 space-y-5">
      {notice && <p className="rounded-card bg-surface px-4 py-3 text-sm text-heading">{notice}</p>}
      <div className="grid grid-cols-2 gap-4">
        <NumberField
          id="medida-alto"
          label="Alto (cm)"
          value={alto}
          onChange={setAlto}
          range={limits.alto}
          error={errors.alto}
        />
        <NumberField
          id="medida-ancho"
          label="Ancho (cm)"
          value={ancho}
          onChange={setAncho}
          range={limits.ancho}
          error={errors.ancho}
        />
      </div>

      <div>
        <label htmlFor="medida-lado" className="mb-1.5 block text-[0.9375rem] font-medium text-heading">
          Lado de cadena<span className="text-danger"> *</span>
        </label>
        <div className="relative">
          <select
            id="medida-lado"
            value={lado}
            onChange={(e) => setLado(e.target.value as ChainSide)}
            className="h-12 w-full cursor-pointer appearance-none rounded-card border border-input bg-white pr-10 pl-4 text-base text-heading focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none"
          >
            <option value="izquierdo">Izquierdo</option>
            <option value="derecho">Derecho</option>
          </select>
          <ChevronDownIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-brand"
          />
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center rounded-pill bg-brand font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        Guardar medidas
      </button>
    </form>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  range,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  range: { min: number; max: number };
  error?: string;
}) {
  const hintId = `${id}-ayuda`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.9375rem] font-medium text-heading">
        {label}
        <span className="text-danger"> *</span>
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={range.min}
        max={range.max}
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={hintId}
        className={cn(
          "h-12 w-full [appearance:textfield] rounded-card border bg-white px-4 text-base text-heading tabular-nums focus-visible:ring-2 focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          error
            ? "border-danger focus-visible:ring-danger/25"
            : "border-input focus-visible:border-brand focus-visible:ring-brand/25",
        )}
      />
      <p id={hintId} className={cn("mt-1.5 text-xs", error ? "text-danger" : "text-muted-foreground")}>
        {error ?? `De ${range.min} a ${range.max} cm`}
      </p>
    </div>
  );
}
