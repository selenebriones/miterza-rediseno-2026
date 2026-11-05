// Reemplaza las preguntas frecuentes de una base existente con las de prisma/data/faq.json,
// sin tocar el catálogo, usuarios ni pedidos. Se puede correr varias veces.
//
//   Local:      node --env-file=.env scripts/sync-faq.mjs
//   Producción: set -a; . ./.env.vercel; set +a; DATABASE_URL="$DATABASE_URL_UNPOOLED" node scripts/sync-faq.mjs

import { readFileSync } from "node:fs";
import pg from "pg";

const faq = JSON.parse(readFileSync(new URL("../prisma/data/faq.json", import.meta.url), "utf8"));
const id = () => "faq-" + Math.random().toString(36).slice(2, 14);

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL (ver el comando al inicio del archivo).");
  process.exit(1);
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("begin");
  await db.query(`delete from "FaqItem"`);
  await db.query(`delete from "FaqCategory"`);
  for (const [position, category] of faq.entries()) {
    const categoryId = id();
    await db.query(`insert into "FaqCategory" (id, name, slug, position) values ($1, $2, $3, $4)`, [
      categoryId,
      category.name,
      category.slug,
      position,
    ]);
    for (const [i, item] of category.items.entries()) {
      await db.query(
        `insert into "FaqItem" (id, "categoryId", question, answer, position, "isPublished", "updatedAt")
         values ($1, $2, $3, $4, $5, true, now())`,
        [id(), categoryId, item.question, item.answer, i],
      );
    }
  }
  await db.query("commit");
} catch (error) {
  await db.query("rollback");
  throw error;
} finally {
  await db.end();
}
console.log(`Listo: ${faq.reduce((n, c) => n + c.items.length, 0)} preguntas frecuentes cargadas.`);
