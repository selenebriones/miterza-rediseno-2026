# Header: móvil vs. desktop

Objetivo: que en cualquier pantalla el usuario pueda **buscar**, **ver su carrito** y **llegar a una categoría** en un toque o dos, sin que el header ocupe más del 10–12 % del alto de la pantalla en móvil.

Prioridad de elementos (de más a menos visible):

1. Carrito (es el paso hacia la compra; siempre a la vista)
2. Buscador (la vía más rápida a un producto)
3. Logo (orientación y regreso al inicio)
4. Categorías (exploración)
5. Cuenta, Nosotros, FAQ (secundarios)

---

## Móvil (< 1024 px, `lg`)

```
┌─────────────────────────────────────────┐
│  Envío gratis desde $999 · Ver más   ✕  │  ← barra de aviso (opcional, 32px, bg-accent text-brand)
├─────────────────────────────────────────┤
│ [☰]          [ LOGO ]          [🔍] [🛒2]│  ← barra principal 64px, bg-brand
├─────────────────────────────────────────┤
│ 🔍  Buscar productos…                    │  ← solo en Home y /productos; se oculta al bajar
└─────────────────────────────────────────┘
```

```html
<header class="sticky top-0 z-header">
  <a href="#contenido" class="sr-only focus:not-sr-only">Saltar al contenido</a>
  <AnnouncementBar />                         <!-- 1 mensaje, se puede cerrar -->
  <div class="flex h-header items-center justify-between bg-brand px-2">
    <button aria-label="Abrir menú" aria-expanded="false" aria-controls="menu-movil"
            class="size-tap">☰</button>
    <a href="/" aria-label="Mi Terza, inicio"><Logo class="h-8" /></a>
    <div class="flex">
      <button aria-label="Buscar" class="size-tap">🔍</button>
      <button aria-label="Carrito, 2 productos" class="size-tap relative">
        🛒 <span aria-hidden="true" class="badge bg-accent text-brand">2</span>
      </button>
    </div>
  </div>
  <SearchBar class="lg:hidden" />            <!-- solo en Home y PLP -->
</header>

<Sheet side="left" id="menu-movil">          <!-- Radix Dialog: foco atrapado, Esc cierra -->
  <SearchField />
  <nav aria-label="Categorías">
    <Accordion>Categoría → subcategorías</Accordion>   <!-- un solo nivel desplegable -->
  </nav>
  <nav aria-label="Información">Nosotros · Preguntas frecuentes</nav>
  <a>Mi cuenta / Iniciar sesión</a>
  <a>¿Necesitas ayuda? Teléfono y correo de soporte</a>
</Sheet>
```

**Decisiones**

- **Menú a la izquierda, carrito a la derecha.** Es el patrón que el usuario ya conoce; el carrito queda en la zona del pulgar derecho.
- **El logo va centrado** para que los dos botones queden en los extremos y no se toquen por error.
- **La cuenta va dentro del menú**, no en la barra: en móvil se usa poco y cada ícono extra le resta espacio a lo importante.
- **El buscador es una barra completa solo donde se busca** (Home y catálogo). En el detalle de producto se queda como ícono para dejar más espacio a la galería.
- **Se oculta al bajar y reaparece al subir** (`translate-y` con `transition`), así no ocupa espacio mientras se lee y vuelve en cuanto el usuario lo busca.
- **No recomiendo barra de navegación inferior** (tab bar): duplica el header y compite con la barra fija de "Agregar al carrito" del detalle de producto.
- **Las categorías en el menú se ven como acordeón de un solo nivel.** Más niveles en móvil hacen que el usuario se pierda.

**Búsqueda en móvil.** Al tocar 🔍 se abre una capa a pantalla completa con el campo enfocado:

- `type="search"`, `enterkeyhint="search"`, fuente de 16 px (si es menor, iOS hace zoom solo).
- Antes de escribir: búsquedas recientes y categorías populares.
- Desde 2 caracteres, con 250 ms de espera: hasta 5 productos con miniatura y precio, y 3 categorías.
- Sin resultados: "No encontramos “xyz”", sugerencias y un enlace a todo el catálogo. Nunca una pantalla vacía.

---

