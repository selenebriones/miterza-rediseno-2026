// Seed de desarrollo: `npx prisma db seed` (también corre tras `prisma migrate reset`).
// Borra el contenido de la tienda (catálogo, menús, banners y secciones del home) y lo vuelve
// a crear con los datos de seed-data.ts. No toca usuarios, sesiones ni pedidos; los métodos
// de pago se actualizan sin borrarse porque los pedidos los referencian.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type MenuLocation } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";
import { readFileSync } from "node:fs";
import {
  ANNOUNCEMENT,
  HERO_BANNERS,
  HOME_SECTIONS,
  INSTALL_VIDEOS,
  MENUS,
  PAYMENT_METHODS,
  PROMO_BANNERS,
  DUMMY_DISCOUNTS,
  DUMMY_AREA_PER_BOX,
  DUMMY_PRICE,
  BLIND_LINES,
  BLIND_STOCK,
  RUG_STOCK,
  FLOOR_CATEGORIES,
  SECTIONS,
  type MenuSeed,
} from "./seed-data";

// Catálogo de terza-sitio (src/data/catalogo.json, con las portadas elegidas a mano ya aplicadas).
// Las fotos están en public/catalogo/<base>.webp.
type TerzaCategory = { seccion: string; slug: string; nombre: string; intro: string; portada: string };
type TerzaProduct = {
  id: number;
  sku: string;
  slug: string;
  categoria: string;
  familia: string;
  variante: string;
  nuevo: boolean;
  descripcion: string;
  fotos: string[];
  specs: [string, string][];
  filtros: Record<string, string>;
};
const catalog: { rutaFotos: string; categorias: TerzaCategory[]; productos: TerzaProduct[] } = JSON.parse(
  readFileSync(new URL("./data/terza-catalogo.json", import.meta.url), "utf8"),
);
const round2 = (n: number) => Math.round(n * 100) / 100;
const MAX_ID = Math.max(...catalog.productos.map((p) => p.id));
const photo = (base: string) => `${catalog.rutaFotos}/${base}.webp`;
const MAX_PHOTOS = 4;

// Catálogo de persianas de miterza.com (lo dio el cliente). Una fila por color; las fotos están en
// public/persianas/<sku>-<n>.webp (descargadas de miterza.com).
type BlindRow = Record<
  | "linea" | "coleccion" | "color" | "sku" | "tipo" | "composicion" | "anchoMin" | "anchoMax"
  | "altoMin" | "altoMax" | "precio" | "disponibilidad" | "url" | "imagenes",
  string
>;
// Lee una lista del cliente (TSV con encabezados) como objetos.
function readTsv<T>(file: string): T[] {
  const [header, ...lines] = readFileSync(new URL(`./data/${file}`, import.meta.url), "utf8").trim().split("\n");
  const keys = header.split("\t");
  return lines.map((line) => Object.fromEntries(line.split("\t").map((value, i) => [keys[i], value.trim()])) as T);
}
const blinds = readTsv<BlindRow>("persianas-miterza.tsv");

// Catálogo de tapetes de miterza.com (lo dio el cliente); fotos en public/tapetes/<sku>-<n>.webp.
type RugRow = Record<
  | "coleccion" | "modelo" | "codigo" | "color" | "sku" | "material" | "composicion" | "acabado"
  | "anchoMin" | "anchoMax" | "altoMin" | "altoMax" | "precio" | "disponibilidad" | "url" | "imagenes",
  string
>;
const rugs = readTsv<RugRow>("tapetes-miterza.tsv");

// Medidas y precio por medida de cada colección (selector de medida de miterza.com).
const rugSizes: {
  colecciones: Record<string, { referencia: string; precios: Record<string, number> }>;
  colores: Record<string, { letra: string; agotadas?: string[] }>;
} = JSON.parse(readFileSync(new URL("./data/tapetes-medidas.json", import.meta.url), "utf8"));
// "060120" → ancho 60 y largo 120 cm → "0.60 × 1.20 m".
const sizeLabel = (size: string) =>
  `${(Number(size.slice(0, 3)) / 100).toFixed(2)} × ${(Number(size.slice(3, 6)) / 100).toFixed(2)} m`;
