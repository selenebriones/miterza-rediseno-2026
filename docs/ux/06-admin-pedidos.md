# Panel de administración: acceso y pedidos

## Objetivo

Que quien atiende la tienda encuentre en segundos **qué pedidos requieren acción hoy** (pagos por confirmar, pedidos por preparar o enviar) y pueda avanzarlos sin errores: cada cambio de estado deja rastro y no se puede saltar pasos.

## Acceso y roles

- **Inicio de sesión con correo y contraseña** en `/admin/login` (Auth.js, sesión JWT de 8 horas). Más adelante se puede agregar Google para el equipo.
- **Solo usuarios `ADMIN` activos** entran al panel. Un `CUSTOMER` que intenta entrar ve "No tienes acceso al panel"; quien no tiene sesión va al login y, al entrar, regresa a la página que pidió.
- **Permisos por módulo** (`AdminPermission`): `MANAGE_ORDERS` para ver y actualizar pedidos. `SUPER_ADMIN` tiene todo. El menú solo muestra los módulos que la persona puede usar.
- **Tres capas de control:** el `proxy` redirige rápido a quien no tiene sesión; cada página verifica rol y permiso en el servidor; cada acción vuelve a verificar antes de escribir. El `proxy` por sí solo no es seguridad.
- Errores de login genéricos ("Correo o contraseña incorrectos") para no revelar qué correos existen.

## Layout del panel

```
DESKTOP                                         MÓVIL
┌──────────┬───────────────────────────────┐   ┌──────────────────────────┐
│ [logo]   │ Pedidos                 Ana ▾ │   │ ☰  Pedidos         Ana ▾ │
│ Panel    ├───────────────────────────────┤   ├──────────────────────────┤
│▸ Pedidos │                               │   │                          │
│  Productos (próx.)                       │   │                          │
│  Contenido (próx.)                       │   │                          │
│  Clientes  (próx.)                       │   │                          │
│ ──────── │                               │   │                          │
│ Ver tienda ↗                             │   │                          │
└──────────┴───────────────────────────────┘   └──────────────────────────┘
 barra lateral fija 240px, fondo brand          menú en hoja lateral
```

- Fondo gris muy claro en el contenido y tarjetas blancas: se distingue de la tienda y descansa la vista en jornadas largas.
- Los módulos que aún no existen se ven deshabilitados con "Próximamente" para que el equipo sepa qué viene.

## Listado de pedidos (`/admin/pedidos`)

```
Pedidos
[Todos 12] [Por pagar 3] [Pagados 2] [Preparando 1] [Enviados 4] [Entregados 1] [Cancelados 1]
[🔍 Número, correo o nombre…                ]
┌────────────┬──────────────────┬────────────┬────────────┬─────────┐
│ Pedido     │ Cliente          │ Fecha      │ Estado     │   Total │
│ MT-000012  │ Ana Prueba       │ 29 oct     │ ● Por pagar│  $3,960 │
│            │ ana@correo.com   │ 14:05      │            │ 2 piezas│
└────────────┴──────────────────┴────────────┴────────────┴─────────┘
            ‹ Anterior   Página 1 de 3   Siguiente ›
MÓVIL: cada pedido es una tarjeta (número + estado arriba, cliente, fecha y total abajo).
```

- **Pestañas por estado con conteo:** "Por pagar 3" dice qué atender sin abrir nada. Es el filtro más usado, por eso va primero y a un toque.
- **Búsqueda por número (con o sin "MT-"), correo o nombre.** Al pegar "MT-000012" se encuentra directo.
- **Orden: más recientes primero.** 20 por página.
- **Estado con color y texto** (nunca solo color): Por pagar (ámbar), Pagado (azul), Preparando (morado), Enviado (verde brand), Entregado (gris), Cancelado (rojo).
- **Toda la fila es clicable** y lleva al detalle.
- **Estado vacío** distinto si no hay pedidos o si la búsqueda no encontró nada (con "Limpiar búsqueda").
- Filtros y página viven en la URL: se puede compartir "los pedidos por pagar" con el equipo.

## Detalle del pedido (`/admin/pedidos/[id]`)

