# Detalle de producto (`/productos/[slug]`)

## Objetivo

Responder en una sola pantalla las cuatro preguntas que deciden la compra: **¿cómo se ve?, ¿cuál me sirve?, ¿cuánto cuesta y lo tienen?, ¿qué pasa si no me queda?** El botón "Agregar al carrito" debe estar siempre a un toque.

## Layout

```
DESKTOP (≥1024)
Inicio / Productos / Persianas / Optima
┌──────────────────────────────┬───────────────────────────────┐
│ ┌──┐ ┌────────────────────┐  │ OPTIMA                         │
│ │  │ │                    │  │ Persiana enrollable Optima…    │  ← H1
│ ├──┤ │                    │  │ $1,980  $2,330  -15%           │
│ │  │ │   imagen 4:5       │  │                                │
│ ├──┤ │   (clic = ampliar) │  │ Color: Gris                    │
│ │  │ │                    │  │ (●)(●)(●)                      │  ← muestras de 44px
│ └──┘ └────────────────────┘  │ Medida: 120 × 160 cm           │
│ miniaturas    galería        │ [100×160][120×160][140×180]…   │
│  7/12 columnas               │ ● Disponible · 12 piezas       │
│                              │ [− 1 +] [ Agregar al carrito ] │
│                              │ 🚚 Envío gratis desde $999     │
│                              │ 🛡 Garantía Terza · ☎ Asesoría │
│                              │  5/12, fijo al hacer scroll    │
├──────────────────────────────┴───────────────────────────────┤
│ Descripción · Características · Envíos y devoluciones · Instalación (acordeón) │
│ También te puede interesar  [card][card][card][card]           │
└──────────────────────────────────────────────────────────────┘
```

```
MÓVIL
┌───────────────────────┐
│  imagen (deslizar)     │  ← carrusel a todo el ancho, "1 / 4"
│        ● ○ ○ ○         │
├───────────────────────┤
│ OPTIMA                 │
│ Persiana enrollable…   │
│ $1,980 ~~$2,330~~ -15% │
│ Color: Gris            │
│ (●)(●)(●)              │
│ Medida: 120 × 160 cm   │
│ [100×160][120×160] →   │
│ ● Disponible           │
│ [− 1 +][ Agregar     ] │
│ …                      │
├───────────────────────┤
│ $1,980   [Agregar   ]  │  ← barra fija inferior: aparece cuando
└───────────────────────┘     el botón principal sale de la pantalla
```

## Galería

- **Móvil:** carrusel a todo el ancho con deslizamiento, puntos y contador "1 / 4". Es el gesto que el usuario ya hace en Instagram y en otras tiendas.
- **Desktop:** miniaturas verticales a la izquierda y la imagen grande. Pasar el cursor por una miniatura no cambia la imagen (se cambia con clic); así no salta mientras el mouse cruza la columna.
- **Ampliar:** al tocar la imagen se abre a pantalla completa (fondo blanco, deslizable, Esc para cerrar). En persianas y tapetes la textura de la tela decide la compra.
- **Al elegir un color con foto propia**, la galería salta a esa foto (`ProductImage.variantId`).
- **Sin foto:** fondo `surface` con ícono, nunca un hueco.

## Selector de variantes

- **Colores como muestras redondas** de 44px con el nombre en el `aria-label` y escrito arriba ("Color: Gris"). Las muestras se entienden más rápido que una lista de nombres.
- **Medidas como botones** con el texto completo ("120 × 160 cm"). En móvil se deslizan en una fila si no caben.
- **Hay una variante elegida desde el inicio** (la primera disponible). Así el precio y el stock son reales desde que carga la página y el botón nunca dice "Elige una opción".
- **Combinación agotada:** se muestra tachada pero se puede elegir. El precio y el estado cambian a "Agotado" y el botón se desactiva con el texto "Agotado"; debajo se sugiere elegir otra medida o color. Esconderla haría pensar que esa medida no existe.
- **Combinación que no existe:** deshabilitada.
- El precio cambia según la variante. La transición dura 150 ms para que se note el cambio.
- Accesibilidad: cada grupo es un `radiogroup` con flechas del teclado; el precio y el estado tienen `aria-live="polite"`.

