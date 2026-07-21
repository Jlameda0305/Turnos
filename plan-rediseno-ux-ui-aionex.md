# Plan de Rediseño UX/UI — Panel Administrativo AIONEX

**Rol:** Arquitecto UX/UI Senior — Auditoría de producto SaaS / Backoffice
**Alcance del material analizado:** 7 archivos HTML del panel de administración:
`index.html`, `dashboard.html`, `turnos.html`, `nuevo-turno.html`, `servicios.html`, `clientes.html`, `cliente-detalle.html`.

**Nota de alcance:** la navegación de todas las páginas referencia además una página `tipos-servicio.html`, que **no fue incluida** en el material provisto. Se la menciona en los hallazgos de navegación, pero no se audita su contenido interno porque no fue entregado.

---

## 1. Resumen Ejecutivo

AIONEX Admin es un panel de backoffice funcional para la gestión de un negocio de turnos/reservas (tipo clínica, consultorio o centro de servicios), con cinco módulos: Dashboard, Turnos, Clientes, Servicios y Tipos de Servicio, sobre una arquitectura simple (Supabase Auth + endpoints n8n vía `adminFetch`).

**Estado general:** la base es sólida y consistente en varios aspectos clave (estados de carga, estados vacíos, toasts, estructura de sidebar + header repetida, nomenclatura de endpoints). No es una aplicación desprolija; es una aplicación **funcional pero con oportunidades claras de madurez UX** típicas de un MVP que creció módulo por módulo sin una segunda pasada de consistencia.

**Principales hallazgos:**
- Inconsistencias de navegación (la página de detalle de cliente tiene un sidebar incompleto).
- Inconsistencias en el patrón de confirmación de borrado (modal propio vs. `confirm()` nativo del navegador, según la página).
- Ausencia de una vista de agenda/calendario en un producto cuyo núcleo de negocio es la gestión de turnos por horario.
- Flujos con más clics de los necesarios (editar un cliente, buscar un turno puntual, dar de alta un cliente nuevo durante la reserva).
- Buenas prácticas ya presentes que conviene preservar y generalizar (estados de carga/vacío, toasts, paginación con contador, badges de estado).

**Oportunidades de mejora:** consolidar patrones de interacción repetidos en componentes reutilizables, incorporar una vista de agenda, reducir la fricción del flujo de reserva y del flujo de edición de clientes, y cerrar los huecos de navegación y accesibilidad detectados.

---

## 2. Evaluación General

| Área | Estado Actual | Impacto | Prioridad |
|---|---|---|---|
| Navegación global (sidebar) | Consistente en 6 de 7 pantallas; rota en `cliente-detalle.html` | Alto | Alta |
| Arquitectura de información | Módulos claros y separados, sin agrupación jerárquica ni vista de agenda | Medio | Media |
| Consistencia de interacción (borrado, cambio de estado) | Dos patrones distintos conviven (modal propio vs. `confirm()` nativo) | Alto | Alta |
| Gestión de Turnos | Funcional, con filtros por estado, pero sin búsqueda ni vista temporal | Alto | Alta |
| Alta de Turno (wizard) | Buen flujo secuencial, pero sin ruta para cliente nuevo ni indicador de progreso | Alto | Alta |
| Gestión de Clientes | Búsqueda y paginación correctas; edición requiere navegación + doble clic | Medio | Media |
| Detalle de Cliente | Buen patrón de edición inline, pero con nav incompleta y campos sin explicar | Medio | Media |
| Gestión de Servicios | CRUD simple y claro; catálogo pequeño, sin filtros (aceptable hoy) | Bajo | Baja |
| Feedback del sistema (loading/empty/toast) | Consistente y bien resuelto en todas las páginas | — (Fortaleza) | Mantener |
| Responsive Design | Un solo breakpoint explícito (`nuevo-turno.html`); tablas densas sin patrón mobile confirmado | Medio | Media |
| Accesibilidad | Buen uso de `aria-live`, labels asociados; foco/teclado en modales no verificable con el material provisto | Medio | Media |

---

## 3. Arquitectura Actual

**Navegación principal (sidebar):** Dashboard → Turnos → Clientes → Servicios → Tipos de Servicio → Cerrar Sesión. Presente de forma idéntica en `dashboard.html`, `turnos.html`, `nuevo-turno.html`, `servicios.html` y `clientes.html`. En `cliente-detalle.html` el mismo componente aparece recortado a solo tres enlaces (Dashboard, Turnos, Clientes).

**Módulos y flujos principales:**
- **Autenticación** (`index.html`): login con Supabase Auth, redirección automática a `dashboard.html` si ya existe sesión.
- **Dashboard** (`dashboard.html`): métricas agregadas (clientes totales, turnos de hoy, turnos activos futuros, cancelaciones del mes) + listado de turnos del día con cambio de estado inline.
- **Turnos** (`turnos.html` + `nuevo-turno.html`): listado paginado con tabs por estado, modal de detalle/observaciones, alta de turno en página separada con flujo de 4 pasos (cliente → servicio → fecha → horario).
- **Clientes** (`clientes.html` + `cliente-detalle.html`): listado paginado con búsqueda, modal de confirmación de borrado en cascada, y una página de detalle con edición inline de datos + historial de turnos del cliente.
- **Servicios** (`servicios.html`): CRUD simple sobre catálogo de servicios, dependiente de Tipos de Servicio para el selector.

