// Datos de ejemplo para el seed de desarrollo (`npx prisma db seed`).
// Nombres de líneas, textos institucionales, tutoriales y redes vienen de miterza.com;
// productos, precios, existencias y fotos asignadas son de prueba.

export type ProductSeed = [
  name: string,
  line: string,
  price: number,
  compareAtPrice: number | null,
  imageUrl: string | null,
  imageAlt: string,
  stock: number,
  flags?: { isNew?: boolean; isFeatured?: boolean },
];

export const img = {
  optima: "/home/tutorial-optima.webp",
  optimaRoom: "/home/hero-persianas-mobile.webp",
  select: "/home/cat-persianas.webp",
  stylo: "/home/tutorial-stylo.webp",
  tapete: "/home/cat-tapetes.webp",
  kids: "/home/cat-kids.webp",
  kidsRoom: "/home/hero-kids-mobile.webp",
};

export const persianas: ProductSeed[] = [
  ["Persiana enrollable Optima Screen 5%", "Optima", 1650, 1940, img.optima, "Persiana enrollable Optima en tono arena sobre una ventana", 40, { isFeatured: true }],
  ["Persiana enrollable Optima Blackout", "Optima", 1890, null, img.optimaRoom, "Persiana enrollable Optima en una oficina con vista a la ciudad", 30],
  ["Persiana enrollable Optima Screen 3% Gris", "Optima", 1720, null, null, "", 14],
  ["Persiana enrollable Optima Translúcida Lino", "Optima", 1590, 1790, null, "", 9],
  ["Persiana enrollable Optima Blackout Térmica", "Optima", 2290, null, null, "", 0],
  ["Persiana enrollable Optima Screen 10% Blanco", "Optima", 1450, null, img.optima, "Persiana enrollable Optima clara", 22, { isNew: true }],
  ["Persiana Select Sheer Elegance", "Select", 2390, null, img.select, "Persiana sheer elegance gris en una ventana con flores", 25, { isNew: true, isFeatured: true }],
  ["Persiana Select Sheer Elegance Arena", "Select", 2390, 2690, null, "", 11],
  ["Persiana Select Duo Grafito", "Select", 2590, null, img.select, "Persiana de doble tela en tono grafito", 4],
  ["Persiana Select Duo Blanco", "Select", 2490, null, null, "", 16],
  ["Persiana Select Natural Bambú", "Select", 2890, null, null, "", 7, { isNew: true }],
  ["Persiana Select Blackout Perla", "Select", 2690, null, null, "", 13],
  ["Persiana Stylo Enrollable", "Stylo", 1490, null, img.stylo, "Persianas Stylo en una sala con muro de ladrillo", 22],
  ["Persiana Stylo Doble Tela Gris", "Stylo", 1790, 1990, img.stylo, "Persianas Stylo de doble tela en una sala", 18],
  ["Persiana Stylo Doble Tela Marfil", "Stylo", 1790, null, null, "", 3],
  ["Persiana Stylo Translúcida Blanca", "Stylo", 1290, null, null, "", 27],
];

export const tapetes: ProductSeed[] = [
  ["Tapete Trace Beige 120 × 170 cm", "Trace", 2190, null, img.tapete, "Tapete beige texturizado junto a una banca de madera", 3, { isFeatured: true }],
  ["Tapete Trace Gris 160 × 230 cm", "Trace", 3390, null, null, "", 12],
  ["Tapete Trace Arena 200 × 290 cm", "Trace", 4890, 5490, null, "", 6],
  ["Tapete Batique Gris 160 × 230 cm", "Batique", 3290, null, null, "", 12],
  ["Tapete Batique Azul 120 × 170 cm", "Batique", 2090, null, null, "", 0],
  ["Tapete Evoke Marfil 200 × 290 cm", "Evoke", 4590, null, null, "", 8],
  ["Tapete Evoke Carbón 160 × 230 cm", "Evoke", 3590, 3990, null, "", 10, { isNew: true }],
  ["Tapete Artifact Azul 160 × 230 cm", "Artifact", 3790, null, null, "", 6],
  ["Tapete Artifact Terracota 120 × 170 cm", "Artifact", 2490, null, null, "", 15],
  ["Tapete Kids Ultra Suave Rosa 133 × 190 cm", "Kids", 1990, 2490, img.kids, "Tapete rosa de pelo suave en una recámara infantil", 18, { isFeatured: true }],
  ["Tapete Kids Ultra Suave Rosa 100 × 150 cm", "Kids", 1490, null, img.kidsRoom, "Tapete rosa junto a una cuna", 20],
  ["Tapete Kids Ultra Suave Menta 133 × 190 cm", "Kids", 1990, null, null, "", 9, { isNew: true }],
  ["Tapete Kids Ultra Suave Lila 100 × 150 cm", "Kids", 1490, null, null, "", 2],
  ["Tapete Kids Ultra Suave Azul Cielo 133 × 190 cm", "Kids", 1990, null, null, "", 14],
];

export const BLIND_COLORS = [
  { value: "Blanco", swatch: "#f4f2ee" },
  { value: "Arena", swatch: "#d9cbb3" },
  { value: "Gris", swatch: "#8a8d8f" },
];

// Medidas ancho × alto con su factor de precio sobre la medida base.
export const BLIND_SIZES = [
  { value: "100 × 160 cm", factor: 1 },
  { value: "120 × 160 cm", factor: 1.2 },
  { value: "140 × 180 cm", factor: 1.5 },
  { value: "160 × 220 cm", factor: 1.9 },
];

