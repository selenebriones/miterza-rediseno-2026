import type { Config } from "tailwindcss";

/**
 * Mi Terza — tokens de diseño.
 *
 * Tailwind v4 lo carga desde src/app/globals.css con `@config`.
 *
 * Reglas de contraste (WCAG 2.1, verificadas):
 *  - brand (#00514a) sobre blanco: 9.23:1  → apto para texto y botones.
 *  - body (#555555) sobre blanco: 7.46:1, sobre surface: 6.93:1  → AA/AAA.
 *  - accent (#bcdc00) sobre blanco: 1.57:1  → NUNCA como color de texto sobre fondo claro.
 *    Úsalo como fondo con texto brand (5.88:1) o heading (13.38:1),
 *    o como texto sobre fondo brand (5.88:1).
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    // Mobile-first: las clases sin prefijo son móvil; cada prefijo aplica "de aquí hacia arriba".
    screens: {
      xs: "400px", // teléfonos grandes: 2 columnas en grids de producto
      sm: "640px", // teléfono horizontal / tablet chica
      md: "768px", // tablet vertical
      lg: "1024px", // desktop: header completo y filtros en sidebar
      xl: "1280px",
      "2xl": "1440px", // ancho máximo del contenedor
    },
    container: {
      center: true,
      padding: { DEFAULT: "1rem", md: "1.5rem", lg: "2rem" },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#00514a",
          hover: "#00413b",
          active: "#003530",
          50: "#e6eeed",
          100: "#cce0de",
        },
        accent: {
          DEFAULT: "#bcdc00",
          hover: "#a9c600",
          soft: "#f3f9cc",
          light: "#d5fe7d", // fondo del botón de búsqueda del header (igual que terza.com)
        },
        sale: "#ffa202", // píldora de descuento con texto blanco (a petición de la usuaria)
        surface: "#f0fae5",
        cream: "#f9f8f5", // fondo del footer (igual que terza-sitio)
        mist: "#f3f4ee", // fondo de secciones secundarias (relacionados)
        heading: "#000000",
        body: "#555555",
        // `muted` / `muted-foreground` (#767676, 4.54:1) los define globals.css para shadcn.
        line: "#e2e8df", // bordes y separadores
        success: "#1f7a3a",
        warning: "#9a5b00",
        danger: "#b42318",
      },
      fontFamily: {
        sans: ["var(--font-roobert)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Base 16px para evitar zoom automático en inputs de iOS.
        "display-sm": ["2rem", { lineHeight: "1.1", fontWeight: "700" }],
        "display-lg": ["3.5rem", { lineHeight: "1.05", fontWeight: "700" }],
      },
      spacing: {
        tap: "2.75rem", // 44px: área táctil mínima (WCAG 2.5.5 / Apple HIG)
        header: "4rem", // alto del header móvil
        "header-lg": "7.5rem", // alto del header desktop (barra principal + categorías)
      },
      borderRadius: {
        card: "1rem",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 81 74 / 0.06), 0 4px 12px rgb(0 81 74 / 0.06)",
        "card-hover": "0 2px 4px rgb(0 81 74 / 0.08), 0 12px 24px rgb(0 81 74 / 0.12)",
        sticky: "0 -4px 16px rgb(0 0 0 / 0.08)", // barra de compra fija en PDP móvil
      },
      zIndex: {
        header: "40",
        drawer: "50",
        toast: "60",
      },
      keyframes: {
        "cart-bump": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
        },
        // Acercamiento lento de la foto del hero y entrada del texto.
        "hero-zoom": { from: { transform: "scale(1)" }, to: { transform: "scale(1.08)" } },
        "hero-rise": {
          from: { opacity: "0", transform: "translateY(1.5rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "cart-bump": "cart-bump 300ms ease-out",
        "hero-zoom": "hero-zoom 9s ease-out forwards",
        "hero-rise": "hero-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
};

export default config;
