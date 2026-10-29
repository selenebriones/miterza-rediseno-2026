import { searchCatalog } from "@/lib/search";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return Response.json({ products: [], categories: [] });
  }

  return Response.json(await searchCatalog(query.slice(0, 80)));
}
