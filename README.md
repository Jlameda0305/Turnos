# AIONEX — Sistema de Turnos

Aplicación web estática para la gestión de turnos. Permite a los usuarios registrarse, iniciar sesión con su DNI, visualizar su historial de reservas, reservar nuevos turnos y cancelar o reprogramar los existentes.

La lógica de negocio vive completamente en workflows de **n8n**, lo que hace que el frontend sea reemplazable o migrable (ej. a NFC) sin tocar el backend.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | HTML + Vanilla CSS + Vanilla JS |
| Automatización / Backend | n8n (webhooks) |
| Base de datos | Supabase (PostgreSQL) |
| Deploy | Vercel (estático) |
| Tipografía | Inter (Google Fonts) |

---

## Estructura del proyecto

```
app/
├── index.html          # Entry point — verifica sesión y redirige
├── ingreso.html        # Login por DNI
├── formulario.html     # Registro de nuevo usuario
├── turnos.html         # Dashboard: historial de turnos del usuario
├── reservar.html       # Calendario de selección de fecha y horario
├── 404.html            # Página de error personalizada
│
├── css/
│   ├── base.css        # Variables CSS, reset, fondo animado, keyframes
│   ├── components.css  # Componentes compartidos: brand, cards, botones, inputs, toasts
│   └── pages/
│       ├── router.css      # Estilos exclusivos de index.html
│       ├── ingreso.css     # Estilos exclusivos de ingreso.html
│       ├── formulario.css  # Estilos exclusivos de formulario.html
│       ├── turnos.css      # Estilos exclusivos de turnos.html
│       └── reservar.css    # Estilos exclusivos de reservar.html
│
├── js/
│   └── utils.js        # Utilidades compartidas (ver más abajo)
│
├── assets/
│   └── favicon.svg     # Favicon SVG con gradiente de marca
│
├── robots.txt
├── sitemap.xml
└── vercel.json         # Rewrites + cache headers
```

---

## Diseño: cómo cambiar el look

Todo el sistema de diseño vive en **variables CSS** dentro de `css/base.css`:

```css
:root {
  --color-indigo:      #6366f1;   /* Color principal de marca */
  --color-sky:         #0ea5e9;   /* Color secundario */
  --color-purple:      #a855f7;   /* Acento */
  --bg-base:           #0a0a1a;   /* Fondo de la app */
  --radius-lg:         14px;      /* Radio de los botones */
  --shadow-btn-hover:  ...;       /* Sombra en hover */
  /* ... */
}
```

Cambiar una variable impacta automáticamente en todas las páginas. No hay que tocar los HTML.

---

## Utilidades compartidas (`js/utils.js`)

| Función | Descripción |
|---|---|
| `N8N_BASE_URL` | URL base del servidor n8n. **Único lugar para cambiarla.** |
| `getCookie(name)` | Lee una cookie del navegador |
| `setCookie(name, value, days)` | Escribe una cookie |
| `deleteCookie(name)` | Elimina una cookie |
| `showToast(message, type)` | Muestra notificación flotante (`'success'` o `'error'`) |
| `fetchWithTimeout(url, opts, ms)` | `fetch()` con timeout de 8 segundos. Lanza error si el servidor no responde. |
| `formatFechaDisplay(dateStr)` | Convierte `YYYY-MM-DD` o ISO timestamp → `DD/MM/YYYY` |
| `formatHoraDisplay(horaStr)` | Recorta un string de hora a `HH:MM` |
| `cerrarSesion()` | Borra la cookie de sesión y redirige a `index.html` |
| `getSessionOrRedirect()` | Devuelve el `session_id` o redirige a `index.html` si no hay sesión |

---

## Flujo de usuario

```
index.html
  ├── Sin cookie  →  ingreso.html
  │                     ├── DNI no existe  →  formulario.html  →  turnos.html
  │                     └── DNI existe     →  turnos.html
  └── Cookie válida  →  turnos.html
                           └── "Crear nuevo turno"  →  reservar.html
                                                          └── Éxito  →  turnos.html
```

La **autenticación** se basa en una cookie `session_id` que almacena el `id_cliente` (UUID) generado por Supabase. La cookie dura 30 días.

---

## Webhooks de n8n

Todos los endpoints cuelgan de `N8N_BASE_URL` (definido en `js/utils.js`).

| Ruta | Método | Descripción |
|---|---|---|
| `/webhook/router` | POST | Valida si el `session_id` es un UUID real en la BD |
| `/webhook/ingreso` | POST | Busca un cliente por DNI y devuelve su `id_cliente` |
| `/webhook/registro` | POST | Crea un nuevo cliente y devuelve su `id_cliente` |
| `/webhook/usuario` | POST | Devuelve nombre y apellido del cliente para el header |
| `/webhook/mis-turnos` | POST | Lista todos los turnos del cliente, ordenados por fecha desc |
| `/webhook/turnos-disponibles` | POST | Devuelve los horarios ocupados para una fecha dada |
| `/webhook/reservar` | POST | Inserta un nuevo turno (devuelve `409` si hay conflicto) |
| `/webhook/cancelar-turno` | POST | Actualiza el estado del turno a `'cancelado'` |

---

## Base de datos (Supabase)

### Tabla `clientes`
| Columna | Tipo | Notas |
|---|---|---|
| `id_cliente` | `uuid` | PK, generado automáticamente |
| `dni` | `varchar` | Único |
| `nombre` | `varchar` | — |
| `apellido` | `varchar` | — |
| `sexo` | `char(1)` | `M`, `F`, `X` |
| `fecha_nacimiento` | `date` | — |
| `email` | `varchar` | — |
| `telefono` | `varchar` | Opcional |
| `direccion` | `varchar` | Opcional |

### Tabla `turnos`
| Columna | Tipo | Notas |
|---|---|---|
| `id_turno` | `uuid` | PK |
| `id_cliente` | `uuid` | FK → `clientes.id_cliente` |
| `fecha` | `date` | — |
| `hora` | `time` | — |
| `estado` | `estado_turno` | ENUM: `pendiente`, `confirmado`, `cancelado`, `completado` |
| `observaciones` | `text` | Opcional |

### Tipo ENUM
```sql
CREATE TYPE estado_turno AS ENUM (
  'pendiente', 'confirmado', 'cancelado', 'completado'
);
```

---

## Deploy en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Configurar **Root Directory** como `app/`
3. No se necesita build step (es estático puro)
4. El `vercel.json` ya maneja el rewrite de `/` → `index.html` y los headers de cache para CSS/JS/assets

---

## Notas de desarrollo

- **Sin frameworks**: cero dependencias de npm. Abrís cualquier `.html` con Live Server y funciona.
- **Timeout de red**: todos los `fetch()` usan `fetchWithTimeout()`. Si n8n no responde en 8 segundos, el usuario ve un mensaje de error en lugar de un spinner eterno.
- **Accesibilidad**: los slots del calendario en `reservar.html` son elementos `<button>` con `aria-label` y `aria-pressed`. Los toasts tienen `aria-live="polite"` para lectores de pantalla.
- **Reprogramación**: por simplicidad, "Reprogramar" cancela el turno actual y redirige al calendario para sacar uno nuevo. No hay modal intermedio.