**Dependencias técnicas observadas:** Supabase (`supabaseClient`, sesión de admin), y una capa de endpoints n8n consumida mediante `adminFetch` bajo el prefijo `ADMIN_N8N_PREFIX` (`/dashboard`, `/turnos-v2`, `/turno-estado`, `/turno-editar`, `/turno-eliminar`, `/turno-crear-v2`, `/clientes`, `/cliente-detalle`, `/cliente-eliminar`, `/clientes/{id}`, `/servicios`, `/servicio-crear`, `/servicio-editar`, `/servicio-eliminar`, `/tipos-servicio`, `/buscar-cliente`), más dos endpoints públicos sin sesión de admin (`/servicios-activos`, `/turnos-disponibles-v2`).

---

## 4. Hallazgos de Auditoría

### Hallazgo #1
**Página/Módulo:** `index.html` (Login)
**Problema Detectado:** No existe una opción de recuperación de contraseña visible en el formulario de ingreso.
**Impacto UX:** Si el administrador olvida su contraseña, no tiene ninguna salida dentro de la interfaz; depende de un canal externo (soporte, base de datos) para recuperar acceso.
**Nivel de Severidad:** Medio
**Patrón SaaS Recomendado:** Enlace "¿Olvidaste tu contraseña?" que dispare el flujo de recuperación estándar de Supabase Auth.
**Propuesta de Solución:** Agregar un enlace de texto debajo del formulario que dispare `resetPasswordForEmail` (ya disponible en el SDK de Supabase que el proyecto ya usa).
**Justificación UX:** Es una expectativa estándar en cualquier pantalla de login; su ausencia es un callejón sin salida para el usuario.
**Riesgo Técnico:** Bajo. Usa una capacidad ya provista por el SDK de Supabase que el proyecto ya integra.
**Compatibilidad con lógica actual:** Requiere validación (confirmar que el flujo de recuperación de contraseña esté habilitado en el proyecto de Supabase).

### Hallazgo #2
**Página/Módulo:** `index.html` vs. `dashboard.html`
**Problema Detectado:** El login se titula "Ingreso Dueño" mientras que el resto del panel usa consistentemente "Administrador" (badge "ADMIN", user-pill "Administrador").
**Impacto UX:** Pequeña disonancia de marca/tono que puede generar dudas sobre si "Dueño" y "Administrador" son el mismo rol o roles distintos.
**Nivel de Severidad:** Bajo
**Patrón SaaS Recomendado:** Nomenclatura de rol única y consistente en toda la aplicación.
**Propuesta de Solución:** Unificar el texto a "Administrador" (o a la denominación de negocio que se prefiera) en ambos lugares.
**Justificación UX:** La consistencia terminológica reduce carga cognitiva, aunque el impacto real es menor.
**Riesgo Técnico:** Ninguno (cambio de copy).
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #3
**Página/Módulo:** `dashboard.html`
**Problema Detectado:** Las tarjetas de métricas (Clientes Totales, Turnos de Hoy, etc.) son puramente informativas; no llevan al listado correspondiente al hacer clic.
**Impacto UX:** El dashboard actúa como un mural aislado en lugar de un punto de entrada operativo; el administrador debe volver a navegar manualmente al módulo relacionado.
**Nivel de Severidad:** Medio
**Patrón SaaS Recomendado:** Métricas "clicables" que funcionan como atajos de navegación (patrón común en Stripe, Linear, HubSpot).
**Propuesta de Solución:** Convertir cada `metric-card` en un enlace hacia su módulo (p. ej. "Clientes Totales" → `clientes.html`, "Turnos de Hoy" → `turnos.html` con el filtro de hoy aplicado si la API lo permite).
**Justificación UX:** Reduce clics y refuerza el dashboard como centro de mando, no solo de lectura.
**Riesgo Técnico:** Bajo. Es un cambio de marcado (envolver la tarjeta en un `<a>` o agregar `onclick`), sin tocar los endpoints de métricas.
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #4
**Página/Módulo:** `dashboard.html` y `turnos.html` (patrón transversal)
**Problema Detectado:** El estado de un turno se cambia mediante un `<select>` nativo cuyo único indicador visual es el color del borde; no reutiliza el componente de badge (`turno-badge`) que sí existe y se usa en `servicios.html` para "Activo/Inactivo".
**Impacto UX:** El estado es menos escaneable de un vistazo (hay que leer el texto dentro del select) y el mismo concepto —"estado de una entidad"— se representa con dos lenguajes visuales distintos según la página.
**Nivel de Severidad:** Medio
**Patrón SaaS Recomendado:** Badge de estado + acción de cambio de estado separada (menú desplegable o ícono), en vez de un select que hace ambas cosas a la vez.
**Propuesta de Solución:** Mostrar el estado como badge de color (reutilizando la clase ya existente) y, junto a él, un control explícito para cambiarlo (ej. un ícono de menú "⋮" que despliegue las opciones), manteniendo la misma llamada a `cambiarEstado()`.
**Justificación UX:** Separar "mostrar información" de "ofrecer una acción" mejora la escaneabilidad de la tabla y unifica el lenguaje visual de estados en toda la app.
**Riesgo Técnico:** Bajo-Medio. Es un cambio de estructura de UI sobre el mismo dato y el mismo endpoint (`/turno-estado`), no de lógica de negocio.
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #5
**Página/Módulo:** `dashboard.html`
**Problema Detectado:** El panel "Turnos de Hoy" no tiene forma de refrescarse salvo recargando toda la página; tampoco indica cuándo fue la última actualización.
**Impacto UX:** En un negocio donde los turnos pueden crearse o cancelarse durante el día, el administrador puede estar viendo información desactualizada sin saberlo.
**Nivel de Severidad:** Medio
**Patrón SaaS Recomendado:** Botón de refresco manual + timestamp de "última actualización" (patrón común en dashboards operativos).
**Propuesta de Solución:** Agregar un botón "Actualizar" junto al título del panel y un texto pequeño con la hora de la última carga.
**Justificación UX:** Da control y confianza al administrador sobre la vigencia de los datos que está mirando.
**Riesgo Técnico:** Bajo. Reutiliza la función `cargarTurnosDeHoy()` ya existente.
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #6
**Página/Módulo:** `turnos.html`
**Problema Detectado:** El listado de turnos solo permite filtrar por estado (tabs); no hay búsqueda por nombre/DNI de cliente ni por rango de fechas, a diferencia de `clientes.html`, que sí tiene búsqueda.
**Impacto UX:** Para encontrar el turno de un cliente puntual, el administrador debe recorrer páginas de a 10 registros dentro de la pestaña correspondiente, lo cual es lento en una agenda con volumen medio o alto.
**Nivel de Severidad:** Alto
**Patrón SaaS Recomendado:** Barra de búsqueda + selector de rango de fechas combinados con los filtros de estado existentes (patrón estándar en cualquier tabla de gestión SaaS).
**Propuesta de Solución:** Agregar un campo de búsqueda (nombre/DNI) y un selector de fecha/rango de fecha en la barra de herramientas de `turnos.html`, análogo al que ya existe en `clientes.html`.
**Justificación UX:** Es la brecha de usabilidad más directa para la tarea más frecuente de este módulo: encontrar un turno específico.
**Riesgo Técnico:** Medio. Si el endpoint `/turnos-v2` no soporta parámetros de búsqueda/fecha además de `estado`, se necesitaría extender la query del backend.
**Compatibilidad con lógica actual:** Requiere validación (confirmar si `/turnos-v2` admite parámetros adicionales de fecha/búsqueda; si no los admite, sería un cambio funcional de backend).

