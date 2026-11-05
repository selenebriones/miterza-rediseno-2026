// Crea o actualiza las políticas de prisma/data/politicas.json (HTML en prisma/data/politicas/)
// en una base existente, sin tocar el resto. Se puede correr varias veces.
//
//   Local:      node --env-file=.env scripts/sync-pages.mjs
//   Producción: set -a; . ./.env.vercel; set +a; DATABASE_URL="$DATABASE_URL_UNPOOLED" node scripts/sync-pages.mjs

import { readFileSync } from "node:fs";
import pg from "pg";

const data = new URL("../prisma/data/", import.meta.url);
const pages = JSON.parse(readFileSync(new URL("politicas.json", data), "utf8"));
const id = () => "page-" + Math.random().toString(36).slice(2, 14);

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL (ver el comando al inicio del archivo).");
  process.exit(1);
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("begin");
  for (const page of pages) {
    const content = readFileSync(new URL(page.file, data), "utf8").trim();
    await db.query(
      `insert into "Page" (id, type, slug, title, content, "seoDescription", "isPublished", "updatedAt")
       values ($1, 'POLICY', $2, $3, $4, $5, true, now())
       on conflict (slug) do update set title = excluded.title, content = excluded.content,
         "seoDescription" = excluded."seoDescription", "updatedAt" = now()`,
      [id(), page.slug, page.title, content, page.seoDescription],
    );
  }
  await db.query("commit");
} catch (error) {
  await db.query("rollback");
  throw error;
} finally {
  await db.end();
}
console.log(`Listo: ${pages.map((p) => p.slug).join(", ")}.`);
