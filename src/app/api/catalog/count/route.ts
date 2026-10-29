import { countCatalog } from "@/lib/catalog";
import { parseCatalogParams } from "@/lib/catalog-params";

// Conteo ligero para el botón "Ver N productos" del modal de filtros en móvil.
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return Response.json({ total: await countCatalog(parseCatalogParams(params)) });
}