### Hallazgo #7
**Página/Módulo:** `turnos.html`
**Problema Detectado:** No existe ninguna vista de calendario/agenda; toda la gestión de turnos se hace sobre una tabla plana paginada.
**Impacto UX:** En un producto cuyo objeto central es "turnos por fecha y horario", la ausencia de una vista temporal (día/semana) obliga al administrador a reconstruir mentalmente la ocupación de la agenda a partir de filas de tabla.
**Nivel de Severidad:** Alto
**Patrón SaaS Recomendado:** Vista de agenda tipo calendario (día/semana), como en Calendly, Fresha o Square Appointments, complementando —no reemplazando— la vista de tabla para tareas administrativas puntuales.
**Propuesta de Solución:** Incorporar una vista "Agenda" que consuma el mismo endpoint `/turnos-v2` filtrado por fecha, mostrando los turnos en franjas horarias. Ver detalle en la sección 7 (Páginas Nuevas Propuestas).
**Justificación UX:** Es el patrón central de cualquier producto de reservas; su ausencia es la brecha de arquitectura de información más significativa detectada.
**Riesgo Técnico:** Medio. Es una nueva superficie visual sobre datos ya existentes; no requiere nuevas escrituras, solo lectura por rango de fecha.
**Compatibilidad con lógica actual:** Requiere validación (confirmar que `/turnos-v2` pueda filtrarse por rango de fechas, o si haría falta un parámetro adicional).

### Hallazgo #8
**Página/Módulo:** `turnos.html` (modal de detalle)
**Problema Detectado:** El ícono de acción es "✏️" (lápiz, comúnmente asociado a "editar todo"), pero el modal que abre solo permite editar el campo "Observaciones"; fecha, hora, servicio y cliente son de solo lectura.
**Impacto UX:** Desalinea la expectativa que genera el ícono con la capacidad real del modal, lo que puede llevar a que el administrador busque (sin encontrar) una forma de reprogramar el turno desde ahí.
**Nivel de Severidad:** Medio-Alto
**Patrón SaaS Recomendado:** El ícono/label de una acción debe anticipar exactamente lo que hace (principio de "signifiers" de Norman).
**Propuesta de Solución:** Renombrar la acción a algo más preciso ("👁️ Ver / Notas") o, si el negocio lo permite, ampliar el modal para permitir reprogramar fecha/hora/servicio reutilizando el mismo endpoint `turno-editar` (que ya acepta PATCH).
**Justificación UX:** Cerrar la brecha entre affordance visual y capacidad real evita frustración y tickets de soporte ("no puedo cambiar el horario del turno").
**Riesgo Técnico:** Bajo si solo se cambia el ícono/label; Medio-Alto si se decide ampliar el alcance funcional del modal (reprogramación).
**Compatibilidad con lógica actual:** El cambio de ícono/label es compatible; ampliar la edición a fecha/hora/servicio requiere cambios funcionales (validar disponibilidad de horario, reglas de negocio de reprogramación).

