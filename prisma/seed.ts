// Seed de desarrollo: `npx prisma db seed` (también corre tras `prisma migrate reset`).
// Borra el contenido de la tienda (catálogo, menús, banners y secciones del home) y lo vuelve
// a crear con los datos de seed-data.ts. No toca usuarios, sesiones ni pedidos; los métodos
// de pago se actualizan sin borrarse porque los pedidos los referencian.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type MenuLocation } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";
import {
  ANNOUNCEMENT,
  BLIND_COLORS,
  BLIND_SIZES,
  CATEGORIES,
  HERO_BANNERS,
  HOME_SECTIONS,
  MENUS,
  PAYMENT_METHODS,
  PHOTO_POOL,
  persianas,
  tapetes,
  type ProductSeed,
} from "./seed-data";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const DAY = 86_400_000;
const now = Date.now();
const round10 = (n: number) => Math.round(n / 10) * 10;
const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function reset() {
  await db.$transaction([
    db.menuItem.deleteMany(),
    db.menu.deleteMany(),
    db.product.deleteMany(), // en cascada: imágenes, opciones, valores y variantes
    db.category.updateMany({ data: { parentId: null } }),
    db.category.deleteMany(),
    db.banner.deleteMany(),
    db.homeSection.deleteMany(),
  ]);
}

async function seedCategories() {
  const ids = new Map<string, string>();
  for (const [p, parent] of CATEGORIES.entries()) {
    const created = await db.category.create({
      data: {
        slug: parent.slug,
        name: parent.name,
        description: parent.description,
        imageUrl: parent.imageUrl,
        showInHome: parent.showInHome,
        position: p,
      },
    });
    ids.set(parent.slug, created.id);
    for (const [c, child] of parent.children.entries()) {
      const createdChild = await db.category.create({
        data: {
          slug: child.slug,
          name: child.name,
          imageUrl: child.imageUrl,
          showInHome: child.showInHome,
          installVideoUrl: child.installVideoUrl,
          position: c,
          parentId: created.id,
        },
      });
      ids.set(child.slug, createdChild.id);
    }
  }
  return ids;
}