const sizeArea = (size: string) => Number(size.slice(0, 3)) * Number(size.slice(3, 6));
const BLIND_PHOTOS = 8;

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const DAY = 86_400_000;
const now = Date.now();

async function reset() {
  await db.$transaction([
    db.menuItem.deleteMany(),
    db.menu.deleteMany(),
    db.product.deleteMany(), // en cascada: imágenes, opciones, valores y variantes
    db.category.updateMany({ data: { parentId: null } }),
    db.category.deleteMany(),
    db.banner.deleteMany(),
    db.homeSection.deleteMany(),
    db.faqItem.deleteMany(),
    db.faqCategory.deleteMany(),
  ]);
}

async function seedCategories() {
  const ids = new Map<string, string>();
  const bySlug = new Map(catalog.categorias.map((c) => [c.slug, c]));

  for (const [p, section] of SECTIONS.entries()) {
    // Una sección sin hijos es una categoría del catálogo (Tapetes = alfombras).
    const own = bySlug.get(section.source ?? section.slug);
    const firstChild = bySlug.get(section.children[0] ?? "");
    // Persianas: sus subcategorías son las líneas de miterza.com, no categorías del catálogo.
    const created = await db.category.create({
      data: {
        slug: section.slug,
        name: section.name,
        description: section.description || own?.intro,
        imageUrl: section.imageUrl ?? photo((own ?? firstChild)!.portada),
        imageAlt: section.name,
        // En el home van las subcategorías; una sección sin ellas (Tapetes) se muestra sola.
        showInHome: section.children.length === 0,
        position: p,
      },
    });
    ids.set(section.slug, created.id);

    for (const [c, slug] of section.children.entries()) {
      const line = BLIND_LINES.find((l) => l.slug === slug);
      const child = bySlug.get(slug);
      const createdChild = await db.category.create({
        data: line
          ? {
              slug,
              name: line.name,
              description: line.description,
              imageUrl: line.imageUrl,
              imageAlt: line.name,
              showInHome: true,
              installVideoUrl: line.installVideoUrl,
              position: c,
              parentId: created.id,
            }
          : {
              slug,
              name: child!.nombre,
              description: child!.intro,
              imageUrl: photo(child!.portada),
              imageAlt: child!.nombre,
              showInHome: true,
              installVideoUrl: INSTALL_VIDEOS[slug] ?? null,
              position: c,
              parentId: created.id,
            },
      });
      ids.set(slug, createdChild.id);
    }
  }
  return ids;
}

// Sección de la tienda a la que va una categoría del catálogo (undefined si la tienda no la vende).
const parentOf = (categorySlug: string) =>
  SECTIONS.find((s) => s.children.includes(categorySlug) || (s.source ?? s.slug) === categorySlug);
// Slug en la tienda de una categoría del catálogo: "alfombras" se vende como "tapetes".
const storeSlug = (categorySlug: string) => {
  const section = parentOf(categorySlug)!;
  return section.children.includes(categorySlug) ? categorySlug : section.slug;
};

