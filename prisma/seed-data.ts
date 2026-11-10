// Datos para el seed (`npx prisma db seed`). El catálogo es el de miterza.com que dio el cliente
// (prisma/data/*-miterza.tsv y tapetes-medidas.json, fotos en public/tapetes y public/persianas), con
// precios reales; las existencias y las ofertas son de prueba. Textos y tutoriales vienen de miterza.com.

// Árbol de categorías de la tienda. Igual que miterza.com, la tienda vende solo dos líneas:
// - Tapetes: el catálogo de miterza.com que dio el cliente (prisma/data/tapetes-miterza.tsv), sin
//   subcategorías; se filtran por colección.
// - Persianas: el catálogo de miterza.com que dio el cliente (prisma/data/persianas-miterza.tsv), por
//   línea (BLIND_LINES).
export const SECTIONS: {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  children: string[];
}[] = [
  {
    slug: "tapetes",
    name: "Tapetes",
    description: "Calidez, confort y mejor acústica para residencias, oficinas y hoteles.",
    imageUrl: "/home/cat-tapetes.webp",
    children: [],
  },
  {
    slug: "persianas",
    name: "Persianas",
    description: "Control de luz y privacidad a la medida de tus ventanas.",
    imageUrl: "/home/cat-persianas.webp",
    children: ["persianas-optima", "persianas-select", "persianas-stylo"],
  },
];

// Líneas de persianas de miterza.com: cada una es una subcategoría de Persianas. `line` es el valor de la
// columna "linea" del catálogo. Descripciones provisionales: confirmar con el cliente.
export const BLIND_LINES: {
  slug: string;
  line: string;
  name: string;
  description: string;
  imageUrl: string;
  installVideoUrl: string;
}[] = [
  {
    slug: "persianas-optima",
    line: "OPTIMA",
    name: "Persianas Optima",
    description: "Persianas enrollables blackout, translúcidas y screen para controlar la luz en cada espacio.",
    imageUrl: "/home/hero-persianas.webp",
    installVideoUrl: "https://www.youtube.com/watch?v=Gy_H-6jySkM",
  },
  {
    slug: "persianas-select",
    line: "SELECT",
    name: "Persianas Select",
    description: "Telas enrollables de mayor desempeño: blackout laminado y screen de fibra de vidrio.",
    imageUrl: "/persianas/t24-selec-view5-27502-11.webp",
    installVideoUrl: "https://www.youtube.com/watch?v=Gy_H-6jySkM",
  },
  {
    slug: "persianas-stylo",
    line: "STYLO",
    name: "Persianas Stylo",
    description: "Persianas de doble tela que alternan franjas para regular la luz y la privacidad.",
    imageUrl: "/home/cat-persianas.webp",
    installVideoUrl: "https://www.youtube.com/watch?v=Ku1VPnL1LvY",
  },
];

// Existencias de prueba para las persianas "En existencia" (el catálogo no trae cantidades).
export const BLIND_STOCK = 10;
export const RUG_STOCK = 10;

// Porcentajes de las ofertas de ejemplo (provisionales, ver sampleDiscount en seed.ts).
export const DUMMY_DISCOUNTS = [10, 15, 20];

const OPTIMA_VIDEO = "https://www.youtube.com/watch?v=Gy_H-6jySkM";
const STYLO_VIDEO = "https://www.youtube.com/watch?v=Ku1VPnL1LvY";

export const HERO_BANNERS = [
  {
    title: "Calidez y confort para cada espacio",
    subtitle: "Tapetes que dan calidez, confort y mejor acústica a residencias, oficinas y hoteles.",
    ctaLabel: "Ver tapetes",
    ctaUrl: "/productos?categoria=tapetes",
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

// "Nuestras promociones" (Banner HOME_PROMO), en orden: el grande, los dos chicos y el ancho. Cada uno
// enlaza a un producto (/productos/<slug>) o a una categoría; el % de ahorro se calcula de sus ofertas.
export const PROMO_BANNERS = [
  {
    title: "Tapetes",
    ctaUrl: "/productos?categoria=tapetes",
    imageDesktop: "/home/cat-tapetes.webp",
    imageAlt: "Tapete claro junto a una banca de madera en un recibidor",
  },
  {
    title: "Terza Kids",
    ctaUrl: "/productos?categoria=tapetes&coleccion=Terza%20Kids",
    imageDesktop: "/home/cat-kids.webp",
    imageAlt: "Bebé de pie sobre un tapete rosa de pelo suave",
  },
  {
    title: "Persianas Stylo",
    ctaUrl: "/productos?categoria=persianas-stylo",
    imageDesktop: "/home/cat-persianas.webp",
    imageAlt: "Persiana de doble tela con franjas grises en una ventana",
  },
  {
    title: "Persianas Optima",
    ctaUrl: "/productos?categoria=persianas-optima",
    imageDesktop: "/home/promo-persianas.webp",
    imageAlt: "Persona ajustando una persiana enrollable en una ventana",
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
  { type: "CATEGORY_CAROUSEL", title: "Compra por categoría", subtitle: null, settings: null },
  { type: "FEATURED_PRODUCTS", title: "Nuevos productos", subtitle: null, settings: { limit: 12 } },
  { type: "PROMO_BANNERS", title: "Ofertas y promociones", subtitle: null, settings: null },
  {
    type: "INSTALL_GUIDE",
    title: "Mide e instala tus persianas paso a paso",
    subtitle: null,
    // Banda de ayuda: guía a la izquierda (lima) y preguntas frecuentes a la derecha (blanco).
    settings: {
      eyebrow: "Guías | Instalación",
      imageUrl: "/home/guia-instalacion.webp",
      imageAlt: "Instalador de Terza Persianas colocando una persiana enrollable en una ventana",
      tutorials: [
        { title: "Persianas enrollables", lines: "Líneas Optima y Select", videoUrl: OPTIMA_VIDEO },
        { title: "Persianas de doble tela", lines: "Línea Stylo", videoUrl: STYLO_VIDEO },
      ],
      faq: {
        eyebrow: "Preguntas frecuentes",
        title: "Resolvemos tus",
        highlight: "dudas.",
        text: "Medidas, envíos, formas de pago, instalación y garantías: encuentra respuestas rápidas antes de hacer tu pedido.",
        ctaLabel: "Ver preguntas frecuentes",
        ctaUrl: "/preguntas-frecuentes",
        imageUrl: "/home/faq-terza.webp",
        imageAlt: "Colaborador de Terza sonriendo en la planta, con compañeros acomodando material",
      },
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
      { label: "Nosotros", url: "https://www.terza.com/quienes-somos" },
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
          { label: "Tapetes", category: "tapetes" },
          { label: "Persianas", category: "persianas" },
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
          { label: "Nosotros", url: "https://www.terza.com/quienes-somos" },
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
