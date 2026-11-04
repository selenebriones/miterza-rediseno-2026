import { getProductBySlug } from "@/lib/products";

// Detalle completo de un producto para la vista rápida.
export async function GET(_request: Request, { params }: RouteContext<"/api/products/[slug]">) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return Response.json({ error: "No encontrado" }, { status: 404 });
  const product = await getProductBySlug(slug);
  if (!product) return Response.json({ error: "No encontrado" }, { status: 404 });
  return Response.json({ product });
}
