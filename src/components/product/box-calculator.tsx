"use client";

import { useId, useState } from "react";
import { CalculatorIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/store-config";
import { formatArea } from "@/lib/unit-price";
import { cn } from "@/lib/utils";

type Mode = "area" | "size";
type Area = { id: number; mode: Mode; area: string; width: string; length: string };

// Margen para cortes y desperdicio que se suma a la superficie (práctica común al instalar pisos).
const WASTE = 0.1;

// Acepta coma o punto decimal; vacío o inválido cuenta como 0.
const toNumber = (text: string) => {
  const n = Number(text.replace(",", ".").trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const areaOf = (a: Area) => (a.mode === "area" ? toNumber(a.area) : toNumber(a.width) * toNumber(a.length));

type Props = {
  areaPerBox: number;
  boxPrice: number;
  maxBoxes: number; // existencias disponibles (y tope por compra)
  onApply: (boxes: number) => void; // agrega al carrito esa cantidad de cajas
};

// Calculadora de cajas para pisos: el cliente captura una o varias áreas (en m² o con ancho × largo) y
// se le sugiere cuántas cajas comprar según los m² por caja del producto.
export function BoxCalculator({ areaPerBox, boxPrice, maxBoxes, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const [areas, setAreas] = useState<Area[]>([{ id: 1, mode: "area", area: "", width: "", length: "" }]);
  const [withWaste, setWithWaste] = useState(true);

  const total = areas.reduce((sum, a) => sum + areaOf(a), 0);
  const needed = total * (withWaste ? 1 + WASTE : 1);
  const boxes = needed > 0 ? Math.ceil(needed / areaPerBox - 1e-9) : 0;
  const covered = boxes * areaPerBox;
  const overStock = boxes > maxBoxes;

  const update = (id: number, patch: Partial<Area>) =>
    setAreas((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const addArea = () =>
    setAreas((list) => [
      ...list,
      {
        id: Math.max(...list.map((a) => a.id)) + 1,
        mode: list.at(-1)?.mode ?? "area",
        area: "",
        width: "",
        length: "",
      },
    ]);
  const removeArea = (id: number) => setAreas((list) => list.filter((a) => a.id !== id));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-describedby={tooltipId}
        className="group/calc relative grid size-16 shrink-0 place-items-center rounded-2xl bg-accent-light text-brand transition-colors hover:bg-accent focus-visible:bg-accent"
      >
        <CalculatorIcon className="size-8" strokeWidth={1.5} aria-hidden="true" />
        <span className="sr-only">Calculadora de cajas</span>
        {/* Leyenda al pasar el cursor o al enfocar con teclado. */}
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute top-full right-0 z-10 mt-2 rounded-lg bg-heading px-3 py-2 text-sm font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/calc:opacity-100 group-focus-visible/calc:opacity-100"
        >
          Calcula cuántas cajas necesitas
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-line p-5 pr-12 text-left">
            <DialogTitle className="text-xl font-bold text-heading">¿Cuántas cajas necesitas?</DialogTitle>
            <DialogDescription>
              Agrega cada área donde instalarás el piso. Cada caja cubre {formatArea(areaPerBox)} m².
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {areas.map((area, index) => (
              <AreaFields
                key={area.id}
                area={area}
                index={index}
                canRemove={areas.length > 1}
                onChange={(patch) => update(area.id, patch)}
                onRemove={() => removeArea(area.id)}
              />
            ))}

            <button
              type="button"
              onClick={addArea}
              className="flex min-h-tap w-full items-center justify-center gap-2 rounded-card border border-dashed border-brand/40 font-semibold text-brand transition-colors hover:bg-surface"
            >
              <PlusIcon className="size-4" aria-hidden="true" />
              Agregar otra área
            </button>

            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={withWaste}
                onChange={(e) => setWithWaste(e.target.checked)}
                className="mt-0.5 size-4 accent-brand"
              />
              <span>
                Sumar 10 % por cortes y desperdicio <span className="text-muted-foreground">(recomendado)</span>
              </span>
            </label>
          </div>

          {/* Resultado siempre visible al pie de la ventana. */}
          <div aria-live="polite" className="border-t border-line bg-surface p-5">
            {boxes > 0 ? (
              <>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm">Te sugerimos</p>
                    <p className="text-2xl font-bold text-heading">
                      {boxes} {boxes === 1 ? "caja" : "cajas"}
                    </p>
                  </div>
                  <p className="text-right text-lg font-bold text-heading">{formatPrice(boxes * boxPrice)}</p>
                </div>
                <p className="mt-1 text-sm">
                  Superficie: {formatArea(total)} m²{withWaste && ` + 10 % = ${formatArea(needed)} m²`} · Cubren{" "}
                  {formatArea(covered)} m²
                </p>
                {overStock && (
                  <p className="mt-2 text-sm font-semibold text-warning">
                    Por ahora tenemos {maxBoxes} {maxBoxes === 1 ? "caja disponible" : "cajas disponibles"}. Llámanos
                    para surtir el resto.
                  </p>
                )}
                <button
                  type="button"
                  disabled={maxBoxes === 0}
                  onClick={() => {
                    onApply(Math.min(boxes, maxBoxes));
                    setOpen(false);
                  }}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-pill bg-brand font-semibold text-white transition-colors hover:bg-brand-hover disabled:bg-muted disabled:text-muted-foreground"
                >
                  Agregar {Math.min(boxes, maxBoxes)} {Math.min(boxes, maxBoxes) === 1 ? "caja" : "cajas"} al carrito
                </button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Cálculo aproximado. Si tienes dudas con tus medidas, llámanos.
                </p>
              </>
            ) : (
              <p className="text-sm">Captura las medidas de al menos un área para ver cuántas cajas necesitas.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AreaFields({
  area,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  area: Area;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<Area>) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const value = areaOf(area);

  return (
    <fieldset className="rounded-card border border-line p-4">
      <legend className="sr-only">Área {index + 1}</legend>
      <div className="flex min-h-tap items-center justify-between gap-3">
        <p aria-hidden="true" className="font-semibold text-heading">
          Área {index + 1}
        </p>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Quitar área ${index + 1}`}
            className="-mr-2 grid size-tap place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-danger"
          >
            <Trash2Icon className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Dos formas de capturar: superficie directa o ancho × largo. */}
      <div
        role="radiogroup"
        aria-label="Cómo capturar el área"
        className="mt-2 grid grid-cols-2 rounded-pill bg-mist p-1 text-sm"
      >
        {(
          [
            ["area", "Metros cuadrados"],
            ["size", "Ancho × largo"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={area.mode === mode}
            onClick={() => onChange({ mode })}
            className={cn(
              "h-9 rounded-pill font-medium transition-colors",
              area.mode === mode ? "bg-white text-brand shadow-sm" : "text-body hover:text-brand",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {area.mode === "area" ? (
        <NumberField
          id={`${id}-area`}
          label="Superficie"
          unit="m²"
          value={area.area}
          onChange={(v) => onChange({ area: v })}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id={`${id}-w`}
            label="Ancho"
            unit="m"
            value={area.width}
            onChange={(v) => onChange({ width: v })}
          />
          <NumberField
            id={`${id}-l`}
            label="Largo"
            unit="m"
            value={area.length}
            onChange={(v) => onChange({ length: v })}
          />
        </div>
      )}

      {area.mode === "size" && value > 0 && <p className="mt-2 text-sm">= {formatArea(value)} m²</p>}
    </fieldset>
  );
}

function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-3">
      <label htmlFor={id} className="text-sm font-medium text-heading">
        {label}
      </label>
      <div className="mt-1 flex h-12 items-center rounded-lg border border-input bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-heading outline-none"
        />
        <span className="pr-3 text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