### Hallazgo #9
**Página/Módulo:** Transversal — `clientes.html` vs. `turnos.html` y `servicios.html`
**Problema Detectado:** El borrado de un cliente usa un modal propio con advertencia clara sobre el borrado en cascada de turnos; en cambio, el borrado de un turno (`turnos.html`) y de un servicio (`servicios.html`) usa el `confirm()` nativo del navegador.
**Impacto UX:** Dos lenguajes de confirmación distintos conviven en la misma aplicación. El `confirm()` nativo es menos confiable visualmente (se puede confundir con un mensaje del navegador, no de la app) y no permite comunicar matices como "esta acción no se puede deshacer" con el mismo nivel de detalle que el modal propio.
**Nivel de Severidad:** Alto
**Patrón SaaS Recomendado:** Un único componente de "modal de confirmación destructiva" reutilizado en toda la aplicación, con texto contextual según la entidad a borrar.
**Propuesta de Solución:** Reemplazar los `confirm()` de `turnos.html` y `servicios.html` por el mismo patrón de modal ya construido en `clientes.html`, parametrizando el mensaje.
**Justificación UX:** Consistencia de interacción = confianza. Las acciones destructivas son justamente donde más importa que el usuario reconozca el patrón.
**Riesgo Técnico:** Bajo. Es una reutilización de un componente de UI ya existente en el mismo proyecto; la llamada al endpoint de borrado no cambia.
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #10
**Página/Módulo:** `nuevo-turno.html`
**Problema Detectado:** El buscador de clientes (paso 1) no ofrece ninguna alternativa cuando el cliente no existe en el sistema; no hay un "+ Nuevo Cliente" visible en ninguno de los 7 archivos analizados.
**Impacto UX:** Si un administrador necesita reservar un turno para un cliente que aún no está registrado, no tiene una ruta clara dentro de este flujo; probablemente deba abandonar la reserva, buscar (o no encontrar) una pantalla de alta de cliente en otro lugar, y volver.
**Nivel de Severidad:** Alto
**Patrón SaaS Recomendado:** Opción "Crear cliente nuevo" dentro del mismo buscador (patrón "create on the fly", común en CRMs y sistemas de reservas), sin abandonar el flujo de alta de turno.
**Propuesta de Solución:** Si no existe una pantalla de alta de cliente en el sistema, incorporar un modal liviano de "Nuevo Cliente" accesible desde el resultado vacío del buscador ("No se encontraron clientes — + Crear nuevo"), que al guardar seleccione automáticamente al cliente recién creado y continúe el flujo.
**Justificación UX:** Evita interrumpir la tarea principal (agendar un turno) y reduce el riesgo de que el administrador cree el turno "a mano" por fuera del sistema si no encuentra cómo dar de alta al cliente.
**Riesgo Técnico:** Medio. Depende de si ya existe un endpoint de alta de cliente reutilizable por el admin (no visible en el material provisto).
**Compatibilidad con lógica actual:** Requiere validación — es posible que el alta de clientes sea intencionalmente exclusiva de un flujo público de auto-registro; antes de construir esto hay que confirmar la regla de negocio con el equipo.