async function seedProduct(item: TerzaProduct, categoryIds: Map<string, string>) {
  const category = catalog.categorias.find((c) => c.slug === item.categoria)!;
  const section = parentOf(item.categoria)!;
  const ownSlug = storeSlug(item.categoria);
  // "Bilbao" + "Castle" → "Bilbao Castle"; si la variante ya trae la familia se usa tal cual.
  const name = item.variante.toLowerCase().includes(item.familia.toLowerCase())
    ? item.variante
    : `${item.familia} ${item.variante}`;

  // Precio dummy de $1,000. Una oferta de ejemplo cada ~12 productos: $1,000 tachado y el descuento
  // calculado sobre esa base (10, 15 o 20 %).
  const onSale = item.id % 12 === 0;
  const discount = DUMMY_DISCOUNTS[Math.floor(item.id / 12) % DUMMY_DISCOUNTS.length];
  const unitPrice = onSale ? DUMMY_PRICE * (1 - discount / 100) : DUMMY_PRICE;

  // Pisos: se venden por caja. El precio dummy es por m² y la caja cuesta precio × m² por caja.
  const isFloor = FLOOR_CATEGORIES.includes(item.categoria);
  const spec = (label: string) => item.specs.find(([l]) => l === label)?.[1];
  const areaPerBox = isFloor ? Number(spec("m² por caja") ?? DUMMY_AREA_PER_BOX) : null;
  const length = spec("Largo") ?? spec("Longitud");
  const format = isFloor
    ? (spec("Medidas") ?? (spec("Ancho") && length ? `${spec("Ancho")} x ${length}` : null))
    : null;
  const price = round2(unitPrice * (areaPerBox ?? 1));
  const compareAtPrice = onSale ? round2(DUMMY_PRICE * (areaPerBox ?? 1)) : null;
  // Existencias de prueba: algunas agotadas y algunas bajas.
  const stock = item.id % 19 === 0 ? 0 : item.id % 7 === 0 ? 3 : 10 + (item.id % 40);

  // "Nuevo" se calcula con publishedAt (últimos 30 días). El resto se ordena por alta en terza.com
  // (el id más alto es el más reciente), igual que en terza-sitio.
  const publishedAt = new Date(
    item.nuevo ? now - (1 + (item.id % 20)) * DAY : now - (40 + Math.round((MAX_ID - item.id) / 5)) * DAY,
  );

  const parentIds = section.slug === ownSlug ? [] : [{ id: categoryIds.get(section.slug)! }];

  await db.product.create({
    data: {
      name,
      slug: item.slug,
      brand: "Terza",
      status: "ACTIVE",
      isFeatured: item.nuevo,
      price,
      compareAtPrice,
      format,
      areaPerBox,
      attributes: item.filtros,
      shortDescription: category.intro,
      description: item.descripcion || category.intro,
      // La colección se agrega solo si la ficha de terza-sitio no la trae ya.
      specs: [
        ...(item.specs.some(([label]) => label === "Colección") ? [] : [{ label: "Colección", value: item.familia }]),
        ...item.specs.map(([label, value]) => ({ label, value })),
      ],
      publishedAt,
      categories: { connect: [{ id: categoryIds.get(ownSlug)! }, ...parentIds] },
      images: {
        create: item.fotos.slice(0, MAX_PHOTOS).map((base, position) => ({
          url: photo(base),
          alt: position === 0 ? `${section.children.length ? category.nombre : section.name}: ${name}` : `${name}, foto ${position + 1}`,
          position,
        })),
      },
      variants: { create: { sku: item.sku, price, compareAtPrice, stock, isDefault: true } },
    },
  });
}

// "PHIFER 4500" → "Phifer 4500", "ARTISAN BO" → "Artisan BO", "BEIGE/PEARL GRAY" → "Beige/Pearl Gray":
// las siglas cortas y los modelos con números se quedan en mayúsculas.
const titleCase = (text: string) =>
  text.replace(/[A-ZÁÉÍÓÚÑ0-9]+/g, (word) =>
    word.length <= 2 || /\d/.test(word) ? word : word[0] + word.slice(1).toLowerCase(),
  );

// "17 POLIESTER / 83 VINIL" → "17 % poliéster / 83 % vinil".
const composition = (text: string) =>
  text
    .toLowerCase()
    .replace(/(\d+)\s*/g, "$1 % ")
    .replace(/\s*\/\s*/g, " / ")
    .replace("poliester", "poliéster")
    .replace("fib vidrio", "fibra de vidrio")
    .replace(/acrili\b/, "acrílico")
    .trim();

// "Enrollable Blackout", "Enr Light Filtering", "Stylo Room Darkening" → tipo de tela sin la línea.
const fabricType = (text: string) => text.replace(/^(Enrollable|Enr|Stylo)\s+/, "");

const cm = (text: string) => text.replace(",", ".");

// "$1.051,72" → 1051.72. Los de $0,00 no tienen precio en miterza.com: se cargan agotados.
const parsePrice = (text: string) => Number(text.replace(/[$.\s]/g, "").replace(",", "."));

