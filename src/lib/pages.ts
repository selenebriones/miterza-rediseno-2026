// Páginas de contenido (modelo Page): por ahora las políticas en /politicas/[slug].

import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS, db } from "./db";

export type PolicyPage = {
  slug: string;
  title: string;
  content: string; // HTML del seed o del editor del panel (el panel debe sanearlo al guardar)
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
};

export async function getPolicy(slug: string): Promise<PolicyPage | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.content);

  return db.page.findFirst({
    where: { slug, type: "POLICY", isPublished: true },
    select: { slug: true, title: true, content: true, seoTitle: true, seoDescription: true, updatedAt: true },
  });
}
