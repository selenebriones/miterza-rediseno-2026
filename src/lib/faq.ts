// Preguntas frecuentes leídas de la base (FaqCategory + FaqItem), agrupadas por categoría.

import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS, db } from "./db";

export type FaqGroup = {
  slug: string;
  name: string;
  items: { id: string; question: string; answer: string }[];
};

export async function getFaq(): Promise<FaqGroup[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.content);

  const [categories, loose] = await Promise.all([
    db.faqCategory.findMany({
      orderBy: { position: "asc" },
      select: {
        slug: true,
        name: true,
        items: {
          where: { isPublished: true },
          orderBy: { position: "asc" },
          select: { id: true, question: true, answer: true },
        },
      },
    }),
    // Preguntas sin categoría (p. ej. si se borra la suya en el panel): van al final.
    db.faqItem.findMany({
      where: { isPublished: true, categoryId: null },
      orderBy: { position: "asc" },
      select: { id: true, question: true, answer: true },
    }),
  ]);

  const groups = categories.filter((c) => c.items.length > 0);
  if (loose.length > 0) groups.push({ slug: "otras", name: "Otras preguntas", items: loose });
  return groups;
}
