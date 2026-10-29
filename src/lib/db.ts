import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Una sola instancia por proceso: cada PrismaClient abre su propio pool de conexiones.
// En desarrollo se guarda en globalThis para que el hot reload no cree pools nuevos.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Etiquetas de caché. Al editar desde el panel se invalida con revalidateTag(CACHE_TAGS.x).
export const CACHE_TAGS = {
  catalog: "catalog", // productos, variantes, imágenes y categorías
  content: "content", // home, banners y menús
} as const;
