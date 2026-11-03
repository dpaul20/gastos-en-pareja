# feedback-ux

Rediseño de la UX/UI de validación, notificación y manejo de errores de toda la app, con criterio de diseño propio.
Rama: `feat/feedback-ux` · Entrega: una sola rama, commits por etapa, un PR único.

## Specs

- S1. "me hace ver lo mal que estmaos en cuanto a validacion, notificacion, manejo de errores, UX/UI, etc. Quiero que nos concentremos en la UX/UI de todo eso."
- S2. "No quiero un diseño promedio sino que le des amor."
- S3. "No reduzcas el alcance simplemente para producir menos código." Ante una decisión de diseño no especificada: "no elijas automáticamente la solución más sencilla."
- S4. Libertad para añadir "sistemas secundarios, animaciones, detalles visuales, pequeñas interacciones, efectos, mensajes, elementos ambientales, mejoras, siempre que sean coherentes con el concepto y no impidan que el proyecto funcione correctamente."
- S5. "por favor siempre usa playwright para validar los diferente viewports." Y: "no uses el playwright headless porque no veo nada." (validar con `--headed`).
- S6. Alcance: "Todo en una sola rama con commits por etapa y un PR único".
- S7. Caso origen: "intente guardar un compra y no anda". En prod Next enmascara el mensaje de las Server Actions, así que el usuario no ve la causa; el error real queda en los logs de Vercel (`No se pudo guardar la compra`).

Decisiones de diseño tomadas por el parent (S3/S4, no especificadas):

- D1. Un solo canal de avisos (`notify`) y un solo clasificador (`describeError`) que traduce cualquier error a título + mensaje humano + código (digest) copiable + si admite reintento.
- D2. Toda mutación pasa por `useAction`: pending, invalidación, aviso de éxito, y en fallo aviso con "Reintentar" que repite la misma llamada.
- D3. Avisos arriba (`top-center`, con safe-area) para no tapar FAB ni bottom-nav; tokens del design system, dark mode, háptica en éxito/error.
- D4. Estado de conexión ambiental (pill "Sin conexión" / "Volviste a estar en línea") que revalida las queries al volver.
- D5. Formularios no pierden lo escrito si el guardado falla; foco y scroll al primer error; botón Guardar con estados.
- D6. Tono cálido en voseo; todo respeta `prefers-reduced-motion`.

## Tasks

- [x] T1 · S1,S7,D1 · inline+TDD · `describeError` + `UserFacingError` en `src/lib/utils/` con tests Vitest · commit `8f53829`
- [x] T2 · S2,D3,D4 · inline · `notify`, Toaster estilizado (tokens, top-center, safe-area), `ConnectionStatus`, CSS en globals.css
- [ ] T3 · S1,D2 · inline · `useAction` y migrar mutaciones silenciosas: cuota +1, override de cuota, toggle de fijo, ingresos, tarjetas, saldar, deshacer
- [ ] T4 · S7,D5 · inline · `useExpenseSave` + AddSheet: no cerrar antes de guardar, conservar datos al fallar, errores del servidor visibles y accionables
- [ ] T5 · S2,D5 · inline · validación en formularios: foco/scroll al primer error, mensajes con voz propia, botón Guardar con estados
- [ ] T6 · S2,S4 · inline · `error.tsx` / `global-error.tsx` con identidad, digest copiable, reintentar; estados vacíos y skeletons de carga
- [ ] T7 · S2,S4,D6 · inline · microinteracciones: check animado, háptica, celebración sutil al saldar; todo con reduced-motion
- [ ] T8 · S5 · inline · specs Playwright `--headed`: Pixel 5 + iPhone SE/14/Pro Max, claro/oscuro, offline simulado, error de servidor simulado; a11y

## Log

- L1. Pedido original del usuario (verbatim): "viendo esto me hace ver lo mal que estmaos en cuanto a validacion, notificacion, manejo de errores, UX/UI, etc. Quiero que nos concentremos en la UX/UI de todo eso. No quiero un diseño promedio sino que le des amor. No reduzcas el alcance simplemente para producir menos código. Utiliza tu criterio para escoger la solución que produzca algo más completo, convincente y pulido. Cuando exista una decisión de diseño que no esté especificada en el promt o doc, no elijas automáticamente la solución más sencilla. Tienes libertad para añadir: sistemas secundarios, animaciones, detalles visuales, pequeñas interacciones, efectos, mensajes, elementos ambientales, mejoras, siempre que sean coherentes con el concepto y no impidan que el proyecto funcione correctamente. Quiero evaluar tu capacidad para interpretar el concepto y completar por tu cuenta los detalles que no han sido especificados."
- L2. "por favor siempre usa playwright para validar los diferente viewports."
- L3. "NO, no usamos SDD gentle ai usa ODD"
- L4. "si, pero primero deshace lo que hiciste en el arbol, trabajemos limpios y sigamos el proceso de odd" (árbol revertido a `c3f66ee`, limpio).
- L5. Alcance elegido: "Todo en una sola rama con commits por etapa y un PR único"