// OFERTAS DE EJEMPLO (provisionales): las listas del cliente no traen descuentos. De los productos con
// existencias, uno de cada `every` (en el orden de la lista) lleva 10, 15 o 20 % sobre su precio real,
// que queda tachado. Así cada banner de promociones tiene ofertas. Quitar cuando el cliente dé sus
// descuentos.
function sampleDiscount(sku: string, inStock: string[], every: number) {
  const rank = inStock.indexOf(sku);
  if (rank === -1 || rank % every !== 0) return null;
  return DUMMY_DISCOUNTS[(rank / every) % DUMMY_DISCOUNTS.length];
}
const rugsInStock = rugs.filter((r) => r.disponibilidad !== "Agotado").map((r) => r.sku);
const blindsInStock = blinds
  .filter((b) => b.disponibilidad !== "Agotado" && parsePrice(b.precio) > 0)
  .map((b) => b.sku);
const discounted = (price: number, percent: number | null) =>
  percent ? { price: round2(price * (1 - percent / 100)), compareAtPrice: price } : { price, compareAtPrice: null };


async function seedRug(row: RugRow, position: number, categoryIds: Map<string, string>) {
  // La colección KIDS se vende como "Terza Kids".
  const collection = row.coleccion === "KIDS" ? "Terza Kids" : titleCase(row.coleccion);
  const color = titleCase(row.color);
  const name = `${collection} ${color}`;
  const section = SECTIONS.find((s) => s.slug === "tapetes")!;

  // Una variante por medida, de la más chica a la más grande. Su SKU es el de miterza.com.
  const table = rugSizes.colecciones[row.modelo];
  const colorInfo = rugSizes.colores[row.sku];
  const soldOut = new Set(colorInfo.agotadas ?? []);
  const sizes = Object.entries(table.precios)
    .sort(([a], [b]) => sizeArea(a) - sizeArea(b) || a.localeCompare(b))
    .map(([size, price]) => ({
      size,
      label: sizeLabel(size),
      price,
      sku: `T10-${table.referencia}-${size}${colorInfo.letra}`,
      // "Agotado" en la lista del cliente: ninguna medida; si no, las que miterza.com no surte.
      stock: row.disponibilidad === "Agotado" || soldOut.has(size) ? 0 : RUG_STOCK,
    }));
  const firstAvailable = sizes.find((s) => s.stock > 0) ?? sizes[0];
  const percent = sampleDiscount(row.sku, rugsInStock, 5);

  const product = await db.product.create({
    data: {
      name,
      slug: row.sku.toLowerCase(),
      brand: "Terza",
      status: "ACTIVE",
      // Precio de la medida más chica: el catálogo lo muestra como "Desde".
      ...discounted(sizes[0].price, percent),
      attributes: { coleccion: collection, color },
      shortDescription: section.description,
      description: section.description,
      specs: [
        { label: "Colección", value: collection },
        { label: "Modelo", value: row.modelo },
        { label: "Color", value: `${color} (${row.codigo})` },
        { label: "Material", value: row.material.replace("Poliester", "Poliéster") },
        { label: "Composición", value: row.composicion.replace(/^(\d+)\s*/, "$1 % ") },
        { label: "Acabado", value: titleCase(row.acabado) },
        { label: "Medidas", value: `${sizes.length} medidas, de ${sizes[0].label} a ${sizes.at(-1)!.label}` },
        { label: "SKU", value: row.sku },
      ],
      // Mismo orden que la lista del cliente.
      publishedAt: new Date(now - (60 + position) * DAY),
      categories: { connect: [{ id: categoryIds.get("tapetes")! }] },
      images: {
        create: row.imagenes.split(",").map((_, i) => ({
          url: `/tapetes/${row.sku.toLowerCase()}-${i + 1}.webp`,
          alt: i === 0 ? `Tapete ${name}` : `${name}, foto ${i + 1}`,
          position: i,
        })),
      },
      options: {
        create: {
          name: "Medida",
          values: { create: sizes.map((s, i) => ({ value: s.label, position: i })) },
        },
      },
    },
    select: { id: true, options: { select: { values: { select: { id: true, value: true } } } } },
  });

  const valueIds = new Map(product.options[0].values.map((v) => [v.value, v.id]));
  for (const [i, s] of sizes.entries()) {
    await db.productVariant.create({
      data: {
        productId: product.id,
        sku: s.sku,
        ...discounted(s.price, percent),
        stock: s.stock,
        isDefault: s === firstAvailable,
        position: i,
        optionValues: { create: { optionValueId: valueIds.get(s.label)! } },
      },
    });
  }
}

