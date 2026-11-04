import { getProductsBySlugs } from "@/lib/products";

// Resumen de varios productos por slug (lista de favoritos). Máximo 50.
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("slugs") ?? "";
  const slugs = [...new Set(raw.split(","))].filter((s) => /^[a-z0-9-]{1,120}$/.test(s)).slice(0, 50);
  if (slugs.length === 0) return Response.json({ products: [] });
  return Response.json({ products: await getProductsBySlugs(slugs) });
}
