// Aplica a una base existente el contenido del home del commit 5708050, sin volver a cargar el catálogo
// ni tocar usuarios o pedidos:
//  - "Compra por categoría": subcategorías en el home.
//  - "Ofertas y promociones": la sección y sus 4 banners.
//  - Banda de ayuda (guía de instalación con videos y preguntas frecuentes).
// Se puede correr varias veces: deja siempre el mismo resultado.
//
//   set -a; . ./.env.vercel; set +a; DATABASE_URL="$DATABASE_URL_UNPOOLED" node scripts/sync-home-content.mjs

import pg from "pg";

const id = () => "promo-" + Math.random().toString(36).slice(2, 14);

const BANNERS = [
  ["Pisos de madera", "/productos?categoria=pisos-de-madera&ofertas=1", "/catalogo/t36-34592-200207-b.webp", "Sala amplia con piso de madera y ventanal"],
  ["Lambrín y paneles", "/productos?categoria=paneles&ofertas=1", "/catalogo/t15-pvcms-063y9-mineral-gray.webp", "Sala con panel de mármol y lambrín de madera"],
  ["Flexiroc Caliza Blanca", "/productos/t15-fr026-tgg107", "/catalogo/t15-fr026-pt205-2.webp", "Muro recubierto con piedra flexible en una sala"],
  ["Persianas", "/productos?categoria=persianas&ofertas=1", "/home/promo-persianas.webp", "Persona ajustando una persiana enrollable en una ventana"],
];

const HELP_SETTINGS = {
  eyebrow: "Guías | Instalación",
  imageUrl: "/home/hero-persianas.webp",
  imageAlt: "Hombre trabajando junto a una ventana con persiana enrollable",
  tutorials: [
    { title: "Persianas enrollables", lines: "Líneas Optima y Select", videoUrl: "https://www.youtube.com/watch?v=Gy_H-6jySkM" },
    { title: "Persianas de doble tela", lines: "Línea Stylo", videoUrl: "https://www.youtube.com/watch?v=Ku1VPnL1LvY" },
  ],
  faq: {
    eyebrow: "Preguntas frecuentes",
    title: "Resolvemos tus",
    highlight: "dudas.",
    text: "Medidas, envíos, formas de pago, instalación y garantías: encuentra respuestas rápidas antes de hacer tu pedido.",
    ctaLabel: "Ver preguntas frecuentes",
    ctaUrl: "/preguntas-frecuentes",
    imageUrl: "/catalogo/t06-40101-00013-b.webp",
    imageAlt: "Sala con piso de madera, sofá y ventanal",
  },
};

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL (ver el comando al inicio del archivo).");
  process.exit(1);
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("begin");

  await db.query(`update "Category" c set "showInHome" =
    (c."parentId" is not null or not exists (select 1 from "Category" k where k."parentId" = c.id))`);
  await db.query(`update "HomeSection" set title = $1, "updatedAt" = now() where type = 'CATEGORY_CAROUSEL'`, [
    "Compra por categoría",
  ]);

  const promo = await db.query(`select 1 from "HomeSection" where type = 'PROMO_BANNERS'`);
  if (promo.rowCount === 0) {
    await db.query(`update "HomeSection" set position = 5 where type = 'INSTALL_GUIDE'`);
    await db.query(
      `insert into "HomeSection" (id, type, title, position, "isActive", "updatedAt")
       values ($1, 'PROMO_BANNERS', $2, 4, true, now())`,
      [id(), "Ofertas y promociones"],
    );
  } else {
    await db.query(`update "HomeSection" set title = $1, "updatedAt" = now() where type = 'PROMO_BANNERS'`, [
      "Ofertas y promociones",
    ]);
  }

  await db.query(`delete from "Banner" where placement = 'HOME_PROMO'`);
  for (const [position, [title, url, image, alt]] of BANNERS.entries()) {
    await db.query(
      `insert into "Banner" (id, placement, title, "ctaUrl", "imageDesktop", "imageAlt", position, "isActive", "updatedAt")
       values ($1, 'HOME_PROMO', $2, $3, $4, $5, $6, true, now())`,
      [id(), title, url, image, alt, position],
    );
  }

  await db.query(`update "HomeSection" set settings = $1::jsonb, "updatedAt" = now() where type = 'INSTALL_GUIDE'`, [
    JSON.stringify(HELP_SETTINGS),
  ]);

  await db.query("commit");
} catch (error) {
  await db.query("rollback");
  throw error;
} finally {
  const sections = await db.query(`select type from "HomeSection" order by position`).catch(() => ({ rows: [] }));
  console.log("Secciones del home:", sections.rows.map((r) => r.type).join(" → "));
  await db.end();
}
console.log("Listo: contenido del home actualizado.");