async function seedBlind(row: BlindRow, position: number, categoryIds: Map<string, string>) {
  const line = BLIND_LINES.find((l) => l.line === row.linea)!;
  const collection = titleCase(row.coleccion);
  const color = titleCase(row.color);
  const name = `${collection} ${color}`;
  const price = parsePrice(row.precio);
  // Sin precio en miterza.com ($0): se muestra como agotado y "Precio por confirmar".
  const stock = row.disponibilidad === "Agotado" || price <= 0 ? 0 : BLIND_STOCK;
  const type = fabricType(row.tipo);
  const lineName = titleCase(row.linea);
  const prices = discounted(price, sampleDiscount(row.sku, blindsInStock, 6));

  await db.product.create({
    data: {
      name,
      slug: row.sku.toLowerCase(),
      brand: "Terza",
      status: "ACTIVE",
      ...prices,
      attributes: { linea: lineName, coleccion: collection, ...(type ? { tipo: type } : {}), color },
      shortDescription: line.description,
      description: line.description,
      specs: [
        { label: "Línea", value: lineName },
        { label: "Colección", value: collection },
        { label: "Color", value: color },
        ...(type ? [{ label: "Tipo de tela", value: type }] : []),
        ...(row.composicion ? [{ label: "Composición", value: composition(row.composicion) }] : []),
        { label: "Ancho", value: `${cm(row.anchoMin)} a ${cm(row.anchoMax)} cm` },
        { label: "Alto", value: `${cm(row.altoMin)} a ${cm(row.altoMax)} cm` },
        { label: "SKU", value: row.sku },
      ],
      // Mismo orden que la lista del cliente.
      publishedAt: new Date(now - (60 + position) * DAY),
      categories: { connect: [{ id: categoryIds.get(line.slug)! }, { id: categoryIds.get("persianas")! }] },
      images: {
        create: row.imagenes
          .split(",")
          .slice(0, BLIND_PHOTOS)
          .map((_, i) => ({
            url: `/persianas/${row.sku.toLowerCase()}-${i + 1}.webp`,
            alt: i === 0 ? `${line.name}: ${name}` : `${name}, foto ${i + 1}`,
            position: i,
          })),
      },
      variants: { create: { sku: row.sku, ...prices, stock, isDefault: true } },
    },
  });
}

async function seedMenuItems(
  menuId: string,
  items: MenuSeed[],
  categoryIds: Map<string, string>,
  parentId: string | null,
) {
  for (const [position, item] of items.entries()) {
    const created = await db.menuItem.create({
      data: {
        menuId,
        parentId,
        label: item.label,
        linkType: item.category ? "CATEGORY" : "CUSTOM_URL",
        categoryId: item.category ? categoryIds.get(item.category) : null,
        url: item.url ?? null,
        isHighlight: item.highlight ?? false,
        position,
      },
    });
    if (item.children) await seedMenuItems(menuId, item.children, categoryIds, created.id);
  }
}

