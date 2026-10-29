import { parseCartLines, validateCartLines } from "@/lib/cart";

// Estado real (precio, existencias, disponibilidad) de las variantes del carrito.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const lines = parseCartLines(body?.lines);
  if (!lines) return Response.json({ error: "Carrito no válido" }, { status: 400 });
  return Response.json({ lines: await validateCartLines(lines) });
}
