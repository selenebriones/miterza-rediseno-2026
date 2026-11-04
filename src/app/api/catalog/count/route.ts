import { countCatalog } from "@/lib/catalog";
import { parseCatalogParams, scopeAttributes } from "@/lib/catalog-params";
import { getCategoryTree } from "@/lib/categories";

// Conteo ligero para el botón "Ver N productos" del modal de filtros en móvil.
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const tree = await getCategoryTree();
  return Response.json({ total: await countCatalog(scopeAttributes(parseCatalogParams(params), tree)) });
}
