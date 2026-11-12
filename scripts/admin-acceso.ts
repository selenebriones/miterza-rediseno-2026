// Administradores de la base a la que apunta DATABASE_URL.
//
//   npx tsx scripts/admin-acceso.ts                 → lista los administradores (sin contraseñas)
//   npx tsx scripts/admin-acceso.ts correo@dominio  → cambia la contraseña de ese administrador
//
// La contraseña nueva se pide en la terminal sin mostrarse, así no queda en el historial ni en pantalla.
// Solo cambia usuarios que ya son ADMIN; no crea cuentas ni toca clientes.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (char: string) => {
      if (char === "\r" || char === "\n" || char === "\u0004") {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (char === "\u0003") {
        process.stdout.write("\n");
        process.exit(1);
      } else if (char === "\u007f" || char === "\b") {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "postgresql://sin-base").hostname;
  console.log(`Base: ${host}\n`);

  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { email: "asc" },
      select: { email: true, name: true, isActive: true, permissions: true, lastLoginAt: true },
    });
    if (admins.length === 0) console.log("No hay administradores en esta base.");
    for (const a of admins) {
      const last = a.lastLoginAt ? a.lastLoginAt.toISOString().slice(0, 10) : "nunca";
      console.log(`${a.email}  ${a.name ?? ""}  ${a.isActive ? "activo" : "INACTIVO"}  último acceso: ${last}  [${a.permissions.join(", ")}]`);
    }
    return;
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user || user.role !== "ADMIN") {
    console.log(`${email} no es administrador en esta base. Corre el script sin correo para ver la lista.`);
    process.exitCode = 1;
    return;
  }
  const password = await askHidden("Contraseña nueva (mínimo 10 caracteres): ");
  if (password.length < 10) {
    console.log("Muy corta; no se cambió nada.");
    process.exitCode = 1;
    return;
  }
  const again = await askHidden("Repítela: ");
  if (again !== password) {
    console.log("No coinciden; no se cambió nada.");
    process.exitCode = 1;
    return;
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password), isActive: true } });
  console.log(`Listo: ${email} ya entra con la contraseña nueva.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
