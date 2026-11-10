// Medidas a la medida de las persianas: ancho, alto y lado de la cadena. Sin dependencias de servidor:
// lo usan la ficha (formulario), el carrito y el pedido (que lo vuelve a validar).
// Los límites salen de la ficha técnica del producto ("Ancho: 15 a 300 cm", "Alto: 50 a 400 cm").

export type ChainSide = "izquierdo" | "derecho";
export type BlindSize = { ancho: number; alto: number; lado: ChainSide };
export type Range = { min: number; max: number };
export type BlindSizeLimits = { ancho: Range; alto: Range };
export type BlindSizeErrors = Partial<Record<"ancho" | "alto" | "lado", string>>;

// Medida con la que abre el formulario (se ajusta a los límites si queda fuera).
export const DEFAULT_BLIND_CM = 100;

function parseRange(value: string | undefined): Range | null {
  const match = value?.match(/([\d.]+)\s*a\s*([\d.]+)/);
  if (!match) return null;
  const [min, max] = [Number(match[1]), Number(match[2])];
  return Number.isFinite(min) && Number.isFinite(max) && min < max ? { min, max } : null;
}

// Solo las persianas tienen "Ancho" y "Alto" con rango en su ficha técnica.
export function blindSizeLimits(specs: { label: string; value: string }[]): BlindSizeLimits | null {
  const ancho = parseRange(specs.find((s) => s.label === "Ancho")?.value);
  const alto = parseRange(specs.find((s) => s.label === "Alto")?.value);
  return ancho && alto ? { ancho, alto } : null;
}

const cm = (n: number) => n.toLocaleString("es-MX", { maximumFractionDigits: 1 });

export function validateBlindSize(size: Partial<BlindSize>, limits: BlindSizeLimits): BlindSizeErrors {
  const errors: BlindSizeErrors = {};
  for (const key of ["ancho", "alto"] as const) {
    const value = size[key];
    const { min, max } = limits[key];
    const name = key === "ancho" ? "El ancho" : "El alto";
    if (value === undefined || !Number.isFinite(value)) errors[key] = `Escribe ${key === "ancho" ? "el ancho" : "el alto"} en centímetros.`;
    else if (value < min || value > max) errors[key] = `${name} debe ser de ${cm(min)} a ${cm(max)} cm.`;
  }
  if (size.lado !== "izquierdo" && size.lado !== "derecho") errors.lado = "Elige de qué lado va la cadena.";
  return errors;
}

// "Medidas: 120 cm x 100 cm, cadena lado izquierdo." (ancho x alto). Se muestra en la ficha, el carrito
// y el pedido.
export const blindSizeLabel = (size: BlindSize) =>
  `Medidas: ${cm(size.ancho)} cm x ${cm(size.alto)} cm, cadena lado ${size.lado}.`;

// Identifica la medida dentro del carrito: la misma persiana con otra medida es otra línea.
export const blindSizeKey = (size: BlindSize | undefined) =>
  size ? `${size.ancho}x${size.alto}-${size.lado}` : "";

// Lo que manda el navegador: números con hasta un decimal y un lado válido.
export function parseBlindSize(raw: unknown): BlindSize | null {
  if (!raw || typeof raw !== "object") return null;
  const { ancho, alto, lado } = raw as Record<string, unknown>;
  const toCm = (v: unknown) => Math.round(Number(v) * 10) / 10;
  const size = { ancho: toCm(ancho), alto: toCm(alto), lado: lado as ChainSide };
  if (!Number.isFinite(size.ancho) || !Number.isFinite(size.alto)) return null;
  return size.lado === "izquierdo" || size.lado === "derecho" ? size : null;
}
