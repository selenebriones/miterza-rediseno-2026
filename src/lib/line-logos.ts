// Logos de las líneas de persianas (public/brand). Se muestran en la foto de la tarjeta según el
// atributo `linea` del producto; las líneas sin logo no muestran nada.
const LINE_LOGOS: Record<string, string> = {
  Optima: "/brand/logo_optima.webp",
  Select: "/brand/logo_select.webp",
  Stylo: "/brand/logo_stylo.webp",
};

export const lineLogo = (line: string | null | undefined) => (line ? (LINE_LOGOS[line] ?? null) : null);
