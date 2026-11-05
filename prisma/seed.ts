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
    // Una sección sin hijos es la categoría del catálogo con el mismo slug (Accesorios).
    const own = bySlug.get(section.slug);
    const firstChild = bySlug.get(section.children[0] ?? "");
    const created = await db.category.create({
      data: {
        slug: section.slug,
        name: section.name,
        description: section.description || own?.intro,
        imageUrl: photo((own ?? firstChild)!.portada),
        imageAlt: section.name,
        // En el home van las subcategorías; una sección sin ellas (Accesorios) se muestra sola.
        showInHome: section.children.length === 0,
        position: p,
      },
    });
    ids.set(section.slug, created.id);

    for (const [c, slug] of section.children.entries()) {
      const child = bySlug.get(slug)!;
      const createdChild = await db.category.create({
        data: {
          slug: child.slug,
          name: child.nombre,
          description: child.intro,
          imageUrl: photo(child.portada),
          imageAlt: child.nombre,
          showInHome: true,
          installVideoUrl: INSTALL_VIDEOS[child.slug] ?? null,
          position: c,
          parentId: created.id,
        },
      });
      ids.set(child.slug, createdChild.id);
    }
  }
  return ids;
}

const parentOf = (categorySlug: string) =>
  SECTIONS.find((s) => s.children.includes(categorySlug)) ?? SECTIONS.find((s) => s.slug === categorySlug)!;

async function seedProduct(item: TerzaProduct, categoryIds: Map<string, string>) {
  const category = catalog.categorias.find((c) => c.slug === item.categoria)!;
  const section = parentOf(item.categoria);
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

  const parentIds = section.slug === item.categoria ? [] : [{ id: categoryIds.get(section.slug)! }];

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
      categories: { connect: [{ id: categoryIds.get(item.categoria)! }, ...parentIds] },
      images: {
        create: item.fotos.slice(0, MAX_PHOTOS).map((base, position) => ({
          url: photo(base),
          alt: position === 0 ? `${category.nombre}: ${name}` : `${name}, foto ${position + 1}`,
          position,
        })),
      },
      variants: { create: { sku: item.sku, price, compareAtPrice, stock, isDefault: true } },
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

  // En tandas para no abrir una conexión por producto.
  for (let i = 0; i < catalog.productos.length; i += 20) {
    await Promise.all(catalog.productos.slice(i, i + 20).map((item) => seedProduct(item, categoryIds)));
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
                label: catalog.categorias.find((c) => c.slug === slug)!.nombre,
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