```
← Pedidos
MT-000012  ● Por pagar                         29 oct 2026, 14:05
┌───────────────────────────────────────┬─────────────────────────┐
│ Productos                             │ Actualizar estado       │
│ [img] Persiana Optima… x2   $3,960    │ Siguiente: [Pagado ▾]   │
│ Subtotal / Envío / Total              │ Paquetería* · Guía*     │  ← solo al marcar Enviado
│                                       │ Nota interna (opcional) │
│ Historial                             │ [ Guardar cambio ]      │
│ ● Pedido creado · 29 oct 14:05        ├─────────────────────────┤
│ ● Pagado · Ana (admin) · nota…        │ Cliente                 │
│                                       │ Ana Prueba · correo · tel│
│                                       │ Envío: dirección        │
│                                       │ Pago: Transferencia     │
└───────────────────────────────────────┴─────────────────────────┘
```

- **Solo se ofrecen los siguientes estados válidos.** Por pagar → Pagado o Cancelado; Pagado → Preparando o Cancelado; Preparando → Enviado o Cancelado; Enviado → Entregado. Entregado y Cancelado son finales. Así no se puede marcar "Entregado" un pedido sin pagar.
- **Al marcar "Enviado" se piden paquetería y número de guía**: es lo primero que preguntará el cliente.
- **Cancelar pide confirmación** y avisa que **las piezas regresan al inventario**. Es la única acción destructiva.
- **Historial** con quién hizo cada cambio, cuándo y la nota. Es el "seguimiento" del pedido y la memoria del equipo.
- **Datos del cliente con acciones directas:** correo (`mailto:`), teléfono (`tel:`) y WhatsApp.
- Tras guardar: aviso "Pedido actualizado a Pagado" y el historial se actualiza al instante.
- Si otra persona cambió el pedido mientras tanto, el cambio se rechaza con un mensaje ("Este pedido cambió a Pagado; recarga para ver su estado actual") en lugar de pisar su trabajo.

## Accesibilidad

- Tabla real (`<table>`) con encabezados en desktop; en móvil, lista de tarjetas.
- Pestañas como enlaces con `aria-current`; contadores incluidos en el texto.
- Formularios con etiquetas visibles y errores junto al campo.
- Foco visible en toda la navegación del panel.

---

## Implementación (2026-10-29)

- Auth.js v5 (`next-auth@5.0.0-beta.32`, versión fija) con credenciales y sesión JWT de 8 h: `src/auth.config.ts` (sin base de datos, lo usa el proxy) y `src/auth.ts` (proveedor de credenciales). Contraseñas con scrypt (`src/lib/password.ts`).
- `src/proxy.ts` redirige `/admin/*` al login si no hay sesión. La autorización real está en `src/lib/admin/session.ts`: `requirePermission()` en páginas y `authorize()` en acciones; ambas releen rol, permisos y estado del usuario en la base.
- Con Cache Components, todo lo que lee la sesión está dentro de `<Suspense>` (menú del panel y contenido de cada página).
- Schema: `OrderStatusChange` (historial con autor y nota) y `Order.shippingCarrier` / `trackingNumber` (migración `seguimiento-pedidos`, con relleno del historial de pedidos existentes). El checkout ahora registra "Pedido creado".
- Los formularios del panel usan acciones de servidor en `action=`: se envían por POST aunque JavaScript no haya cargado. Una primera versión con `onSubmit` hacía GET antes de hidratarse y ponía la contraseña en la URL; se corrigió y se cambió la contraseña de prueba.
- Los campos de "Enviado" y la confirmación de "Cancelar" se muestran con `:has()` según el radio marcado, también sin JavaScript.
- Probado: login correcto e incorrecto, regreso a la página pedida, acceso negado a `CUSTOMER` y a un admin sin `MANAGE_ORDERS`, búsqueda, avance de estados con nota, rechazo por cambio concurrente, guía obligatoria al enviar y devolución de piezas al inventario al cancelar.
- Pendiente: alta y edición de administradores desde el panel, restablecer contraseña, límite de intentos de login, exportar pedidos y notificaciones al cliente por correo.