async function main() {
  await reset();
  const categoryIds = await seedCategories();

  // Solo los productos de las secciones que vende la tienda; en tandas para no abrir una conexión por producto.
  const products = catalog.productos.filter((item) => parentOf(item.categoria));
  for (let i = 0; i < products.length; i += 20) {
    await Promise.all(products.slice(i, i + 20).map((item) => seedProduct(item, categoryIds)));
  }
  await Promise.all(rugs.map((row, i) => seedRug(row, i, categoryIds)));
  for (let i = 0; i < blinds.length; i += 20) {
    await Promise.all(blinds.slice(i, i + 20).map((row, j) => seedBlind(row, i + j, categoryIds)));
  }

  for (const menu of MENUS) {
    const created = await db.menu.create({ data: { name: menu.name, location: menu.location as MenuLocation } });
    // El menú principal: una entrada por sección con sus categorías, antes de los enlaces fijos.
    const items: MenuSeed[] =
      menu.location === "HEADER_MAIN"
        ? [
            ...SECTIONS.map((section) => ({
              label: section.name,
              category: section.slug,
              children: section.children.map((slug) => ({
                label:
                  BLIND_LINES.find((l) => l.slug === slug)?.name ??
                  catalog.categorias.find((c) => c.slug === slug)!.nombre,
                category: slug,
              })),
            })),
            ...menu.items,
          ]
        : menu.items;
    await seedMenuItems(created.id, items, categoryIds, null);
  }

  await db.banner.createMany({
    data: [
      ...HERO_BANNERS.map((banner, position) => ({ ...banner, placement: "HOME_HERO" as const, position })),
      ...PROMO_BANNERS.map((banner, position) => ({ ...banner, placement: "HOME_PROMO" as const, position })),
      { ...ANNOUNCEMENT, placement: "ANNOUNCEMENT" as const },
    ],
  });

  await db.homeSection.createMany({
    data: HOME_SECTIONS.map((section, position) => ({
      type: section.type,
      title: section.title,
      subtitle: section.subtitle,
      settings: section.settings ?? undefined,
      position,
    })),
  });

  // Preguntas frecuentes (prisma/data/faq.json, texto del cliente). Las respuestas admiten
  // párrafos, listas con "- " y enlaces [texto](url).
  const faq: { name: string; slug: string; items: { question: string; answer: string }[] }[] = JSON.parse(
    readFileSync(new URL("./data/faq.json", import.meta.url), "utf8"),
  );
  for (const [position, category] of faq.entries()) {
    await db.faqCategory.create({
      data: {
        name: category.name,
        slug: category.slug,
        position,
        items: { create: category.items.map((item, i) => ({ ...item, position: i })) },
      },
    });
  }

  // Políticas (/politicas/[slug]): HTML del cliente en prisma/data/politicas/.
  const policies: { slug: string; title: string; seoDescription: string; file: string }[] = JSON.parse(
    readFileSync(new URL("./data/politicas.json", import.meta.url), "utf8"),
  );
  for (const { file, ...page } of policies) {
    const data = { ...page, type: "POLICY" as const, content: readFileSync(new URL(`./data/${file}`, import.meta.url), "utf8").trim() };
    await db.page.upsert({ where: { slug: page.slug }, update: data, create: data });
  }

  for (const [position, method] of PAYMENT_METHODS.entries()) {
    const data = { ...method, position };
    await db.paymentMethod.upsert({ where: { provider: method.provider }, update: data, create: data });
  }

  await seedAdmin();

  const counts = await Promise.all([
    db.category.count(),
    db.product.count(),
    db.productVariant.count(),
    db.menuItem.count(),
  ]);
  console.log(
    `Seed listo: ${counts[0]} categorías, ${counts[1]} productos, ${counts[2]} variantes, ${counts[3]} elementos de menú.`,
  );
}

// Administrador inicial desde ADMIN_EMAIL / ADMIN_PASSWORD. Si ya existe, solo asegura su rol
// y permisos: nunca cambia una contraseña que alguien ya pudo haber actualizado.
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("Sin ADMIN_EMAIL/ADMIN_PASSWORD: no se creó administrador.");
    return;
  }
  const access = { role: "ADMIN" as const, permissions: ["SUPER_ADMIN" as const], isActive: true };
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    await db.user.update({ where: { email }, data: access });
  } else {
    await db.user.create({
      data: {
        email,
        name: process.env.ADMIN_NAME ?? "Administrador",
        passwordHash: await hashPassword(password),
        ...access,
      },
    });
  }
  console.log(`Administrador listo: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
