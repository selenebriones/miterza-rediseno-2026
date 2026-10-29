# Carrito (`/carrito`) y checkout (`/checkout`)

## Objetivo

Que nadie abandone la compra por **sorpresas** (costos, cambios de precio, productos agotados al final) ni por **fricción** (crear cuenta, formularios largos, no saber cuántos pasos faltan).

Flujo: mini carrito lateral → `/carrito` (opcional) → `/checkout` (una sola página) → `/checkout/confirmacion/[id]`.

---

## Carrito

```
DESKTOP
Tu carrito (3)
┌───────────────────────────────────────────┬──────────────────────────┐
│ [img] Persiana Optima Screen 5%       ✕   │ Resumen                  │
│       Gris · 120 × 160 cm                 │ Subtotal        $5,960   │
│       [− 2 +]                  $3,960     │ Envío           Gratis   │
│ ───────────────────────────────────────── │ ──────────────────────── │
│ [img] Tapete Trace Beige 120 × 170    ✕   │ Total           $5,960   │
│       [− 1 +]                  $2,190     │ [   Continuar al pago  ] │
│                                           │ 🔒 Pago seguro · Garantía│
│ ← Seguir comprando                        │ fijo al hacer scroll     │
└───────────────────────────────────────────┴──────────────────────────┘

MÓVIL: lista → resumen → botón; barra fija inferior con total y "Continuar al pago".
```

- **Se valida contra la base al abrir la página.** Si un precio cambió, se actualiza con un aviso ("El precio de X cambió de $A a $B"). Si una variante se agotó o ya no existe, se marca y se excluye del total. Así no hay sorpresas en el checkout.
- **La cantidad tiene como tope las existencias reales.**
- **Barra de envío gratis** (provisional, monto por confirmar) y costo de envío **visible desde el carrito**: el costo inesperado es la causa #1 de abandono.
- **Eliminar sin confirmación** y con opción de deshacer durante 5 segundos ("Se quitó X · Deshacer"). Confirmar cada borrado es fricción; deshacer cubre el error.
- **Estado vacío:** mensaje, botón "Explorar productos" y las categorías.
- **"Continuar al pago"** es el único botón principal. "Seguir comprando" queda como enlace secundario.

## Checkout

### Una sola página, sin crear cuenta

```
┌─ HEADER MÍNIMO ──────────────────────────────────────────────┐
│ [logo]                                   🔒 Compra segura     │  ← sin menú ni buscador
└──────────────────────────────────────────────────────────────┘
MÓVIL                                   DESKTOP
┌───────────────────────┐               ┌──────────────────────┬─────────────────┐
│ ▸ Ver resumen   $5,960│ ← plegable    │ 1 Contacto           │ Resumen         │
├───────────────────────┤               │   correo, teléfono   │ [img] x2 $3,960 │
│ 1 Contacto            │               │ 2 Envío              │ [img] x1 $2,190 │
│ 2 Envío               │               │   nombre, dirección  │ Subtotal        │
│ 3 Pago                │               │   CP, estado…        │ Envío           │
│ [Realizar pedido]     │               │ 3 Pago               │ Total           │
└───────────────────────┘               │ [Realizar pedido]    │ fijo al scroll  │
                                        └──────────────────────┴─────────────────┘
```

**Decisiones**

- **Compra como invitado.** Pedir cuenta antes de pagar es de las principales causas de abandono. Al final se puede ofrecer crear cuenta con los datos ya capturados (cuando exista el módulo de usuarios).
- **Una página con 3 secciones numeradas** en lugar de 3 pantallas: el usuario ve todo lo que falta, puede corregir arriba sin "regresar" y no se pierde el progreso.
- **Header mínimo:** sin menú, buscador ni footer completo. Quitar salidas en el checkout aumenta la conversión. Solo logo, "Compra segura" y enlace para volver al carrito.
- **Resumen siempre a la mano:** columna fija en desktop; en móvil, barra plegable arriba con el total ("Ver resumen · $5,960").

### Formulario

| Campo | Detalle |
|---|---|
| Correo | `type="email"`, `autocomplete="email"`. Para el seguimiento del pedido (y la confirmación cuando haya correos) |
| Teléfono | `type="tel"`, `inputmode="tel"`, 10 dígitos. Para coordinar la entrega |
| Nombre y apellidos | `autocomplete="given-name"` / `family-name` |
| Calle y número | `autocomplete="address-line1"` |
| Colonia | `autocomplete="address-line2"` |
| Código postal | `inputmode="numeric"`, 5 dígitos |
| Ciudad o municipio | `autocomplete="address-level2"` |
| Estado | `<select>` con los 32 estados, `autocomplete="address-level1"` |
| Referencias | Opcional ("Entre calles, color de fachada…") |

