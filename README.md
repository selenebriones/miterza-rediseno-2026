# Mi Terza — rediseño 2026

E-commerce de persianas y tapetes Terza. Next.js 16 (App Router, Cache Components), Tailwind CSS v4 + shadcn/ui, Prisma 7 con PostgreSQL.

## Arranque local

Requisitos: Node 20+ y Docker.

```bash
cp .env.example .env        # y cambia POSTGRES_PASSWORD (y la misma en DATABASE_URL)
npm install                 # también genera el cliente de Prisma
npm run db:up               # Postgres 17 en Docker, puerto 5440
npm run db:migrate          # aplica las migraciones
npm run db:seed             # catálogo, menús, banners y home de ejemplo
npm run dev -- -p 4370
```

El build (`npm run build`) también necesita la base arriba: las páginas se prerenderizan con datos.

## Scripts de base de datos

| Script | Qué hace |
|---|---|
| `npm run db:up` | Levanta Postgres (`docker-compose.yml`) |
| `npm run db:migrate` | Crea y aplica migraciones a partir de `prisma/schema.prisma` |
| `npm run db:seed` | Borra el contenido de la tienda y lo vuelve a crear con `prisma/seed-data.ts` |
| `npm run db:reset` | Borra la base, aplica migraciones y corre el seed |
| `npm run db:studio` | Abre Prisma Studio para ver y editar datos |

## Panel de administración

- Entrada: `/admin` (redirige a `/admin/login` si no hay sesión).
- El seed crea el administrador inicial con `ADMIN_EMAIL` y `ADMIN_PASSWORD` de `.env`, con permiso `SUPER_ADMIN`. Si el usuario ya existe, no cambia su contraseña.
- `AUTH_SECRET` firma las sesiones; genera uno propio por ambiente (`openssl rand -base64 33`).
- Roles: `ADMIN` con permisos por módulo (`MANAGE_ORDERS`, `MANAGE_CATALOG`, …; `SUPER_ADMIN` incluye todos). Un `CUSTOMER` no entra al panel.

## Estructura

- `src/app/(tienda)/` — tienda pública (home, `/productos`, `/productos/[slug]`, `/carrito`).
- `src/app/(checkout)/` — checkout con layout mínimo y confirmación del pedido.
- `src/app/admin/` — panel: login, pedidos (listado y detalle con cambio de estado).
- `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts` — autenticación (Auth.js) y protección de `/admin`.
- `src/components/` — header, footer, home, catálogo, producto y carrito; `ui/` son componentes de shadcn.
- `src/lib/` — acceso a datos (`products.ts`, `catalog.ts`, `home.ts`, `navigation.ts`, `search.ts`), filtros del catálogo (`catalog-params.ts`) y cliente de Prisma (`db.ts`).
- `prisma/` — schema, migraciones y seed.
- `docs/ux/` — propuestas de UX/UI de cada pantalla.

## Caché de datos

Las consultas usan `"use cache"` con `cacheLife("hours")` y las etiquetas `catalog` y `content` (`src/lib/db.ts`). Cuando el panel de administración guarde cambios, debe llamar a `revalidateTag("catalog")` o `revalidateTag("content")` para que se vean de inmediato.

Si cambias datos directamente en la base (seed, Prisma Studio, SQL), reinicia `npm run dev` para no ver datos en caché. Volver a correr el seed cambia los IDs de las variantes: los carritos guardados en el navegador con IDs anteriores quedan desfasados.
