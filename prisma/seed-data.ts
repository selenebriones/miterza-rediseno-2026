// Datos para el seed de desarrollo (`npx prisma db seed`).
// El catálogo (categorías, productos, fichas técnicas y fotos) es el de terza-sitio: ver
// prisma/data/terza-catalogo.json. Todos los precios son un dummy de $1,000 (DUMMY_PRICE); las existencias son de prueba.
// Textos institucionales y tutoriales vienen de miterza.com.

const img = {
  optima: "/home/tutorial-optima.webp",
  stylo: "/home/tutorial-stylo.webp",
};

// Árbol de categorías de la tienda. Cada sección del menú agrupa categorías del catálogo de terza-sitio
// (prisma/data/terza-catalogo.json); Accesorios es una sola categoría. Igual que el menú de terza-sitio,
// las alfombras van dentro de Pisos.
export const SECTIONS: { slug: string; name: string; description: string; children: string[] }[] = [
  {
    slug: "pisos",
    name: "Pisos",
    description: "Pisos vinílicos, laminados, híbridos, de madera y alfombras para cada espacio.",
    children: ["piso-vinilico", "pisos-laminados", "pisos-hibridos", "pisos-de-madera", "alfombras"],
  },
  {
    slug: "muros",
    name: "Muros",
    description: "Lambrín, paneles, piedra flexible y follaje artificial para transformar tus muros.",
    children: ["paneles", "flexiroc", "muros-verdes"],
  },
  {
    slug: "persianas",
    name: "Persianas",
    description: "Control de luz y privacidad a la medida de tus ventanas.",
    children: ["persianas-enrollables", "persianas-de-madera"],
  },
  {
    slug: "exterior",
    name: "Exterior",
    description: "Deck, fachadas y pasto sintético que resisten sol y lluvia.",
    children: ["pisos-deck", "pasto-sintetico"],
  },
  { slug: "accesorios", name: "Accesorios", description: "", children: [] },
];

// PRECIO DUMMY (MXN): el catálogo de terza-sitio no trae precios. Todos los productos valen $1,000 para
// que sea evidente que el cliente debe cargar su precio final. Las ofertas de ejemplo se calculan sobre
// esa misma base (precio anterior $1,000 tachado y el precio con descuento).
export const DUMMY_PRICE = 1000;
export const DUMMY_DISCOUNTS = [10, 15, 20]; // % de las ofertas de ejemplo

// Pisos: se venden por caja y su precio dummy ($1,000) es por m². El catálogo solo trae los m² por caja
// de los pisos híbridos; para los demás se usa DUMMY_AREA_PER_BOX hasta que el cliente dé el dato real.
export const FLOOR_CATEGORIES = ["piso-vinilico", "pisos-laminados", "pisos-hibridos", "pisos-de-madera"];
export const DUMMY_AREA_PER_BOX = 2;

const OPTIMA_VIDEO = "https://www.youtube.com/watch?v=Gy_H-6jySkM";
const STYLO_VIDEO = "https://www.youtube.com/watch?v=Ku1VPnL1LvY";

// Tutorial de medidas e instalación por categoría.
export const INSTALL_VIDEOS: Record<string, string> = {
  "persianas-enrollables": OPTIMA_VIDEO,
};

export const HERO_BANNERS = [
  {
    title: "Calidez y confort para cada espacio",
    subtitle: "Alfombras que dan calidez, confort y mejor acústica a residencias, oficinas y hoteles.",
    ctaLabel: "Ver alfombras",
    ctaUrl: "/productos?categoria=alfombras",
    imageDesktop: "/home/hero-kids.webp",
    imageMobile: "/home/hero-kids-mobile.webp",
    imageAlt: "Bebé de pie junto a su cuna sobre un tapete rosa de pelo suave",
    theme: "light",
  },
  {
    title: "Crea el ambiente perfecto para tu espacio",
    subtitle: "Gran variedad de telas y componentes de la más alta calidad, con las mejores garantías.",
    ctaLabel: "Ver persianas",
    ctaUrl: "/productos?categoria=persianas",
    imageDesktop: "/home/hero-persianas.webp",
    imageMobile: "/home/hero-persianas-mobile.webp",
    imageAlt: "Hombre trabajando en su escritorio frente a una ventana con persiana enrollable",
    theme: "dark",
  },
];

// confirmar con el cliente: monto de envío gratis
export const ANNOUNCEMENT = {
  title: "Envío gratis en compras desde $999",
  ctaLabel: "Ver productos",
  ctaUrl: "/productos",
};

