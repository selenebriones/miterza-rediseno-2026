# Home y Footer

## Objetivo del Home

En los primeros 5 segundos el visitante debe saber **qué vende Mi Terza** (persianas y tapetes), **por qué comprar aquí** y **por dónde empezar**. Cada sección tiene un solo trabajo y un CTA claro hacia el catálogo.

Orden recomendado (administrable desde el panel con `HomeSection`):

| # | Sección | Trabajo | CTA |
|---|---|---|---|
| 1 | Banners principales | Mensaje principal / campaña | "Ver tapetes Kids", "Ver persianas" |
| 2 | Propuesta de valor (franja) | Quitar dudas antes de explorar | — |
| 3 | Carrusel de categorías | Llevar a la categoría correcta en un toque | Cada tarjeta |
| 4 | Productos destacados | Mostrar precio y producto real | Cada producto, "Ver todo" |
| 5 | Guía de medidas e instalación | Quitar el miedo a medir mal (la principal objeción en persianas) | Ver tutorial |

La propuesta de valor va **justo debajo del banner** y no al final: los beneficios (garantía, 40 años, asesoría) responden a "¿me conviene comprar aquí?" antes de que el usuario empiece a explorar.

---

## 1. Banners principales

```
MÓVIL                                   DESKTOP (≥1024)
┌───────────────────────┐               ┌──────────────────────────────────────────────┐
│                       │               │ Su primer mundo,        │                     │
│     [ foto 4:3 ]      │               │ más suave y seguro.     │    [ foto ]         │
│                       │               │ Tapetes que acompañan…  │                     │
├───────────────────────┤               │ [ Ver tapetes Kids ]    │                     │
│ Su primer mundo,      │               │ ● ○                ‖ ‹ › │                     │
│ más suave y seguro.   │               └──────────────────────────────────────────────┘
│ Tapetes que acompañan │                   texto 5/12 · imagen 7/12 · alto 480px
│ [ Ver tapetes Kids  ] │  ← botón a todo el ancho
│ ● ○              ‖    │
└───────────────────────┘
```

```html
<section aria-roledescription="carrusel" aria-label="Promociones">
  <div aria-roledescription="diapositiva" aria-label="1 de 2">
    <picture>imageMobile (4:3) / imageDesktop</picture>
    <div class="bg-surface | bg-brand">     <!-- Banner.theme: light | dark -->
      <h2>Su primer mundo, más suave y seguro.</h2>
      <p>subtítulo</p>
      <a class="btn-primary">Ver tapetes Kids</a>
    </div>
  </div>
  <button aria-label="Pausar">‖</button> <button>‹</button> <button>›</button> <dots/>
</section>
```

**Decisiones**

- **El texto va en HTML, no dentro de la imagen.** Las imágenes de miterza.com traen el texto incrustado: en móvil no se lee, los lectores de pantalla no lo ven y Google no lo indexa. Recorté solo la foto; el panel guarda título, subtítulo y CTA aparte (`Banner`).
- **Imagen distinta para móvil** (`imageMobile`): en vertical se recorta el sujeto, no se encoge el banner completo.
- **Máximo 3 banners.** Después del primero casi nadie los ve; el primero lleva el mensaje más importante.
- **Rotación automática lenta (7 s) con botón de pausa** (obligatorio por WCAG 2.2.2). Se pausa al pasar el cursor, al enfocar con teclado y al tocar; no rota si el usuario pidió reducir movimiento.
- **Un CTA por banner**, con texto que dice a dónde lleva ("Ver tapetes Kids", no "Ver más").
- El primer banner carga con prioridad (`priority`) porque es el LCP de la página.
- El `<h1>` de la página es "Persianas y tapetes Terza", oculto visualmente; los títulos de los banners son `<h2>`, porque cambian.

## 2. Propuesta de valor

```
MÓVIL: cuadrícula 2×2 (las 4 a la vista, sin deslizar)
DESKTOP: 4 columnas en una franja bg-surface
┌────────────┬────────────┬────────────┬────────────┐
│ 🛡 Garantía │ 🏆 +40 años │ 🎨 Variedad │ 🎧 Asesoría │
│ Terza      │ de respaldo│ de telas   │ (800) …    │
└────────────┴────────────┴────────────┴────────────┘
```

- **2×2 en móvil y no carrusel**: son 4 textos cortos; esconder 3 detrás de un deslizamiento hace que casi nadie los lea.
- Textos tomados del sitio actual (40 años, telas y componentes de calidad, garantías, soporte telefónico).
- Ícono + título de 2–4 palabras + una línea. Nada de párrafos.
- La asesoría lleva el teléfono como enlace `tel:` (en móvil abre el marcador).

## 3. Carrusel de categorías

```
MÓVIL (scroll horizontal con snap)        DESKTOP (5 columnas; flechas si hay más)
┌──────┐┌──────┐┌──                      ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│ foto ││ foto ││ fo                     │ foto ││ foto ││ foto ││ foto ││ foto │
│Persia││Tapete││ Op                     │      ││      ││      ││      ││      │
└──────┘└──────┘└──                      └──────┘└──────┘└──────┘└──────┘└──────┘
Compra por categoría        Ver todo →    Persianas Tapetes  Optima   Stylo    Kids
```

- Salen de `Category.showInHome` y su orden: hoy Persianas, Tapetes y las líneas con foto (Optima, Stylo, Kids).
- **En móvil la tercera tarjeta se ve cortada a propósito**: es la señal de que hay más a la derecha.
- Tarjeta completa clicable (no solo el texto). Nombre debajo de la foto, no encima, para que siempre se lea.
- Hover en desktop: la foto se acerca un poco (`scale-105`) y el nombre se pone verde.