## Desktop (≥ 1024 px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Envío gratis desde $999 · Ver productos   Nosotros · Preguntas frecuentes · ☎ │  ← 32px, texto pequeño
├──────────────────────────────────────────────────────────────────────────┤
│ [ LOGO ]     [ 🔍 Buscar productos, marcas o categorías…     ]  👤 Cuenta  🛒 Carrito (2) │  ← 72px, bg-brand
├──────────────────────────────────────────────────────────────────────────┤
│ Persianas ▾ · Tapetes ▾ · [Ofertas]                                          │  ← 48px, bg-white
└──────────────────────────────────────────────────────────────────────────┘
```

```html
<header class="sticky top-0 z-header">
  <TopBar />                                       <!-- aviso + enlaces de información -->
  <div class="container flex h-18 items-center gap-8 bg-brand">
    <Logo />
    <SearchCombobox class="max-w-2xl flex-1" />   <!-- autocompletado en desplegable -->
    <a href="/cuenta">👤 Cuenta</a>
    <CartButton>🛒 Carrito <span>(2)</span></CartButton>
  </div>
  <NavigationMenu aria-label="Categorías" class="h-12 border-b border-line bg-white">
    <MegaMenuTrigger>Persianas</MegaMenuTrigger>   <!-- panel: descripción + "Ver todo" + líneas -->
    <MegaMenuTrigger>Tapetes</MegaMenuTrigger>
    <MenuItem highlight>Ofertas</MenuItem>         <!-- bg-accent text-brand -->
  </NavigationMenu>