export const HOME_SECTIONS = [
  { type: "HERO_BANNERS", title: null, subtitle: null, settings: null },
  {
    type: "VALUE_PROPOSITION",
    title: "Por qué comprar en Mi Terza",
    subtitle: null,
    settings: {
      items: [
        {
          icon: "shield-check",
          title: "Garantía Terza",
          text: "Componentes de la más alta calidad, con las mejores garantías.",
        },
        { icon: "award", title: "Más de 40 años", text: "La empresa líder en superficies en México y Latinoamérica." },
        {
          icon: "palette",
          title: "Gran variedad de telas",
          text: "Texturas, colores y niveles de luz para cada espacio.",
        },
        { icon: "headset", title: "Asesoría experta", text: "Te ayudamos a elegir y medir:", showPhone: true },
      ],
    },
  },
  { type: "CATEGORY_CAROUSEL", title: "Categoría", subtitle: null, settings: null },
  { type: "FEATURED_PRODUCTS", title: "Nuevos productos", subtitle: null, settings: { limit: 12 } },
  {
    type: "INSTALL_GUIDE",
    title: "Mide e instala tus persianas paso a paso",
    subtitle: "Te mostramos cómo tomar medidas y colocarlas tú mismo, sin herramientas especiales.",
    settings: {
      eyebrow: "Guías | Instalación",
      tutorials: [
        { title: "Persianas enrollables", lines: "Optima y Select", videoUrl: OPTIMA_VIDEO, imageUrl: img.optima },
        { title: "Persianas de doble tela", lines: "Stylo", videoUrl: STYLO_VIDEO, imageUrl: img.stylo },
      ],
    },
  },
] as const;

export type MenuSeed = { label: string; category?: string; url?: string; highlight?: boolean; children?: MenuSeed[] };

export const MENUS: {
  location: "HEADER_MAIN" | "HEADER_TOP" | "FOOTER" | "FOOTER_LEGAL";
  name: string;
  items: MenuSeed[];
}[] = [
  {
    location: "HEADER_MAIN",
    name: "Menú principal",
    items: [
      // Una entrada por sección con sus categorías: el seed la arma a partir de SECTIONS.
      { label: "Ofertas", url: "/productos?ofertas=1", highlight: true },
    ],
  },
  {
    location: "HEADER_TOP",
    name: "Barra superior",
    items: [
      { label: "Nosotros", url: "/nosotros" },
      { label: "Preguntas frecuentes", url: "/preguntas-frecuentes" },
    ],
  },
  {
    location: "FOOTER",
    name: "Pie de página",
    items: [
      {
        label: "Tienda",
        children: [
          { label: "Pisos", category: "pisos" },
          { label: "Muros", category: "muros" },
          { label: "Persianas", category: "persianas" },
          { label: "Exterior", category: "exterior" },
          { label: "Accesorios", category: "accesorios" },
          { label: "Ofertas", url: "/productos?ofertas=1" },
          { label: "Todos los productos", url: "/productos" },
        ],
      },
      {
        label: "Ayuda",
        children: [
          { label: "Preguntas frecuentes", url: "/preguntas-frecuentes" },
          { label: "Mi cuenta", url: "/cuenta" },
          { label: "Mis pedidos", url: "/cuenta/pedidos" },
          { label: "Nosotros", url: "/nosotros" },
        ],
      },
    ],
  },
  {
    location: "FOOTER_LEGAL",
    name: "Legales",
    items: [
      { label: "Aviso de privacidad", url: "/politicas/privacidad" },
      { label: "Política de devoluciones", url: "/politicas/devoluciones" },
      { label: "Política de cancelación", url: "/politicas/cancelacion" },
      { label: "Política de cookies", url: "/politicas/cookies" },
    ],
  },
];

// Métodos de pago. Textos provisionales: el cliente confirma datos bancarios e instrucciones.
// Las pasarelas de tarjeta quedan deshabilitadas hasta tener sus llaves.
export const PAYMENT_METHODS = [
  {
    provider: "BANK_TRANSFER",
    name: "Transferencia o depósito",
    description: "Al confirmar tu pedido verás cómo realizar el pago.",
    instructions:
      "Te contactaremos por correo o teléfono para compartirte los datos bancarios. Preparamos tu pedido en cuanto confirmemos el pago.",
    isEnabled: true,
  },
  {
    provider: "STRIPE",
    name: "Tarjeta de crédito o débito",
    description: "Visa, Mastercard y American Express.",
    instructions: null,
    isEnabled: false,
  },
  {
    provider: "MERCADO_PAGO",
    name: "Mercado Pago",
    description: "Paga con tu cuenta, tarjeta o en efectivo.",
    instructions: null,
    isEnabled: false,
  },
] as const;