### Hallazgo #11
**Página/Módulo:** `nuevo-turno.html`
**Problema Detectado:** El flujo tiene 4 pasos numerados (Cliente, Servicio, Fecha, Horario) pero todos se muestran simultáneamente sin ningún indicador de avance/progreso ni de qué pasos ya están completos.
**Impacto UX:** El usuario debe inferir visualmente su progreso; los números de paso ("1.", "2.", "3.", "4.") ayudan, pero no hay una señal de "completado" más allá de la tarjeta de cliente seleccionado.
**Nivel de Severidad:** Bajo-Medio
**Patrón SaaS Recomendado:** Indicador de progreso tipo stepper (checkmarks en los pasos completados).
**Propuesta de Solución:** Agregar un ícono de check junto al título de cada paso una vez resuelto (cliente elegido, servicio elegido, fecha elegida), sin cambiar la lógica de habilitación ya existente.
**Justificación UX:** Refuerza la sensación de avance y ayuda a detectar rápidamente qué falta completar.
**Riesgo Técnico:** Bajo. Cambio puramente visual sobre estado ya existente en el JS (`selectedClientId`, `selectedServiceId`, etc.).
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #12
**Página/Módulo:** `servicios.html`
**Problema Detectado:** El campo "Activo" está oculto al crear un servicio nuevo (siempre se crea activo) y solo aparece al editar, sin ninguna nota que explique esta regla.
**Impacto UX:** Un administrador que edita un servicio ve un campo que "aparece de la nada" respecto al formulario de creación, lo cual puede generar confusión leve sobre por qué no estaba antes.
**Nivel de Severidad:** Bajo
**Patrón SaaS Recomendado:** Comunicar reglas de negocio implícitas con microcopy en vez de solo ocultar campos.
**Propuesta de Solución:** Agregar un texto de ayuda breve en el formulario de creación (ej. "Los servicios se crean activos por defecto; podrás desactivarlos luego desde Editar").
**Justificación UX:** Hace explícita una regla que hoy es implícita, sin cambiar el comportamiento.
**Riesgo Técnico:** Ninguno.
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #13
**Página/Módulo:** `servicios.html`
**Problema Detectado:** El catálogo de servicios no tiene búsqueda ni filtro (a diferencia de Clientes y, potencialmente, Turnos tras el Hallazgo #6).
**Impacto UX:** Bajo impacto si el catálogo es chico (probable en este tipo de negocio), pero se vuelve un problema si el catálogo crece.
**Nivel de Severidad:** Bajo
**Patrón SaaS Recomendado:** Búsqueda simple por nombre, agregable de forma incremental.
**Propuesta de Solución:** Dejar preparado (no necesariamente implementar ya) un campo de búsqueda análogo al de `clientes.html` si el catálogo supera ~20-30 ítems.
**Justificación UX:** Prioridad baja hoy, pero conviene dejarlo documentado como deuda de escalabilidad.
**Riesgo Técnico:** Bajo.
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #14
**Página/Módulo:** `clientes.html` → `cliente-detalle.html`
**Problema Detectado:** Para editar los datos de un cliente hacen falta como mínimo 3 pasos: (1) clic en "👁️ Ver detalle" desde el listado, (2) esperar la carga de la página de detalle, (3) clic en "Editar Datos" para recién habilitar los campos.
**Impacto UX:** Es una tarea frecuente (mantener datos de contacto al día) con más fricción de la necesaria; no existe edición rápida desde el listado.
**Nivel de Severidad:** Medio
**Patrón SaaS Recomendado:** Reducción de clics para tareas de alta frecuencia (uno de los objetivos explícitos de cualquier rediseño de productividad).
**Propuesta de Solución:** Que el ícono "✏️ Editar" en el listado de `clientes.html` navegue directamente a `cliente-detalle.html?id=X&edit=true`, y que la página de detalle, al detectar ese parámetro, abra directamente en modo edición (reutilizando `toggleEdit()`).
**Justificación UX:** Ahorra un clic en la tarea más común sobre un cliente ya existente, sin tocar el endpoint de actualización.
**Riesgo Técnico:** Bajo. Es lectura de un query param adicional en el frontend.
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #15
**Página/Módulo:** `clientes.html`
**Problema Detectado:** La paginación solo ofrece "Anterior/Siguiente"; no hay acceso directo a una página específica cuando el total de registros es alto.
**Impacto UX:** Bajo-medio: para llegar al registro 150 de una lista de 300, el administrador debe hacer 15 clics en "Siguiente" si no usa la búsqueda.
**Nivel de Severidad:** Bajo
**Patrón SaaS Recomendado:** Paginación con números de página o salto directo, complementaria a la búsqueda (que ya existe y mitiga bastante este problema).
**Propuesta de Solución:** Agregar números de página clicables junto a los botones existentes cuando el total supere cierto umbral.
**Justificación UX:** Mejora marginal, dado que la búsqueda ya cubre el caso de uso principal.
**Riesgo Técnico:** Bajo.
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #16
**Página/Módulo:** `cliente-detalle.html`
**Problema Detectado:** El sidebar de navegación de esta página incluye solo Dashboard, Turnos y Clientes; le faltan los enlaces a Servicios y a Tipos de Servicio que sí están presentes en las otras 5 páginas.
**Impacto UX:** Rompe el patrón de navegación global sin ningún motivo funcional aparente; un administrador que llega al detalle de un cliente pierde temporalmente acceso directo a 2 de los 5 módulos y debe retroceder a Clientes para recuperarlos.
**Nivel de Severidad:** Alto
**Patrón SaaS Recomendado:** El componente de navegación global debe ser idéntico en todas las pantallas internas de la aplicación (shell de navegación persistente).
**Propuesta de Solución:** Completar el sidebar de `cliente-detalle.html` con los mismos 5 enlaces presentes en el resto del panel.
**Justificación UX:** Es, con alta probabilidad, un descuido de implementación más que una decisión de diseño; corregirlo es de bajo esfuerzo y alto impacto en consistencia.
**Riesgo Técnico:** Ninguno. Es agregar los mismos `<a>` ya usados en las demás páginas.
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #17
**Página/Módulo:** `cliente-detalle.html`
**Problema Detectado:** Los campos DNI y Email permanecen deshabilitados incluso en modo edición (por diseño, según comentario del código: "por seguridad simple"), pero la interfaz no comunica visualmente que esto es intencional.
**Impacto UX:** El administrador puede interpretar que es un error o una limitación técnica, en vez de una regla de negocio deliberada.
**Nivel de Severidad:** Bajo-Medio
**Patrón SaaS Recomendado:** Comunicar campos bloqueados con un ícono de candado y/o texto de ayuda ("Este campo no se puede modificar").
**Propuesta de Solución:** Agregar un pequeño ícono o texto junto a DNI y Email explicando por qué permanecen fijos incluso en modo edición.
**Justificación UX:** Convierte una restricción silenciosa en una decisión de diseño explícita y comprensible.
**Riesgo Técnico:** Ninguno.
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #18
**Página/Módulo:** `cliente-detalle.html`
**Problema Detectado:** La sección "Últimos Turnos (Historial)" no indica cuántos turnos se están mostrando, no tiene paginación, y no ofrece un enlace para ver el historial completo de ese cliente en el módulo de Turnos.
**Impacto UX:** Si el cliente tiene muchos turnos históricos, el administrador no sabe si está viendo "todos" o solo "los últimos N", ni tiene forma de profundizar.
**Nivel de Severidad:** Medio
**Patrón SaaS Recomendado:** Vista resumida con enlace explícito a la vista completa filtrada ("Ver todos los turnos de este cliente →").
**Propuesta de Solución:** Agregar un enlace desde esta sección hacia `turnos.html` con un filtro por cliente aplicado (esto depende de que `turnos.html` incorpore búsqueda/filtro por cliente, ver Hallazgo #6).
**Justificación UX:** Conecta dos módulos que hoy están aislados entre sí, evitando que el administrador tenga que "buscar a mano" en Turnos.
**Riesgo Técnico:** Medio. Depende de la resolución del Hallazgo #6 (filtro por cliente en Turnos).
**Compatibilidad con lógica actual:** Requiere validación (depende de que el endpoint de turnos soporte filtrar por `id_cliente`).

### Hallazgo #19
**Página/Módulo:** Transversal (toda la aplicación)
**Problema Detectado:** No existe un buscador global (tipo "Cmd+K") que permita saltar directamente a un cliente, turno o servicio desde cualquier pantalla.
**Impacto UX:** Bajo hoy, dado el tamaño aparente del producto; se vuelve más valioso a medida que crece el volumen de datos.
**Nivel de Severidad:** Bajo
**Patrón SaaS Recomendado:** Command palette / búsqueda global, común en productos SaaS maduros (Linear, Notion, Superhuman).
**Propuesta de Solución:** Documentar como mejora de largo plazo, no prioritaria para las primeras fases del roadmap.
**Justificación UX:** No es una carencia crítica hoy, pero conviene dejarla planteada como visión de producto.
**Riesgo Técnico:** Alto si se implementa a fondo (requeriría un endpoint de búsqueda unificada).
**Compatibilidad con lógica actual:** Requiere cambios funcionales (nuevo endpoint de búsqueda cross-entidad).

### Hallazgo #20
**Página/Módulo:** Transversal (toda la aplicación)
**Problema Detectado:** No existe ninguna pantalla de perfil o configuración del administrador (cambio de contraseña, preferencias, notificaciones); la única acción disponible sobre la cuenta es "Cerrar Sesión".
**Impacto UX:** Bajo en el uso diario, pero limita la autonomía del administrador para tareas de mantenimiento de su propia cuenta.
**Nivel de Severidad:** Bajo
**Patrón SaaS Recomendado:** Página de "Mi cuenta" o "Configuración", estándar en cualquier backoffice.
**Propuesta de Solución:** Evaluar para una fase posterior del roadmap, fuera del alcance inmediato.
**Justificación UX:** Mejora de completitud de producto, no un problema urgente.
**Riesgo Técnico:** Bajo, pero implica funcionalidad nueva (cambio de contraseña vía Supabase Auth).
**Compatibilidad con lógica actual:** Requiere cambios funcionales menores (usar capacidades ya existentes de Supabase Auth).

### Hallazgo #21
**Página/Módulo:** Transversal — `turnos.html` y `clientes.html` en particular
**Problema Detectado:** Las tablas de Turnos (6 columnas) y Clientes (6 columnas) son densas; no hay evidencia en el material provisto (los archivos CSS no fueron incluidos) de un patrón de colapso a tarjetas o de priorización de columnas en pantallas angostas.
**Impacto UX:** Las tablas anchas suelen requerir scroll horizontal en mobile, lo cual es un patrón conocido de fricción.
**Nivel de Severidad:** Medio (marcado como "requiere validación" porque el CSS no fue provisto)
**Patrón SaaS Recomendado:** En mobile, transformar filas de tabla en tarjetas apiladas que muestren la información jerarquizada (dato principal + datos secundarios colapsables).
**Propuesta de Solución:** Definir, a nivel de arquitectura de información (sin tocar CSS en esta etapa), qué 2-3 datos por fila son "críticos" y cuáles son "secundarios", para que una futura implementación responsive los priorice correctamente.
**Justificación UX:** Anticipa el trabajo de responsive sin comprometerse a una solución visual en esta etapa.
**Riesgo Técnico:** Bajo (es un ejercicio de priorización de información, no de estilos).
**Compatibilidad con lógica actual:** Compatible.

### Hallazgo #22
**Página/Módulo:** Transversal — todos los modales (`servicios.html`, `clientes.html`, `turnos.html`)
**Problema Detectado:** No es posible confirmar, con el material provisto (los archivos `utils.js` y `admin-utils.js` no fueron incluidos), si los modales manejan foco de teclado (focus trap) o cierre con tecla `Esc`.
**Impacto UX:** Si no lo hacen, es una brecha de accesibilidad para usuarios que navegan con teclado.
**Nivel de Severidad:** Medio (requiere validación)
**Patrón SaaS Recomendado:** Todo modal debe atrapar el foco mientras está abierto y cerrarse con `Esc`.
**Propuesta de Solución:** Auditar `utils.js`/`admin-utils.js` (no provistos en este análisis) y, si falta, agregar manejo de foco y tecla `Esc` de forma centralizada.
**Justificación UX:** Accesibilidad básica de teclado, esperable en cualquier producto profesional.
**Riesgo Técnico:** Bajo.
**Compatibilidad con lógica actual:** Compatible (es una mejora de comportamiento de UI, no de lógica de negocio).

---

## 5. Propuesta de Nueva Arquitectura de Información

### Navegación Actual
Cinco enlaces planos sin agrupación: Dashboard, Turnos, Clientes, Servicios, Tipos de Servicio, más Cerrar Sesión — aplicados de forma inconsistente (rotos en `cliente-detalle.html`, ver Hallazgo #16).

### Navegación Propuesta
Mantener los mismos cinco módulos (no se elimina ni renombra ninguno) pero:
1. **Corregir la inconsistencia** en `cliente-detalle.html` para que el sidebar sea idéntico en las 7 pantallas.
2. **Agrupar visualmente** (sin cambiar rutas ni lógica) en dos bloques dentro del mismo sidebar:
   - *Operación diaria*: Dashboard, Agenda (nueva, ver sección 7), Turnos.
   - *Catálogo y datos*: Clientes, Servicios, Tipos de Servicio.
3. **Agregar "Agenda"** como sexto punto de navegación (sección 7).

### Beneficios
- Restaura la confianza en que "el menú siempre es el mismo, en todas partes".
- La agrupación reduce la carga cognitiva de escanear cinco enlaces sueltos, sin agregar profundidad de navegación (siguen siendo accesibles en un clic).
- La nueva entrada "Agenda" hace explícito, desde el propio menú, que la aplicación tiene una forma temporal de ver la operación y no solo tabular.

---

## 6. Rediseño Página por Página

| Página Actual | Problema | Rediseño Propuesto | Justificación UX | Impacto Esperado | Prioridad |
|---|---|---|---|---|---|
| `index.html` | Sin recuperación de contraseña | Agregar enlace "¿Olvidaste tu contraseña?" | Elimina un callejón sin salida | Medio | Media |
| `dashboard.html` | Métricas no interactivas, sin refresco, estado poco escaneable | Métricas clicables + botón de refresco + badges de estado en vez de bordes de color | Convierte el dashboard en un centro de acción, no solo de lectura | Alto | Alta |
| `turnos.html` | Sin búsqueda ni vista temporal; affordance de edición engañosa; borrado con `confirm()` nativo | Agregar búsqueda por cliente/fecha, enlazar con nueva vista Agenda, corregir ícono/alcance del modal, unificar modal de borrado | Ataca la brecha más grande del módulo central del producto | Alto | Alta |
| `nuevo-turno.html` | Sin ruta para cliente nuevo; sin indicador de progreso | Agregar creación de cliente "al vuelo" (sujeto a validación de negocio) + stepper de progreso | Reduce abandono e interrupción del flujo de reserva | Alto | Alta |
| `servicios.html` | Borrado con `confirm()` nativo; regla de "activo por defecto" no explicada | Unificar modal de confirmación; agregar microcopy explicativo | Consistencia y transparencia de reglas de negocio | Bajo-Medio | Media |
| `clientes.html` | Edición requiere navegación + doble clic; paginación limitada | Ícono de editar navega directo a modo edición; agregar números de página | Reduce clics en la tarea más frecuente sobre un cliente | Medio | Media |
| `cliente-detalle.html` | Sidebar incompleto; campos bloqueados sin explicar; historial sin enlace ni paginación | Completar sidebar; agregar indicaciones sobre campos bloqueados; enlazar historial con Turnos filtrado | Restaura consistencia de navegación y cierra brechas de claridad | Alto | Alta |

---

## 7. Páginas Nuevas Propuestas

| Nueva Página | Objetivo | Beneficio | Prioridad |
|---|---|---|---|
| **Agenda** (vista calendario día/semana) | Complementar la tabla de `turnos.html` con una vista temporal de la ocupación de horarios | Alinea la interfaz con el núcleo real del negocio (turnos por horario); reduce el esfuerzo mental de "traducir" filas de tabla a disponibilidad horaria | Alta |
| **Alta rápida de Cliente** (modal, no necesariamente página completa) | Permitir crear un cliente sin abandonar el flujo de `nuevo-turno.html` | Cierra el Hallazgo #10; evita reservas hechas "por fuera del sistema" | Alta (sujeta a validación de si ya existe un flujo equivalente) |
| **Mi Cuenta / Configuración** | Permitir al administrador cambiar su propia contraseña y preferencias básicas | Autonomía del administrador sobre su cuenta, sin depender de soporte | Baja |

---

## 8. Páginas a Fusionar

| Página A | Página B | Justificación |
|---|---|---|
| `turnos.html` | `nuevo-turno.html` | En lugar de una navegación de página completa, presentar el alta de turno como un panel lateral (slide-over) o modal grande lanzado desde el botón "+ Nuevo Turno" de `turnos.html`, manteniendo la URL `nuevo-turno.html` disponible para acceso directo/deep-link. Esto reduce la sensación de "salir" del módulo de Turnos para crear uno nuevo, sin eliminar ninguna pantalla ni cambiar el flujo interno de 4 pasos ya validado. |

No se identifican otros pares de páginas cuya fusión total sea recomendable: Dashboard, Clientes, Servicios y Tipos de Servicio cumplen objetivos suficientemente distintos entre sí como para mantenerse separados.

---

## 9. Páginas a Eliminar

| Página | Motivo | Riesgo |
|---|---|---|
| — | No se identifica ninguna página redundante o prescindible en el material analizado. Las 7 pantallas cumplen funciones diferenciadas y necesarias. | — |

---

## 10. Responsive Design

### Desktop
- Mantener el layout de sidebar fijo + contenido principal ya presente.
- Las tarjetas de métricas del Dashboard y los paneles de `nuevo-turno.html` funcionan bien en grillas de 2 a 4 columnas, como hoy.

### Tablet
- El sidebar podría colapsar a un modo "solo íconos" (sin texto) para liberar espacio horizontal, manteniendo el mismo conjunto de enlaces y el mismo orden.
- Los formularios de dos columnas (por ejemplo, `cliente-detalle.html`) deberían poder colapsar a una sola columna manteniendo el orden lógico de los campos.

### Mobile
- El sidebar debería convertirse en un menú desplegable (drawer) o en una barra de navegación inferior, preservando los mismos 5-6 enlaces y sin perder ninguno (evitando repetir el problema del Hallazgo #16 en la versión mobile).
- Las tablas densas (Turnos, Clientes) deberían priorizar 2-3 datos clave por fila (nombre del cliente + fecha/hora + estado) y mover el resto a un detalle expandible, en vez de forzar scroll horizontal.
- El flujo de `nuevo-turno.html` ya contempla el colapso a una columna (media query a 768px); ese mismo criterio de "todo se apila en el orden de los pasos" debería aplicarse también si se agrega el stepper de progreso del Hallazgo #11.
- Los modales deberían ocupar pantalla completa en mobile en lugar de aparecer como tarjetas centradas pequeñas.

*(Nota: por restricción explícita de esta etapa, estas son recomendaciones de arquitectura de información y priorización de contenido, no especificaciones de CSS.)*

---

## 11. Riesgos y Consideraciones Técnicas

- **Dependencia de contratos de API existentes:** varias propuestas (búsqueda en Turnos, filtro por cliente, vista Agenda) dependen de que los endpoints `/turnos-v2` y relacionados acepten parámetros adicionales (fecha, `id_cliente`, texto de búsqueda). Si no los aceptan hoy, estas propuestas pasan de ser "solo frontend" a requerir cambios de backend, y deben re-priorizarse en consecuencia.
- **Alta de cliente "al vuelo" (Hallazgo #10):** antes de construir esto hay que confirmar si la ausencia de una pantalla de alta de cliente es un gap accidental o una decisión de negocio (por ejemplo, si los clientes solo pueden registrarse por un flujo público de autoservicio). Esto es una pregunta de producto, no solo de UX.
- **Cambios de bajo riesgo:** unificar el patrón de confirmación de borrado (Hallazgo #9), completar el sidebar de `cliente-detalle.html` (Hallazgo #16), hacer clicables las métricas del dashboard (Hallazgo #3) y el ajuste del ícono/label de edición de turno (Hallazgo #8, en su versión mínima) son cambios exclusivamente de frontend, sin impacto en endpoints ni en lógica de negocio.
- **Cambios que requieren coordinación con backend:** búsqueda/filtro por fecha o cliente en Turnos (Hallazgos #6, #7, #18), alta de cliente desde el flujo de reserva (Hallazgo #10), y cualquier ampliación real del modal de edición de turno más allá de observaciones (Hallazgo #8, en su versión ampliada).
- **No se asumen cambios de base de datos, permisos o roles** en ninguna de las propuestas de este documento; donde una propuesta podría llegar a necesitarlos, se marcó explícitamente como "Requiere validación" o "Requiere cambios funcionales" en el hallazgo correspondiente.

---

## 12. Roadmap de Implementación

### Fase 1 — Cambios de Alto Impacto y Bajo Riesgo
- Completar el sidebar de `cliente-detalle.html` (Hallazgo #16).
- Unificar el patrón de confirmación de borrado en `turnos.html` y `servicios.html` usando el modal ya existente en `clientes.html` (Hallazgo #9).
- Hacer clicables las métricas del Dashboard hacia sus módulos (Hallazgo #3).
- Corregir el ícono/label del modal de edición de turno para reflejar su alcance real (Hallazgo #8, versión mínima).
- Agregar el enlace de "editar directo" desde `clientes.html` (Hallazgo #14).
- Agregar el enlace de recuperación de contraseña en el login (Hallazgo #1).

### Fase 2 — Optimización de Flujos
- Incorporar búsqueda por cliente/fecha en `turnos.html` (Hallazgo #6, sujeto a validación de API).
- Agregar indicador de progreso (stepper) en `nuevo-turno.html` (Hallazgo #11).
- Reemplazar los selects de estado por badges + acción explícita en Dashboard y Turnos (Hallazgo #4).
- Agregar botón de refresco manual en el panel "Turnos de Hoy" del Dashboard (Hallazgo #5).
- Enlazar el historial de turnos de `cliente-detalle.html` con una vista filtrada en Turnos (Hallazgo #18, depende de Fase 2 de Turnos).
- Explicar visualmente los campos bloqueados (DNI/Email) en `cliente-detalle.html` (Hallazgo #17).
- Agregar microcopy sobre la regla de "activo por defecto" en `servicios.html` (Hallazgo #12).

### Fase 3 — Refinamiento
- Construir la vista **Agenda** (calendario día/semana) como nuevo módulo (Hallazgo #7, sección 7).
- Evaluar convertir `nuevo-turno.html` en un panel lateral lanzado desde `turnos.html` (sección 8).
- Resolver la creación de clientes "al vuelo" durante la reserva, una vez validada la decisión de negocio (Hallazgo #10).
- Auditar `utils.js`/`admin-utils.js` para foco de teclado y cierre con `Esc` en modales (Hallazgo #22).
- Definir la priorización de columnas para el futuro comportamiento responsive de las tablas (Hallazgo #21).
- Evaluar página de "Mi Cuenta / Configuración" (Hallazgo #20) y buscador global (Hallazgo #19) como visión de producto a más largo plazo.

---

## Verificación

- ✅ Se auditaron los 7 módulos entregados (`index`, `dashboard`, `turnos`, `nuevo-turno`, `servicios`, `clientes`, `cliente-detalle`); se dejó explícitamente fuera de alcance `tipos-servicio.html` por no haber sido provisto.
- ✅ Cada problema detectado (22 hallazgos) tiene una propuesta de solución asociada.
- ✅ Las recomendaciones se apoyan en patrones estándar de productos SaaS de gestión/backoffice y de reservas (dashboards accionables, badges de estado, confirmaciones destructivas consistentes, vistas de agenda, creación "al vuelo").
- ✅ Las propuestas de responsive contemplan Desktop, Tablet y Mobile.
- ✅ Ninguna propuesta asume romper lógica de negocio, APIs, integraciones o comportamientos actuales; donde una mejora podría requerir cambios funcionales o de backend, se marcó explícitamente como "Requiere validación" o "Requiere cambios funcionales" (Hallazgos #1, #6, #7, #8, #10, #18, #19, #20, #22).
- ✅ Las propuestas son técnicamente viables dentro de las restricciones definidas (sin cambios de CSS, backend, base de datos, permisos o roles asumidos como ya resueltos).

La verificación interna confirma que la auditoría UX/UI y el plan de rediseño han sido completados siguiendo todos los pasos, restricciones y criterios establecidos, preservando la lógica, APIs y funcionalidades existentes del sistema.