- **Etiquetas siempre visibles** encima del campo (nunca solo placeholder).
- **Autocompletado del navegador** en todos los campos: en móvil llena la dirección con un toque.
- **Validación al salir del campo** (no mientras escribe) y otra vez al enviar. Mensajes junto al campo, en lenguaje claro ("Escribe un código postal de 5 dígitos"), y el foco va al primer error.
- **Campos de 48px** de alto y fuente de 16px (evita el zoom de iOS).
- **Opcionales marcados como "(opcional)"**, no los obligatorios con asterisco.

### Pago

- Se muestran solo los métodos **habilitados en el panel** (`PaymentMethod.isEnabled`).
- Hoy: **transferencia o depósito**. Tarjeta (Stripe / Mercado Pago / Conekta) queda lista para activarse cuando haya llaves de la pasarela; no se muestra mientras esté deshabilitada.
- Cada método muestra en una línea qué pasa después ("Recibirás los datos bancarios…").
- Logos de tarjetas y "Pago seguro" junto al botón cuando haya pasarela.

### Botón "Realizar pedido"

- Muestra el total: **"Realizar pedido · $5,960"**.
- Al enviar: se desactiva, muestra "Procesando…" y evita el doble envío.
- Texto legal pequeño debajo: "Al realizar tu pedido aceptas el aviso de privacidad y la política de devoluciones" (con enlaces).

### Del lado del servidor (nunca se confía en el navegador)

- Los precios y existencias se vuelven a leer de la base; el navegador solo manda `variantId` y cantidad.
- Se valida cada campo otra vez.
- El pedido y el descuento de existencias van en una **transacción**: si otra persona compró la última pieza un segundo antes, el pedido no se crea y se avisa qué producto ya no alcanza.
- El costo de envío se calcula en el servidor.

## Confirmación

```
✓ ¡Gracias, Ana! Recibimos tu pedido
  Pedido MT-000123 · 29 oct 2026
  Guarda este número; te contactaremos a ana@correo.com

  Siguiente paso: realiza tu transferencia
  [instrucciones del método de pago]

  Resumen del pedido · Envío a: Calle…
  [Seguir comprando]
```

- La URL usa un identificador imposible de adivinar (no el número consecutivo) para que nadie vea pedidos ajenos cambiando el número.
- El carrito se vacía al llegar a esta página.
- `noindex`.

## Estados y errores

| Situación | Comportamiento |
|---|---|
| Carrito vacío en checkout | Mensaje y botón al catálogo |
| Precio cambió | Aviso en el carrito y total actualizado antes de pagar |
| Producto agotado al enviar | El pedido no se crea; aviso con el producto y botón para volver al carrito |
| Error de red o del servidor | Mensaje arriba del botón; los datos capturados se conservan |
| Envío en curso | Botón deshabilitado con "Procesando…" |

## Pendiente con el cliente

- Monto de envío gratis y costo de envío estándar (hoy provisionales en `store-config.ts`).
- Datos bancarios e instrucciones de transferencia (se editan en `PaymentMethod.instructions`).
- Pasarela de tarjeta a usar y sus llaves.
- Correos transaccionales (confirmación de pedido): requieren un servicio de envío (Brevo, Resend, etc.).
- Facturación (RFC, razón social, uso de CFDI).

---

## Implementación (2026-10-29)

- Rutas: `src/app/(tienda)/carrito`, y el grupo `src/app/(checkout)` con su layout mínimo (`/checkout` y `/checkout/confirmacion/[id]`).
- Schema: `Order`, `OrderItem` y `PaymentMethod` (migración `pedidos-y-pagos`). El pedido copia datos del cliente, dirección, precios y nombre de producto.
- Validación del carrito: `POST /api/cart/validate` lee precios y existencias sin caché; `reconcileCart` (en `src/lib/cart-types.ts`) ajusta el carrito y genera los avisos.
- Pedido: Server Action `placeOrder` en `src/app/(checkout)/checkout/actions.ts`. Valida con las mismas reglas que el navegador (`src/lib/checkout-validation.ts`), relee precios, crea el pedido y descuenta existencias en una transacción con `updateMany` condicionado a `stock >= cantidad`. Incluye un campo trampa contra bots.
- El formulario envía la acción con `startTransition` desde `onSubmit` (no con `action=`): React reinicia los formularios al terminar una acción de formulario y, si el pedido fallaba, se perdían los datos (el `<select>` de estado volvía a la primera opción).
- Probado de punta a punta: pedido creado (MT-000001 y MT-000002 en la base de desarrollo), existencias descontadas, carrito vaciado, rechazo del servidor cuando se pide más de lo que hay y conservación de los datos tras el error.
- Se desactivó `calt` de la fuente Roobert en todo el sitio: convertía "(2)" en "②".
- Pendiente: correos transaccionales, pasarela de tarjeta, facturación, límite de intentos por IP, y búsqueda de pedidos para el panel.
