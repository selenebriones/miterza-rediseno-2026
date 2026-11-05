# Catálogo de productos (`/productos`)

## Objetivo

Que el usuario pase de "quiero una persiana" a **un producto que le sirva** en el menor número de toques: ver pocos productos relevantes, poder reducirlos con 2 o 3 filtros y entrar al detalle.

La misma página atiende tres entradas:

| Llega desde | URL | Título (H1) |
|---|---|---|
| Menú o categoría del home | `/productos?categoria=persianas` | Persianas |
| Buscador | `/productos?q=blackout` | Resultados para “blackout” |
| "Ver todo" / "Ofertas" | `/productos`, `/productos?ofertas=1` | Todos los productos / Ofertas |

## Estado en la URL

Todo filtro, orden y página vive en la URL (`?categoria=optima,select&min=1500&orden=precio-asc&pagina=2`):

- Se puede compartir, guardar en favoritos y volver con el botón "Atrás" sin perder los filtros.
- El servidor renderiza el resultado ya filtrado: no hay parpadeo de "cargando" al entrar.
- Parámetros en español y legibles; los valores por defecto no se escriben (`orden=recomendados`, `pagina=1`).

---

## Layout

```
DESKTOP (≥1024)
Inicio / Productos / Persianas
Persianas                                                       
Control de luz y privacidad a la medida de tus ventanas.
┌──────────────┬─────────────────────────────────────────────────────┐
│ FILTROS      │ 18 productos            Ordenar por [Recomendados ▾] │
│              │ [Optima ✕] [Hasta $1,500 ✕]  Limpiar todo            │
│ Categoría    ├─────────────────────────────────────────────────────┤
│ ☑ Persianas 18│ ┌──────┐ ┌──────┐ ┌──────┐                          │
│   ☐ Optima  6│ │      │ │      │ │      │                          │
│   ☐ Select  6│ └──────┘ └──────┘ └──────┘                          │
│ ☐ Tapetes  14│ ┌──────┐ ┌──────┐ ┌──────┐                          │
│              │ …                                                     │
│ Precio       │                                                       │
│ ○ Hasta 1,500│        ‹ Anterior  1 [2] 3  Siguiente ›              │
│ [min]–[max]  │                                                       │
│ Disponibilidad│                                                      │
│ ☐ Solo ofertas│                                                      │
│ ☐ Disponibles │                                                      │
└──────────────┴─────────────────────────────────────────────────────┘
 sidebar 260px, fijo al hacer scroll          grid 3 columnas (4 en 2xl)
```

```
MÓVIL
Inicio / Productos
Persianas
18 productos
┌───────────────────┬───────────────────┐
│ ⚙ Filtrar (2)     │ ⇅ Recomendados ▾  │  ← dos botones de 44px, mitad y mitad
└───────────────────┴───────────────────┘
[Optima ✕] [Hasta $1,500 ✕] →            ← chips con scroll horizontal
┌────────┐ ┌────────┐
│        │ │        │                     ← 2 columnas
└────────┘ └────────┘
…
‹  Página 2 de 3  ›
                ┌──────────────────┐
                │ ⚙ Filtrar y ordenar│     ← píldora flotante cuando la barra
                └──────────────────┘        de arriba ya no se ve
```

## Filtros

**Desktop: se aplican al instante.** Cada casilla actualiza la URL y el grid; la casilla cambia de inmediato (estado optimista) y el grid se atenúa mientras llega el resultado (`aria-busy`). No hace falta un botón "Aplicar".

**Móvil: hoja inferior a 90 % del alto de pantalla.**

```
┌─────────────────────────────┐
│ Filtros                   ✕ │
├─────────────────────────────┤
│ Categoría                   │  ← secciones colapsables,
│ Precio                      │    Categoría abierta por defecto
│ Disponibilidad              │
│ …                           │
├─────────────────────────────┤
│ [Limpiar]  [Ver 12 productos]│  ← fijo abajo, en la zona del pulgar
└─────────────────────────────┘
```

- Los cambios se acumulan y se aplican con **"Ver N productos"**. Recargar el grid detrás del modal en cada toque sería lento y el usuario no lo vería.
- **El botón dice cuántos resultados va a obtener** antes de aplicar (consulta ligera a `/api/catalog/count`). Si es 0, el botón se desactiva y dice "Sin resultados": evita llegar a una página vacía.
- Cerrar con ✕, Esc o deslizando descarta los cambios no aplicados.

**Qué filtros y por qué**

- **Categoría y línea** (árbol de 2 niveles). Marcar "Persianas" incluye todas sus líneas. Cada opción muestra cuántos productos hay **con los demás filtros aplicados**; las que darían 0 se ven deshabilitadas en lugar de esconderse (el usuario entiende por qué no hay).
- **Precio**: rangos predefinidos (un toque) + mínimo/máximo para quien quiere precisión. En móvil los rangos son lo más usado; escribir números es lento.
- **Solo ofertas** y **Solo disponibles**.
- Se agregarán **color, medida y material** cuando existan en las variantes (el schema ya lo permite con `ProductOption`).

