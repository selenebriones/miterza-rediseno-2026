# Contexto de trabajo: Mi Terza

Resumen para retomar el proyecto en futuras sesiones. Última actualización: 12 de noviembre de 2026.

## Ramas e integración

- Repositorio: `selenebriones/miterza-rediseno-2026`.
- `main` es la rama productiva; no hacer push directo a `main`.
- La rama de Selene es `categoria-tapetes-persianas`.
- La rama de trabajo del usuario es `ajustes-admin`.
- En la última sincronización, `origin/main` y `origin/categoria-tapetes-persianas` apuntaban a `d41ca1d` (rediseño del panel y módulo Clientes).
- `ajustes-admin` incluye esa punta de Selene mediante el merge `71b5724`, y está publicada como `origin/ajustes-admin`. La integración tuvo un conflicto en `src/lib/admin/permissions.ts`, ya resuelto.
- Al 12-nov-2026, la secuencia planeada es avanzar `categoria-tapetes-persianas` a `ajustes-admin` y luego integrar Selene a `main`. Verificar las puntas remotas antes de cada integración; las ramas pueden avanzar.

## Decisiones y trabajo del panel

- El módulo del panel se llama **Usuarios**. `SUPER_ADMIN` concede todo; los demás permisos se asignan por módulo.
- **Contenido** administra el home: banners, aviso superior, beneficios, categorías, productos destacados, promociones y guías.
- Header y Footer son secciones distintas. Header administra logo, menús y accesos rápidos; Footer administra sus columnas, contacto, redes y páginas legales.
- Los accesos del Header permiten elegir icono, etiqueta, orden y visibilidad. Favoritos y Mi cuenta aceptan una ruta interna; Buscar y Carrito conservan sus acciones funcionales.
- Las políticas con contenido HTML se editan desde **Footer → Páginas legales**. El HTML se sanea en servidor.
- La configuración global de sitio se guarda en `SiteSettings` (JSON); existe la migración `20261112090000_site_settings`.
- Las subidas de contenido usan Vercel Blob; en local requieren `BLOB_READ_WRITE_TOKEN`, y en Vercel la configuración/credenciales del proyecto.

## Notas técnicas

- Proyecto Next.js 16.4.3 y Prisma 7; seguir las instrucciones de `AGENTS.md` y consultar `node_modules/next/dist/docs/` antes de cambiar APIs de Next.
- Después de cambiar `prisma/schema.prisma`, regenerar el cliente con `./node_modules/.bin/prisma generate`.
- Validaciones usadas: `npm run lint` y `./node_modules/.bin/next build --webpack`. La generación de páginas del build consulta la base local.
