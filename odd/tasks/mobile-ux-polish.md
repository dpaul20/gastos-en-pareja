# mobile-ux-polish

Rediseño de la UX/UI de todas las pages y de cada flujo de inicio a fin, pensado para mobile, con criterio de diseño propio.
Rama: `feat/mobile-ux-polish` · Entrega: una sola rama, commits por etapa, un PR único.

## Specs

- S1. "viendo la interfaz principalmente en mobile me hace ver lo mal que estamos en cuanto a UX/UI, etc. Quiero que nos concentremos en la UX/UI de todas las pages y de cada flujo de inicio a fin."
- S2. "No quiero un diseño promedio sino que le des amor."
- S3. "No reduzcas el alcance simplemente para producir menos código." Ante una decisión de diseño no especificada: "no elijas automáticamente la solución más sencilla."
- S4. Libertad para añadir "sistemas secundarios, animaciones, detalles visuales, pequeñas interacciones, efectos, mensajes, elementos ambientales, mejoras, siempre que sean coherentes con el concepto y no impidan que el proyecto funcione correctamente."
- S5. "por favor siempre usa playwright para validar los diferente viewports." Y: "no uses el playwright headless porque no veo nada." (validar con `--headed`).
- S6. Proceso ODD (no SDD): specs verbatim, tareas trazables, una rama con commits por etapa y PR único.

Decisiones de diseño tomadas (S3/S4, no especificadas):

- D1. Capa de pulido compartida en `globals.css` (vidrio, ambiente, stagger, press, shimmer, confeti); todo movimiento tras `prefers-reduced-motion: no-preference`.
- D2. Navegación inferior como dock flotante de vidrio con píldora deslizante y háptica.
- D3. Un `PageHeader` y un `EmptyState` compartidos; ningún estado vacío queda en blanco o como texto plano.
- D4. No animar con count-up los importes: el texto final siempre está en el DOM (los tests lo leen al instante).
- D5. Se conservan test ids, aria-labels y textos que usan los e2e.
- D6. Tono cálido en voseo.

## Tasks

- [x] T1 · S2,D1,D2 · inline · capa de pulido en globals.css + dock flotante + padding del layout
- [x] T2 · S2,S4,D3 · inline · `PageHeader`, `EmptyState`, `Confetti`, `MonthHeader` con "Volver a hoy", FAB, skeleton shimmer
- [x] T3 · S1,S2 · inline · Inicio (saludo, progreso de servicios, CTA de ingresos, accesos rápidos, "-$" bien formateado), Gastos, Historial (estado vacío), Configuración (cabecera y carga), Login (aurora), 404
- [x] T4 · S1,D3 · inline · Invitación, `ErrorPanel`, `NoCoupleState`, `NoCoupleCard`, invitaciones pendientes
- [x] T5 · S1,S2,S4 · inline · hojas (`add-sheet`, `settle-sheet`, `load-bill-sheet`, selector de tipo) y listas (`cuota-item`, `fijo-item`, `variable-item`): entrada escalonada, feedback al tocar
- [x] T6 · S1,S2 · inline · Configuración a fondo (tarjeta de pareja, ingreso, cuenta), `MonthDetail`, widgets del dashboard, sidebar de escritorio
- [x] T7 · S2,S4 · inline · celebración al saldar: `Confetti` + `haptic("celebrate")`, todo con reduced-motion
- [x] T8 · S5 · inline · validar con Playwright `--headed` en Pixel 5 + iPhone SE/14/Pro Max, claro/oscuro; suite e2e completa; actualizar snapshots visuales si corresponde

## Log

- L1. Pedido original del usuario (verbatim): "viendo la interfaz principalmente en mobile me hace ver lo mal que estamos en cuanto a UX/UI, etc. Quiero que nos concentremos en la UX/UI de todas las pages y de cada flujo de inicio a fin. No quiero un diseño promedio sino que le des amor. No reduzcas el alcance simplemente para producir menos código. Utiliza tu criterio para escoger la solución que produzca algo más completo, convincente y pulido. Cuando exista una decisión de diseño que no esté especificada en el promt o doc, no elijas automáticamente la solución más sencilla. Tienes libertad para añadir: sistemas secundarios, animaciones, detalles visuales, pequeñas interacciones, efectos, mensajes, elementos ambientales, mejoras, siempre que sean coherentes con el concepto y no impidan que el proyecto funcione correctamente. Quiero evaluar tu capacidad para interpretar el concepto y completar por tu cuenta los detalles que no han sido especificados."
- L2. Usuario: "como que no sabes que es ODD en cada sesion te lo tengo que explicar?" — el proceso vive en `odd/tasks/`; leer `odd/tasks/*.md` al empezar cada sesión.
- L3. T1–T3 se hicieron antes de crear este archivo; se registran a posteriori y se commitean como etapas.

- Log: segunda pasada � banner de fijos, card de categor�as, sidebar desktop y botones de sheets (48px, pastilla, press). Login dev form se deja (solo NODE_ENV=development).