// Fotos adicionales por categoría para armar galerías de prueba.
export const PHOTO_POOL: Record<string, { url: string; alt: string }[]> = {
  persianas: [
    { url: img.optima, alt: "Persiana enrollable en tono arena sobre una ventana" },
    { url: img.optimaRoom, alt: "Persiana enrollable en una oficina con vista a la ciudad" },
    { url: img.select, alt: "Persiana de doble tela gris junto a un arreglo de flores" },
    { url: img.stylo, alt: "Persianas de doble tela en una sala" },
  ],
  tapetes: [
    { url: img.tapete, alt: "Tapete beige texturizado junto a una banca de madera" },
    { url: img.kidsRoom, alt: "Tapete rosa en una recámara infantil" },
    { url: img.kids, alt: "Detalle del pelo suave de un tapete rosa" },
  ],
};

const OPTIMA_VIDEO = "https://www.youtube.com/watch?v=Gy_H-6jySkM";
const STYLO_VIDEO = "https://www.youtube.com/watch?v=Ku1VPnL1LvY";

export const CATEGORIES = [
  {
    slug: "persianas",
    name: "Persianas",
    description: "Control de luz y privacidad a la medida de tus ventanas.",
    imageUrl: "/home/cat-persianas.webp",
    showInHome: true,
    children: [
      { slug: "optima", name: "Optima", imageUrl: img.optima, showInHome: true, installVideoUrl: OPTIMA_VIDEO },
      { slug: "select", name: "Select", imageUrl: null, showInHome: false, installVideoUrl: OPTIMA_VIDEO },
      { slug: "stylo", name: "Stylo", imageUrl: img.stylo, showInHome: true, installVideoUrl: STYLO_VIDEO },
    ],
  },
  {
    slug: "tapetes",
    name: "Tapetes",
    description: "Texturas y colores para cada espacio de tu casa.",
    imageUrl: "/home/cat-tapetes.webp",
    showInHome: true,
    children: [
      { slug: "batique", name: "Batique", imageUrl: null, showInHome: false, installVideoUrl: null },
      { slug: "evoke", name: "Evoke", imageUrl: null, showInHome: false, installVideoUrl: null },
      { slug: "artifact", name: "Artifact", imageUrl: null, showInHome: false, installVideoUrl: null },
      { slug: "trace", name: "Trace", imageUrl: null, showInHome: false, installVideoUrl: null },
      { slug: "kids", name: "Kids", imageUrl: img.kids, showInHome: true, installVideoUrl: null },
    ],
  },
];

export const HERO_BANNERS = [
  {
    title: "Su primer mundo, más suave y seguro",
    subtitle: "Tapetes Terza Kids: ultra suaves, seguros y fáciles de limpiar. Para sus primeros pasos.",
    ctaLabel: "Ver tapetes Kids",
    ctaUrl: "/productos?categoria=kids",
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
export const ANNOUNCEMENT = { title: "Envío gratis en compras desde $999", ctaLabel: "Ver productos", ctaUrl: "/productos" };

export const HOME_SECTIONS = [
  { type: "HERO_BANNERS", title: null, subtitle: null, settings: null },
  {
    type: "VALUE_PROPOSITION",
    title: "Por qué comprar en Mi Terza",
    subtitle: null,
    settings: {
      items: [
        { icon: "shield-check", title: "Garantía Terza", text: "Componentes de la más alta calidad, con las mejores garantías." },
        { icon: "award", title: "Más de 40 años", text: "La empresa líder en superficies en México y Latinoamérica." },
        { icon: "palette", title: "Gran variedad de telas", text: "Texturas, colores y niveles de luz para cada espacio." },
        { icon: "headset", title: "Asesoría experta", text: "Te ayudamos a elegir y medir:", showPhone: true },
      ],
    },
  },
  { type: "CATEGORY_CAROUSEL", title: "Compra por categoría", subtitle: null, settings: null },
  { type: "FEATURED_PRODUCTS", title: "Productos destacados", subtitle: null, settings: { limit: 8 } },
  {
    type: "INSTALL_GUIDE",
    title: "Mide e instala tus persianas paso a paso",
    subtitle: "Te mostramos cómo tomar medidas y colocarlas tú mismo, sin herramientas especiales.",
    settings: {
      tutorials: [
        { title: "Persianas enrollables", lines: "Optima y Select", videoUrl: OPTIMA_VIDEO, imageUrl: img.optima },
        { title: "Persianas de doble tela", lines: "Stylo", videoUrl: STYLO_VIDEO, imageUrl: img.stylo },
      ],
    },
  },
] as const;

type MenuSeed = { label: string; category?: string; url?: string; highlight?: boolean; children?: MenuSeed[] };

export const MENUS: { location: "HEADER_MAIN" | "HEADER_TOP" | "FOOTER" | "FOOTER_LEGAL"; name: string; items: MenuSeed[] }[] = [
  {
    location: "HEADER_MAIN",
    name: "Menú principal",
    items: [
      { label: "Persianas", category: "persianas", children: [{ label: "Optima", category: "optima" }, { label: "Select", category: "select" }, { label: "Stylo", category: "stylo" }] },
      {
        label: "Tapetes",
        category: "tapetes",
        children: [
          { label: "Batique", category: "batique" },
          { label: "Evoke", category: "evoke" },
          { label: "Artifact", category: "artifact" },
          { label: "Trace", category: "trace" },
          { label: "Kids", category: "kids" },
        ],
      },
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
          { label: "Persianas", category: "persianas" },
          { label: "Tapetes", category: "tapetes" },
          { label: "Tapetes Kids", category: "kids" },
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