## Precio y stock

| Situación | Se muestra |
|---|---|
| Disponible | ● verde "Disponible" |
| `stock ≤ lowStockAlert` | ● ámbar "¡Últimas 3 piezas!" |
| Agotado | ● gris "Agotado", botón desactivado |
| Oferta | Precio actual grande, anterior tachado y etiqueta "-15%" en lima |

El selector de cantidad llega hasta el stock disponible (máximo 10 por compra).

## Botón de compra

- **"Agregar al carrito"** ocupa el ancho disponible al lado de la cantidad; altura de 48px.
- Al tocarlo: el botón muestra ✓ "Agregado" por 2 segundos, el contador del carrito hace su animación y **se abre el carrito lateral** con "Ir a pagar". Es la confirmación más clara de que funcionó y deja el siguiente paso a un toque.
- **Barra fija en móvil:** cuando el botón principal sale de la pantalla aparece abajo una barra con precio, variante y "Agregar". Respeta el área segura del iPhone.
- **Desktop:** la columna de información queda fija al hacer scroll, así que el botón siempre está visible y no hace falta otra barra.

## Confianza (debajo del botón)

- Envío gratis desde el monto configurado (provisional).
- Garantía Terza.
- Asesoría por teléfono, con enlace `tel:`.
- Enlace a la política de devoluciones.

Van debajo del botón, no arriba: responden "¿y si algo sale mal?" justo cuando el usuario está por decidir.

## Información del producto

Acordeón con: **Descripción** (abierta), **Características** (tabla), **Envíos y devoluciones** e **Instalación** (solo persianas, con el tutorial de su línea). En móvil el acordeón evita una página interminable; en desktop la descripción queda abierta.

## Relacionados

"También te puede interesar": 4 productos de la misma línea o categoría, con la misma tarjeta del catálogo. Evita el callejón sin salida si este no le convenció.

## SEO

- `<title>` y descripción propios por producto.
- **Datos estructurados `Product`** (JSON-LD) con `AggregateOffer` (rango de precios), disponibilidad y marca. Habilita resultados enriquecidos en Google (precio y stock en el buscador).
- Migas de pan con enlaces reales.

## Estados

| Estado | Comportamiento |
|---|---|
| Producto inexistente | Página "No encontramos este producto" con buscador y categorías, dentro del layout de la tienda |
| Producto agotado por completo | Precio visible, "Agotado" y relacionados destacados |
| Agregando | El botón muestra ✓ "Agregado" y se abre el carrito |

---

## Implementación (2026-10-29)

- Página: `src/app/(tienda)/productos/[slug]/page.tsx`. Con `generateStaticParams` cada producto se prerenderiza; el contenido va en `<Suspense>` con esqueleto para que la navegación entre productos sea instantánea (aviso de Next 16).
- Componentes: `product-main.tsx` (estado de variante, precio, stock, cantidad, compra y barra fija), `variant-selector.tsx`, `product-gallery.tsx` (Embla + visor a pantalla completa con `Dialog`).
- Datos de prueba en `src/lib/product-detail.ts`: persianas con Color (3) × Medida (4) y existencias repartidas para tener casos agotados; tapetes con una sola variante. Descripción y características son textos neutros hasta que el cliente cargue los reales.
- La barra fija y la píldora del catálogo usan `useScrolledPast` (scroll pasivo) en lugar de IntersectionObserver.
- El dominio de los datos estructurados (`storeConfig.siteUrl`) está por confirmar.
- Pendiente: la variante elegida no se guarda en la URL (`?variante=`); conviene agregarla cuando haya campañas de anuncios por variante.