**Chips de filtros activos** encima del grid: cada uno con ✕ para quitarlo y "Limpiar todo". Es la forma más rápida de deshacer un filtro sin abrir el panel.

## Orden

`<select>` nativo: en móvil abre el selector del sistema, que es más cómodo y accesible que un menú propio.

Opciones: Recomendados (destacados primero) · Más relevantes (solo con búsqueda, y es el predeterminado) · Precio: menor a mayor · Precio: mayor a menor · Más nuevos · Nombre A–Z.

## Paginación

- **12 productos por página** (divisible entre 2, 3 y 4 columnas: nunca queda una fila incompleta salvo en la última página).
- **Paginación numerada con enlaces reales** (`?pagina=2`): Google puede rastrear todas las páginas, el usuario sabe cuánto falta y puede volver a "la página 3" donde vio algo. Se descartó el scroll infinito: rompe el footer y el botón "Atrás".
- Desktop: ‹ Anterior · 1 2 **3** 4 … 9 · Siguiente ›. Móvil: ‹ · Página 3 de 9 · › (los números no caben con áreas de 44px).
- "Mostrando 13–24 de 30" para dar contexto.

## Estados

| Estado | Comportamiento |
|---|---|
| Cargando (entrada) | Esqueleto con el mismo layout: título, barra, 6 tarjetas grises. Sin saltos al llegar el contenido |
| Cargando (cambio de filtro) | El grid se atenúa al 50 % con `aria-busy="true"`; los controles responden de inmediato |
| Sin resultados | "No encontramos productos con estos filtros", chips para quitar filtros uno por uno, "Limpiar filtros" y categorías populares |
| Búsqueda sin resultados | Igual, más "Revisa la ortografía o prueba con otra palabra" |
| Página fuera de rango | Se muestra la última página válida |
| Opción de filtro sin resultados | Deshabilitada, con su "(0)" |

## Accesibilidad

- Los filtros son `<fieldset>` con `<legend>`; las casillas son `<input type="checkbox">` reales con `<label>` (áreas de 44px).
- El número de resultados es una región `aria-live="polite"`: el lector anuncia "18 productos" al cambiar un filtro.
- La paginación es `<nav aria-label="Paginación">` con `aria-current="page"`.
- Al cambiar de página, el scroll vuelve al inicio del listado.

## Conversión

- La tarjeta es la misma del home (precio, oferta, "Desde", existencias bajas) para que el usuario no tenga que reaprender.
- El H1 y la descripción de la categoría confirman que está en el lugar correcto.
- Los filtros más útiles (categoría y precio) van primero; los menos usados, al final.
- SEO: las páginas por categoría (`?categoria=persianas`) tienen título propio y se indexan; las combinaciones con precio, orden o varios filtros llevan `noindex` para no crear miles de páginas duplicadas.

---

## Implementación (2026-10-29)

- Página: `src/app/(tienda)/productos/page.tsx`. El listado lee `searchParams`, así que va dentro de `<Suspense>` con un esqueleto: header y footer se prerenderizan y el listado se transmite (Partial Prerender).
- Componentes en `src/components/catalog/`. Filtros y URL en `src/lib/catalog-params.ts` (compartido con el cliente); la consulta en `src/lib/catalog.ts` (solo servidor, se cambiará por Prisma).
- Desktop: `useOptimistic` + `useTransition`, así la casilla cambia al instante y el grid se atenúa mientras llega la respuesta.
- Móvil: los conteos junto a cada opción del modal reflejan los filtros **aplicados**, no el borrador; el botón "Ver N productos" sí refleja el borrador.
- El catálogo de ejemplo tiene 30 productos (16 persianas, 14 tapetes) para probar la paginación; la mayoría sin foto.
- Pendiente: filtros por color, medida y material cuando existan las variantes.

## Filtros por atributo (2026-11-04)

Los mismos filtros de terza-sitio: Línea, Colección, Tipo, Estilo, Especie, Tono, Color, Uso y Presentación. Cada producto guarda sus valores en `Product.attributes` (JSON, desde `filtros` del catálogo de terza-sitio).

- Aparecen al elegir una categoría, solo los que tienen valores en esas categorías (p. ej. Persianas → Línea, Colección, Tipo; Alfombras → Estilo, Tono, Uso). Sin categoría, un aviso invita a elegir una.
- Casillas con conteo; dentro de un atributo los valores se suman (O) y entre atributos se combinan (Y). Un atributo con selección cuenta ignorando su propio filtro.
- Más de 8 valores: "Ver todos (N)"; los elegidos siempre quedan visibles.
- En la URL: `?categoria=persianas&linea=Optima&tipo=Black%20Out`. Chips "Línea: Optima" en filtros aplicados; "Limpiar" quita también los atributos. Cambiar de categoría limpia los atributos.