async function seedProduct(seed: ProductSeed, parentSlug: "persianas" | "tapetes", index: number, categoryIds: Map<string, string>) {
  const [name, line, basePrice, baseCompareAt, imageUrl, imageAlt, baseStock, flags] = seed;
  const isBlind = parentSlug === "persianas";
  const lineSlug = line.toLowerCase();

  const images = imageUrl
    ? [{ url: imageUrl, alt: imageAlt }, ...PHOTO_POOL[parentSlug].filter((img) => img.url !== imageUrl)].slice(0, 4)
    : [];

  const description = isBlind
    ? [
        `Persiana de la línea ${line} de Terza para controlar la luz y la privacidad de tus espacios.`,
        "Elige el color y la medida más cercana a tu ventana. Si tienes dudas para medir, revisa el tutorial de instalación o llámanos.",
      ]
    : [
        `Tapete de la línea ${line} de Terza para dar textura y calidez a tus espacios.`,
        "Revisa la medida antes de comprar y compárala con el espacio donde lo vas a colocar.",
      ];

  const specs = isBlind
    ? [
        { label: "Categoría", value: "Persianas" },
        { label: "Línea", value: line },
        { label: "Colores", value: BLIND_COLORS.map((c) => c.value).join(", ") },
        { label: "Medidas (ancho × alto)", value: BLIND_SIZES.map((s) => s.value).join(" · ") },
      ]
    : [
        { label: "Categoría", value: "Tapetes" },
        { label: "Línea", value: line },
        { label: "Medida", value: name.match(/\d+ × \d+ cm/)?.[0] ?? "—" },
      ];

  // "Nuevo" se calcula con publishedAt (últimos 30 días): los marcados como nuevos se publican hace pocos días.
  const publishedAt = new Date(flags?.isNew ? now - (2 + (index % 5)) * DAY : now - (45 + index * 4) * DAY);

  const product = await db.product.create({
    data: {
      name,
      slug: slugify(name),
      status: "ACTIVE",
      isFeatured: flags?.isFeatured ?? false,
      price: basePrice,
      compareAtPrice: baseCompareAt,
      description: description.join("\n\n"),
      specs,
      publishedAt,
      categories: { connect: [{ id: categoryIds.get(lineSlug)! }, { id: categoryIds.get(parentSlug)! }] },
      images: { create: images.map((img, position) => ({ ...img, position })) },
      options: isBlind
        ? {
            create: [
              {
                name: "Color",
                position: 0,
                values: { create: BLIND_COLORS.map((c, position) => ({ value: c.value, swatch: c.swatch, position })) },
              },
              {
                name: "Medida",
                position: 1,
                values: { create: BLIND_SIZES.map((s, position) => ({ value: s.value, position })) },
              },
            ],
          }
        : undefined,
    },
    include: { options: { include: { values: true } } },
  });

  const sku = `TZ-${index.toString().padStart(3, "0")}`;

  if (!isBlind) {
    await db.productVariant.create({
      data: {
        productId: product.id,
        sku,
        price: basePrice,
        compareAtPrice: baseCompareAt,
        stock: baseStock,
        isDefault: true,
      },
    });
    return;
  }

  const colorValues = product.options.find((o) => o.name === "Color")!.values;
  const sizeValues = product.options.find((o) => o.name === "Medida")!.values;
  let position = 0;
  for (const [c, color] of BLIND_COLORS.entries()) {
    for (const [s, size] of BLIND_SIZES.entries()) {
      // Existencias repartidas para tener combinaciones disponibles, bajas y agotadas.
      const stock = baseStock === 0 ? 0 : (index * 7 + c * 5 + s * 3) % 13 === 0 ? 0 : ((index + c * 3 + s * 2) % 9) + 1;
      await db.productVariant.create({
        data: {
          productId: product.id,
          sku: `${sku}-${c}${s}`,
          price: round10(basePrice * size.factor),
          compareAtPrice: baseCompareAt ? round10(baseCompareAt * size.factor) : null,
          stock,
          isDefault: position === 0,
          position: position++,
          optionValues: {
            create: [
              { optionValueId: colorValues.find((v) => v.value === color.value)!.id },
              { optionValueId: sizeValues.find((v) => v.value === size.value)!.id },
            ],
          },
        },
      });
    }
  }
}

type MenuSeed = (typeof MENUS)[number]["items"][number];

async function seedMenuItems(menuId: string, items: MenuSeed[], categoryIds: Map<string, string>, parentId: string | null) {
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

  for (const [i, seed] of persianas.entries()) await seedProduct(seed, "persianas", i, categoryIds);
  for (const [i, seed] of tapetes.entries()) await seedProduct(seed, "tapetes", persianas.length + i, categoryIds);

  for (const menu of MENUS) {
    const created = await db.menu.create({ data: { name: menu.name, location: menu.location as MenuLocation } });
    await seedMenuItems(created.id, menu.items, categoryIds, null);
  }

  await db.banner.createMany({
    data: [
      ...HERO_BANNERS.map((banner, position) => ({ ...banner, placement: "HOME_HERO" as const, position })),
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

  for (const [position, method] of PAYMENT_METHODS.entries()) {
    const data = { ...method, position };
    await db.paymentMethod.upsert({ where: { provider: method.provider }, update: data, create: data });
  }

  await seedAdmin();

  const counts = await Promise.all([db.category.count(), db.product.count(), db.productVariant.count(), db.menuItem.count()]);
  console.log(`Seed listo: ${counts[0]} categorías, ${counts[1]} productos, ${counts[2]} variantes, ${counts[3]} elementos de menú.`);
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
      data: { email, name: process.env.ADMIN_NAME ?? "Administrador", passwordHash: await hashPassword(password), ...access },
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
