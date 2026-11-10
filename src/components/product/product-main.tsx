"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  InfoIcon,
  MinusIcon,
  PhoneIcon,
  PlusIcon,
  RulerIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { MAX_PER_LINE } from "@/lib/cart-types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useScrolledPast } from "@/hooks/use-scrolled-past";
import { blindSizeLabel, blindSizeLimits, type BlindSize } from "@/lib/blind-size";
import type { ProductDetail, ProductVariant } from "@/lib/products";
import { formatPrice, formatProductPrice, storeConfig } from "@/lib/store-config";
import { boxLabel, formatArea, pricePerArea } from "@/lib/unit-price";
import { cn } from "@/lib/utils";
import { BlindSizeDialog } from "./blind-size-dialog";
import { BoxCalculator } from "./box-calculator";
import { ProductGallery } from "./product-gallery";
import { VariantSelector } from "./variant-selector";

const MAX_PER_ORDER = MAX_PER_LINE;

export function ProductMain({ product }: { product: ProductDetail }) {
  const [variant, setVariant] = useState<ProductVariant>(
    () => product.variants.find((v) => v.stock > 0) ?? product.variants[0],
  );
  const [quantity, setQuantity] = useState(1);
  // Persianas: medida a la medida (alto, ancho y lado de cadena) que se captura en "Personaliza tu producto".
  const sizeLimits = blindSizeLimits(product.features);
  const [size, setSize] = useState<BlindSize | null>(null);
  const [sizeOpen, setSizeOpen] = useState(false);
  // Si el formulario se abrió al intentar comprar sin medidas, al guardar se agrega al carrito.
  const [pendingAdd, setPendingAdd] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  // Cajas agregadas con la calculadora en esta visita (se suman si se usa varias veces).
  const [calculatorBoxes, setCalculatorBoxes] = useState(0);
  const ctaRef = useRef<HTMLDivElement>(null);
  // Barra fija en móvil cuando el botón principal ya salió de la pantalla por arriba.
  const showStickyBar = useScrolledPast(ctaRef);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { addItem, setOpen } = useCart();

  const maxQuantity = Math.min(variant.stock, MAX_PER_ORDER);
  const inStock = variant.stock > 0;
  const lowStock = inStock && variant.stock <= variant.lowStockAlert;
  const discount =
    variant.compareAtPrice && variant.compareAtPrice > variant.price
      ? Math.round((1 - variant.price / variant.compareAtPrice) * 100)
      : null;
  const variantLabel = Object.values(variant.options).join(" · ");
  // Una sola opción de texto (la medida de los tapetes): selector desplegable a la derecha del precio.
  // Con colores (muestras) o varias opciones se usan los botones de VariantSelector.
  const dropdownOption =
    product.options.length === 1 && !product.options[0].values.some((v) => v.swatch) ? product.options[0] : null;
  // Igual que en miterza.com, los tapetes muestran el SKU del color (el de su ficha) aunque cambie la
  // medida; el SKU de cada medida se sigue guardando en el carrito y en el pedido.
  const shownSku = (dropdownOption && product.features.find((f) => f.label === "SKU")?.value) || variant.sku;
  // Pisos: el precio de la variante es por caja; se muestra por m² y debajo el costo de la caja.
  const area = product.areaPerBox;
  const shownPrice = pricePerArea(variant.price, area);
  const shownCompareAt = variant.compareAtPrice ? pricePerArea(variant.compareAtPrice, area) : null;
  const unit = area ? <span className="text-[0.6em] font-semibold">/m²</span> : null;

  // Si el color elegido tiene foto propia, la galería salta a ella.
  const focusIndex = (() => {
    const index = product.images.findIndex(
      (img) => img.variantOption && Object.values(variant.options).includes(img.variantOption),
    );
    return index === -1 ? undefined : index;
  })();

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  function selectVariant(next: ProductVariant) {
    setVariant(next);
    setQuantity((q) => Math.max(1, Math.min(q, Math.min(next.stock, MAX_PER_ORDER))));
  }

  function addToCart(count = quantity, chosenSize = size) {
    if (!inStock) return;
    if (sizeLimits && !chosenSize) {
      setPendingAdd(count);
      setSizeOpen(true);
      return;
    }
    addItem(
      {
        variantId: variant.id,
        slug: product.slug,
        name: product.name,
        variantLabel: chosenSize
          ? blindSizeLabel(chosenSize)
          : (area ? boxLabel(area) : variantLabel) || undefined,
        price: variant.price,
        imageUrl: product.images[0]?.url ?? null,
        size: chosenSize ?? undefined,
      },
      count,
    );
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 2000);
    setOpen(true);
  }

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7">
        <ProductGallery images={product.images} productName={product.name} focusIndex={focusIndex} />
      </div>

      {/* Desktop: la columna queda fija al hacer scroll, el botón siempre está a la vista. */}
      <div className="mt-6 lg:col-span-5 lg:mt-0">
        <div className="lg:sticky lg:top-32">
          <Link
            href={`/productos?categoria=${product.lineSlug}`}
            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase hover:text-brand"
          >
            {product.line === product.category ? product.category : `${product.category} · ${product.line}`}
          </Link>
          <h1 className="mt-1.5 text-2xl leading-tight font-bold text-balance lg:text-[2rem]">{product.name}</h1>
          {product.format && <p className="mt-2 text-[0.9375rem]">Formato: {product.format}</p>}
          <p className="mt-1 border-b border-line pb-4 text-sm text-muted-foreground">
            SKU <span className="ml-1.5 tracking-wide">{shownSku}</span>
          </p>

          {/* Precio a la izquierda; en pisos, la calculadora de cajas arriba a la derecha. */}
          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div aria-live="polite" className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  className={
                    shownPrice > 0
                      ? "text-[1.75rem] font-bold text-heading transition-all"
                      : "text-lg font-semibold text-muted-foreground"
                  }
                >
                  {formatProductPrice(shownPrice)}
                  {unit}
                  {area && <span className="sr-only"> por metro cuadrado</span>}
                </span>
                {discount && shownCompareAt && (
                  <>
                    <s className="text-lg text-muted-foreground">
                      <span className="sr-only">Precio anterior: </span>
                      {formatPrice(shownCompareAt)}
                    </s>
                    <span className="rounded-pill bg-sale px-2.5 py-1 text-xs font-bold text-white">
                      -{discount}%
                    </span>
                  </>
                )}
              </div>
              {product.options.length > 0 && <p className="mt-1 text-sm">Precio para: {variantLabel}</p>}
              {size && <p className="mt-1 text-sm font-semibold text-brand">{blindSizeLabel(size)}</p>}
              {/* Sin medidas todavía: invitación a capturarlas (abre el mismo formulario que el ícono). */}
              {sizeLimits && !size && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingAdd(null);
                    setSizeOpen(true);
                  }}
                  aria-haspopup="dialog"
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                  <RulerIcon className="size-4" aria-hidden="true" />
                  Personaliza con tus medidas
                </button>
              )}
              {area && (
                <p className="mt-1.5 text-[0.9375rem] font-semibold text-heading">
                  {formatArea(area)} m² x caja: <span className="ml-1">{formatPrice(variant.price)}</span>
                </p>
              )}
            </div>
            {dropdownOption && (
              <OptionDropdown
                option={dropdownOption}
                variants={product.variants}
                selected={variant}
                onSelect={selectVariant}
              />
            )}
            {/* Persianas: medidas a la medida, con el mismo estilo que la calculadora de cajas. */}
            {sizeLimits && (
              <button
                type="button"
                onClick={() => {
                  setPendingAdd(null);
                  setSizeOpen(true);
                }}
                aria-haspopup="dialog"
                aria-describedby="medidas-ayuda"
                className="group/size relative grid size-16 shrink-0 place-items-center rounded-2xl bg-accent-light text-brand transition-colors hover:bg-accent focus-visible:bg-accent"
              >
                <RulerIcon className="size-8" strokeWidth={1.5} aria-hidden="true" />
                <span className="sr-only">{size ? "Editar medidas" : "Personaliza tu producto"}</span>
                {/* Leyenda al pasar el cursor o al enfocar con teclado. */}
                <span
                  id="medidas-ayuda"
                  role="tooltip"
                  className="pointer-events-none absolute top-full right-0 z-10 mt-2 rounded-lg bg-heading px-3 py-2 text-sm font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/size:opacity-100 group-focus-visible/size:opacity-100"
                >
                  {size ? "Edita las medidas de tu persiana" : "Personaliza tu producto con tus medidas"}
                </span>
              </button>
            )}
            {area && (
              <BoxCalculator
                areaPerBox={area}
                boxPrice={variant.price}
                maxBoxes={maxQuantity}
                onApply={(boxes) => {
                  addToCart(boxes);
                  setCalculatorBoxes((n) => n + boxes);
                }}
              />
            )}
          </div>

          {product.options.length > 0 && !dropdownOption && (
            <div className="mt-6 border-t border-line pt-6">
              <VariantSelector
                options={product.options}
                variants={product.variants}
                selected={variant}
                onSelect={selectVariant}
              />
            </div>
          )}

          {sizeLimits && (
            <>
              <BlindSizeDialog
                open={sizeOpen}
                onOpenChange={(open) => {
                  setSizeOpen(open);
                  if (!open) setPendingAdd(null);
                }}
                limits={sizeLimits}
                value={size}
                notice={pendingAdd !== null ? "Agrega las medidas de tu persiana para agregarla al carrito." : undefined}
                onSave={(next) => {
                  setSize(next);
                  setSizeOpen(false);
                  if (pendingAdd !== null) addToCart(pendingAdd, next);
                  setPendingAdd(null);
                }}
              />
            </>
          )}

          <p aria-live="polite" className="mt-6 flex items-center gap-2 text-[0.9375rem] font-medium">
            <span
              aria-hidden="true"
              className={cn(
                "size-2.5 rounded-full",
                !inStock ? "bg-muted-foreground" : lowStock ? "bg-danger" : "bg-success",
              )}
            />
            {!inStock ? (
              <span className="text-body">
                {product.options.length > 0
                  ? "Agotado en esta combinación. Prueba con otra medida o color."
                  : "Agotado"}
              </span>
            ) : lowStock ? (
              <span className="text-danger">¡Últimas {variant.stock} piezas!</span>
            ) : (
              <span className="text-success">Disponible</span>
            )}
          </p>

          <div ref={ctaRef} className="mt-4 flex gap-3">
            <QuantityStepper value={quantity} max={maxQuantity} onChange={setQuantity} disabled={!inStock} />
            <AddButton inStock={inStock} added={added} onClick={() => addToCart()} className="flex-1" />
          </div>

          {area && calculatorBoxes > 0 && (
            <p
              role="status"
              className="mt-3 flex items-start gap-2 rounded-card bg-surface px-4 py-3 text-sm text-heading"
            >
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              <span>
                Agregaste{" "}
                <strong>
                  {calculatorBoxes} {calculatorBoxes === 1 ? "caja" : "cajas"} ({formatArea(calculatorBoxes * area)} m²)
                </strong>{" "}
                al carrito con la calculadora.{" "}
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="font-semibold whitespace-nowrap text-brand underline underline-offset-2"
                >
                  Ver carrito
                </button>
              </span>
            </p>
          )}

          {product.description.length > 0 && (
            <div className="mt-6 space-y-3 border-t border-line pt-6">
              <h2 className="text-lg font-semibold text-heading">Descripción</h2>
              {product.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          )}

          {/* Ficha técnica: cerrada por defecto para no alejar los beneficios y el botón de compra. */}
          {(product.features.length > 0 || product.installVideoUrl) && (
            <Accordion type="multiple" className="mt-6 border-y border-line">
              {product.features.length > 0 && (
                <AccordionItem value="caracteristicas" className="border-none">
                  <AccordionTrigger className="min-h-14 items-center py-0 text-lg font-semibold text-heading hover:no-underline">
                    Características
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-base">
                    <dl className="divide-y divide-line overflow-hidden rounded-card border border-line">
                      {product.features.map((feature) => (
                        <div
                          key={feature.label}
                          className="grid gap-1 bg-white px-4 py-3 even:bg-[#f3f4ef] sm:grid-cols-3 sm:gap-4"
                        >
                          <dt className="font-medium text-heading">{feature.label}</dt>
                          <dd className="sm:col-span-2">{feature.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </AccordionContent>
                </AccordionItem>
              )}
              {/* Persianas: tutorial de medidas e instalación, también cerrado al inicio. */}
              {product.installVideoUrl && (
                <AccordionItem value="instalacion" className="border-t border-line">
                  <AccordionTrigger className="min-h-14 items-center py-0 text-lg font-semibold text-heading hover:no-underline">
                    Medidas e instalación
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-5 text-base">
                    <p>Mira paso a paso cómo medir tu ventana e instalar tu persiana {product.line.toLowerCase()}.</p>
                    <a
                      href={product.installVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-tap items-center gap-2 font-semibold text-brand no-underline hover:underline"
                    >
                      Ver tutorial en YouTube
                      <ExternalLinkIcon className="size-4" aria-hidden="true" />
                      <span className="sr-only">(se abre en otra pestaña)</span>
                    </a>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}

          <ul className="mt-6 space-y-3 rounded-card bg-surface p-4 text-sm">
            <li className="flex gap-3">
              <TruckIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <span>
                <strong className="text-heading">Envío gratis</strong> en compras desde{" "}
                {formatPrice(storeConfig.freeShippingThreshold)}
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldCheckIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <span>
                <strong className="text-heading">Garantía Terza</strong> y más de 40 años de respaldo
              </span>
            </li>
            <li className="flex gap-3">
              <RotateCcwIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <span>
                Consulta nuestra{" "}
                <Link href="/politicas/devoluciones" className="font-medium text-brand underline underline-offset-2">
                  política de devoluciones
                </Link>
              </span>
            </li>
            <li className="flex gap-3">
              <PhoneIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <span>
                ¿Dudas con la medida?{" "}
                <a
                  href={storeConfig.supportPhoneHref}
                  className="font-medium whitespace-nowrap text-brand underline underline-offset-2"
                >
                  {storeConfig.supportPhone}
                </a>
              </span>
            </li>
            {/* Aviso del cliente (como en miterza.com). */}
            <li className="flex gap-3">
              <InfoIcon className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <span>El tiempo de entrega y la sucursal pueden variar dependiendo de la disponibilidad del producto.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Barra fija inferior (solo móvil). */}
      <div
        aria-hidden={!showStickyBar}
        className={cn(
          "fixed inset-x-0 bottom-0 z-header border-t border-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-sticky transition-transform duration-200 lg:hidden",
          showStickyBar ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-lg leading-tight font-bold text-heading">
              {formatProductPrice(variant.price)}
              {area && <span className="text-xs font-semibold"> /caja</span>}
            </p>
            <p className="truncate text-xs">
              {area ? `${formatArea(area)} m² por caja` : variantLabel || product.line}
            </p>
          </div>
          <AddButton
            inStock={inStock}
            added={added}
            onClick={() => addToCart()}
            compact
            tabIndex={showStickyBar ? 0 : -1}
          />
        </div>
      </div>
    </div>
  );
}

function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
}: {
  value: number;
  max: number;
  onChange: (update: (n: number) => number) => void;
  disabled: boolean;
}) {
  const buttonClass =
    "grid size-12 place-items-center rounded-full text-brand transition-colors hover:bg-surface disabled:text-muted-foreground disabled:hover:bg-transparent";
  return (
    <div className="flex items-center rounded-pill border border-input" role="group" aria-label="Cantidad">
      <button
        type="button"
        onClick={() => onChange((n) => Math.max(1, n - 1))}
        disabled={disabled || value <= 1}
        aria-label="Quitar una pieza"
        className={buttonClass}
      >
        <MinusIcon className="size-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" className="w-8 text-center font-semibold text-heading tabular-nums">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange((n) => Math.min(max, n + 1))}
        disabled={disabled || value >= max}
        aria-label="Agregar una pieza"
        className={buttonClass}
      >
        <PlusIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function AddButton({
  inStock,
  added,
  onClick,
  compact,
  className,
  tabIndex,
}: {
  inStock: boolean;
  added: boolean;
  onClick: () => void;
  compact?: boolean;
  className?: string;
  tabIndex?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!inStock}
      tabIndex={tabIndex}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-pill font-semibold whitespace-nowrap transition-colors",
        "px-6",
        !inStock
          ? "bg-line text-muted-foreground"
          : added
            ? "bg-accent text-brand"
            : "bg-brand text-white hover:bg-accent hover:text-brand active:bg-accent-hover",
        className,
      )}
    >
      {!inStock ? (
        "Agotado"
      ) : added ? (
        <>
          <CheckIcon className="size-5" aria-hidden="true" />
          Agregado
        </>
      ) : compact ? (
        "Agregar"
      ) : (
        "Agregar al carrito"
      )}
    </button>
  );
}

// Selector desplegable para una sola opción de texto (p. ej. la medida de los tapetes). Las medidas
// agotadas se pueden elegir para ver su precio, pero se marcan como agotadas.
function OptionDropdown({
  option,
  variants,
  selected,
  onSelect,
}: {
  option: ProductDetail["options"][number];
  variants: ProductVariant[];
  selected: ProductVariant;
  onSelect: (variant: ProductVariant) => void;
}) {
  const id = `opcion-${option.name.toLowerCase()}`;
  return (
    <div className="shrink-0">
      <label htmlFor={id} className="mb-1 block text-xs text-muted-foreground">
        {option.name}
      </label>
      <div className="relative">
        <select
          id={id}
          value={selected.options[option.name]}
          onChange={(e) => {
            const next = variants.find((v) => v.options[option.name] === e.target.value);
            if (next) onSelect(next);
          }}
          className="h-11 w-auto min-w-44 cursor-pointer appearance-none rounded-pill border border-brand bg-white pr-10 pl-4 text-[0.9375rem] text-heading focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none"
        >
          {option.values.map(({ value }) => {
            const variant = variants.find((v) => v.options[option.name] === value);
            return (
              <option key={value} value={value}>
                {value}
                {variant && variant.stock <= 0 ? " (agotada)" : ""}
              </option>
            );
          })}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-brand"
        />
      </div>
    </div>
  );
}