## 4. Productos destacados

```
Productos destacados                             Ver todo →
┌─────────┐┌─────────┐┌─────────┐┌─────────┐
│ -15%    ││ Nuevo   ││         ││         │   ← etiqueta bg-accent text-brand
│ [foto]  ││ [foto]  ││ [foto]  ││ [foto]  │
│ OPTIMA  ││ TRACE   ││         ││         │   ← línea, texto pequeño
│ Persiana││ Tapete  ││         ││         │   ← nombre, 2 líneas máx.
│ $1,890  ││ $2,190  ││         ││         │
│ ~~2,220~~││        ││         ││         │
│ Últimas ││         ││         ││         │   ← solo si stock ≤ lowStockAlert
└─────────┘└─────────┘└─────────┘└─────────┘
Móvil: 2 columnas · Tablet: 3 · Desktop: 4
```

- `ProductCard` es el mismo componente que usará el catálogo (`/productos`).
- **"Desde $X"** cuando el producto tiene variantes con precios distintos (persianas a la medida).
- **Sin botón "Agregar" en la tarjeta**: casi todos los productos piden elegir medida o color. Un botón que obliga a elegir después frustra; la tarjeta lleva al detalle.
- Precio de oferta: precio actual en negro y grande, anterior tachado en gris y etiqueta "-15%" en lima.
- "Últimas piezas" solo cuando es verdad (`stock ≤ lowStockAlert`). La urgencia falsa destruye la confianza.

## 5. Guía de medidas e instalación

- Dos tarjetas con los tutoriales actuales de YouTube (Optima/Select y Stylo).
- Abren el video en YouTube en una pestaña nueva, sin cargar el reproductor en la página (más rápido).
- Es la objeción número uno en persianas ("¿y si mido mal?"); verla en el home baja el abandono.

---

## Footer

```
MÓVIL                                    DESKTOP
┌──────────────────────────┐            ┌───────────────────────────────────────────────────────┐
│ [logo]                   │            │ [logo]            Tienda      Ayuda        Legales     │
│ Más de 40 años…          │            │ Más de 40 años…   Persianas   Preguntas    Privacidad  │
│                          │            │                   Tapetes     Mi cuenta    Devoluciones│
│ ¿Necesitas ayuda?        │            │ ¿Necesitas ayuda? Ofertas     Nosotros     Cancelación │
│ ☎ (800) 228 3792         │            │ ☎ (800) 228 3792                           Cookies     │
│ ✉ soporte@miterza.com    │            │ ✉ soporte@…                                            │
│                          │            │ [f] [ig] [yt] [in]                                     │
│ Tienda              ⌄    │  ← acordeón ├───────────────────────────────────────────────────────┤
│ Ayuda               ⌄    │            │ © 2026 Terza                                           │
│ Legales             ⌄    │            └───────────────────────────────────────────────────────┘
│ [f] [ig] [yt] [in]       │
│ © 2026 Terza             │
└──────────────────────────┘
```

**Decisiones**

- **Fondo `brand`, texto blanco** (9.23:1). Los enlaces en blanco al 80 % para jerarquía (sigue arriba de 7:1).
- **En móvil, columnas en acordeón**: tres listas abiertas ocupan dos pantallas de scroll. El contacto queda siempre abierto porque es lo que más se busca en el footer.
- **Contacto antes que enlaces**: el teléfono como `tel:` y el correo como `mailto:`.
- **Redes con `aria-label`** ("Terza en Instagram") y áreas de 44 px.
- Los enlaces del footer salen de los menús `FOOTER` y `FOOTER_LEGAL` del panel.
- Pendiente con el cliente: razón social para el ©, logos de métodos de pago (dan confianza en el footer y en el checkout) y si quieren boletín por correo.

## Micro-interacciones y estados

| Elemento | Estado | Comportamiento |
|---|---|---|
| Banner | Cambio | Deslizamiento de 300 ms; puntos indican posición (el actual más ancho, en lima) |
| Banner | Pausado | Ícono cambia a ▶ y `aria-label="Reanudar"` |
| Tarjeta de categoría | Hover / foco | Foto `scale-105` (300 ms), nombre en `brand` |
| Tarjeta de producto | Hover | Sombra `card-hover` y foto `scale-105` |
| Tarjeta de producto | Sin imagen | Fondo `surface` con ícono, nunca un hueco vacío |
| Secciones | Cargando | Esqueletos del mismo tamaño que el contenido (sin saltos de diseño) |
| Destacados | Vacío | Si no hay productos destacados, la sección no se muestra |

---

## Implementación (2026-10-29)

- Código: `src/components/home/`, `src/components/product/product-card.tsx`, `src/components/footer/`. Datos provisionales en `src/lib/home.ts` y `src/lib/sample-catalog.ts`.
- Fotos de `public/home/` recortadas de las imágenes de miterza.com **sin el texto incrustado**. Para producción conviene pedir los originales sin texto.
- Productos destacados de ejemplo: nombres de líneas reales, pero precios, existencias y fotos asignadas son de prueba.
- Se agregó `INSTALL_GUIDE` al enum `HomeSectionType` del schema.
- La rotación de banners usa un temporizador propio (no el plugin de Embla) para pausar de forma fiable con cursor, foco, arrastre y el botón.