</header>
```

**Decisiones**

- **El buscador va al centro y es el elemento más ancho.** En una tienda con catálogo grande, buscar convierte más que navegar.
- **El carrito lleva texto, no solo ícono** ("Carrito (2)"): en desktop sí hay espacio y se lee más rápido.
- **Una entrada por categoría, con su mega menú.** Mi Terza tiene dos categorías (Persianas y Tapetes) con 3 y 5 líneas, así que un menú "Todas las categorías" sería un clic de más. Si el catálogo crece a más de 6 o 7 categorías, se agrega ese menú. Las categorías y su orden se administran desde el panel (`MenuItem`).
- **Mega menú con Radix `NavigationMenu`:** se abre con hover (con 150 ms de espera para que no se abra al pasar el cursor de paso), con clic y con teclado.
- **Al bajar, el header se compacta:** desaparece la barra superior, la principal baja a 56 px y la de categorías se mantiene. El buscador y el carrito no se pierden nunca.

---

## Carrito (ambos tamaños)

- El ícono abre un **mini carrito lateral** (Sheet desde la derecha), no otra página: el usuario no pierde lo que estaba viendo.
- Contenido: productos con cantidad editable, subtotal, barra de avance hacia el envío gratis ("Te faltan $230 para envío gratis") y **un solo CTA principal: "Ir a pagar"**. "Ver carrito" queda como enlace secundario.
- **Carrito vacío:** ilustración ligera, "Tu carrito está vacío" y botón "Explorar productos". No mostrar una pantalla en blanco.

## Micro-interacciones y estados

| Elemento | Estado | Comportamiento |
|---|---|---|
| Badge del carrito | Al agregar | Animación `animate-cart-bump` + aviso `aria-live="polite"` ("Producto agregado") |
| Enlaces de categoría | Hover / foco | Subrayado `accent` de 2 px que crece desde la izquierda (`scale-x`, 150 ms) |
| Íconos en `bg-brand` | Hover / activo | Fondo `brand-hover` / `brand-active`, círculo de 44 px |
| Buscador | Cargando | Skeleton de 3 filas; spinner solo si tarda más de 300 ms |
| Buscador | Sin resultados | Mensaje + sugerencias + enlace al catálogo |
| Drawer / Sheet | Abrir / cerrar | Deslizamiento de 200 ms; se respeta `prefers-reduced-motion` |

## Accesibilidad

- Enlace "Saltar al contenido" como primer elemento enfocable.
- Botones de ícono con `aria-label`; el número del carrito va dentro del label ("Carrito, 2 productos").
- `aria-expanded` y `aria-controls` en el botón de menú y el mega menú.
- Áreas táctiles de 44 × 44 px como mínimo (`size-tap`) con 8 px de separación.
- Contraste: texto blanco sobre `brand` 9.23:1; `accent` **nunca** como texto sobre blanco (1.57:1), solo como fondo con texto `brand` o como texto sobre `brand`.
- Al cerrar un drawer, el foco regresa al botón que lo abrió (Radix lo hace por defecto).

## Conversión

- Carrito y buscador siempre visibles, también con el header compacto.
- La barra de aviso comunica **un solo** beneficio (envío gratis, meses sin intereses); se administra desde el panel.
- "Ofertas" en la barra de categorías con fondo `accent`: es el único elemento del menú que usa el color de promoción.
- En el checkout el header se reduce a logo + "Compra segura": quitar navegación ahí reduce el abandono.

---

## Implementación (2026-10-29)

Código en `src/components/header/` y `src/components/cart/`. Ajustes respecto a la propuesta:

- **La barra de aviso no es fija.** Se va con la página al bajar (sin JavaScript); el header fijo empieza en la barra verde.
- **En móvil el enlace del aviso se oculta** (en 375px cortaba el texto); el mensaje queda completo.
- **Ayuda por teléfono y correo** (los de miterza.com). Si el cliente usa WhatsApp, se agrega en `store-config.ts`.
- **La barra de búsqueda móvil es un botón** que abre la capa de búsqueda: así el teclado no aparece por accidente y la capa tiene espacio para los resultados.
- **Datos provisionales:** menú, aviso y búsqueda salen de `src/lib/navigation.ts` y `src/lib/search.ts` con la forma de los modelos de Prisma; al conectar la base solo cambia el cuerpo de esas funciones. El monto de envío gratis ($999) está por confirmar.
- **Logo:** se usa el PNG de miterza.com pintado de blanco con CSS. Falta el SVG oficial (versión a color y en blanco).

---

## Actualización: header al estilo de terza.com (2026-11-03)

Se reemplazó el header verde con buscador al centro por el de `terza-sitio`:

- **Una sola barra blanca** con borde inferior: logo a color a la izquierda, menú con flechas (Persianas, Tapetes, Ofertas) y, a la derecha, botón de búsqueda circular en lima claro (`#d5fe7d`), favoritos (círculo con borde y contador), **"Mi cuenta"** en píldora verde oscuro y **"Carrito"** en píldora lima con contador.
- **Búsqueda (2026-11-05, igual que terza-sitio):** el botón circular abre una capa a pantalla completa en verde oscuro translúcido (`#023c37` al 95 % con desenfoque), en móvil y desktop. Supratítulo lima "¿Qué estás buscando?", campo en píldora con borde blanco (lima al enfocar) y botón lima con lupa; antes de escribir, "Búsquedas recientes" y "Búsquedas populares" (6 categorías) en píldoras que llenan el campo. Resultados en blanco, grandes y separados por líneas (categorías, luego productos con miniatura), con flecha; el marcado con teclado se pone en lima. Esc borra el texto y un segundo Esc cierra; clic en el fondo también cierra.
- **Móvil:** menú ☰, logo, búsqueda y carrito (círculos de 44 px). Se quitó la barra de búsqueda verde que había debajo.
- **Mega menú:** se conserva; ahora se abre justo debajo de la barra y la línea lima de énfasis queda en el borde inferior del header.
- **Contraste:** el texto de la píldora lima es verde oscuro (en terza.com es blanco, pero blanco sobre `#bcdc00` da 1.57:1).

### Segunda actualización (2026-11-03)

- **Botones de cuenta y carrito:** solo ícono dentro de un círculo de 48 px, a juego con la búsqueda y los favoritos: búsqueda (lima claro), favoritos (borde), cuenta (verde oscuro) y carrito (lima), estos dos últimos con contador.
- **Mega menú de ancho completo** (como en terza-sitio): al abrir Persianas o Tapetes baja un panel bajo el header con título y descripción de la categoría, la lista de líneas a la izquierda (con flecha) y, a la derecha, 4 tarjetas de productos de la línea elegida (foto 3:2, nombre y precio) más el botón lima "Ver todo <línea>". Al pasar el cursor por una línea cambian las tarjetas. Se abre con cursor, clic o teclado; Esc cierra y devuelve el foco; navegar a otra página lo cierra.
- Las tarjetas salen de la base (hasta 4 productos por línea, destacados primero) con la etiqueta de caché `catalog`.
