# Control de asistencia: frontend

Interfaz web del módulo de control de asistencia de trabajadores (proyecto de Sistemas de Información). Cubre tres pantallas: **Turnos**, **Marcar** y **Consulta**.

> **Estado de la integración:** el repositorio ya contiene la estructura inicial de Django, pero aún no publica los endpoints de turnos y marcaciones. La aplicación arranca por defecto en **modo demostración** (datos simulados, con un aviso permanente). La conexión con la API real está preparada pero **no se ha podido comprobar**. Los contratos que faltan están en [`docs/CONTRATOS_PENDIENTES.md`](docs/CONTRATOS_PENDIENTES.md).

## Requisitos

- Node.js **22.12 o superior** (y npm).

## Comandos

```bash
npm install        # instala las dependencias
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run build      # revisa los tipos y genera la versión de producción en dist/
npm run preview    # sirve dist/ en http://localhost:4173
npm run typecheck  # solo revisa los tipos de TypeScript
npm test           # ejecuta las pruebas unitarias
npm run lint       # revisa reglas de código del equipo
```

`npm run dev` usa siempre el puerto 5173; si está ocupado, falla en lugar de abrir otro puerto.

## Tecnologías

React 18 · Vite · TypeScript (modo estricto) · Tailwind CSS 4 · React Router · IBM Plex Sans (instalada en el proyecto, no se carga desde internet) · Vitest.

No se usa ninguna librería de componentes ni de formularios: los componentes de `src/components/ui` son propios, para que el equipo pueda explicar cada pieza.

## Modo demostración y modo API

| | Demostración (por defecto) | API |
|---|---|---|
| Activación | Sin configurar nada, o `VITE_API_MODE=demo` | `VITE_API_MODE=api` |
| Datos | Simulados en el navegador, se pierden al recargar | Los del backend |
| Aviso en pantalla | Banner «Modo demostración» siempre visible | Ninguno |

Todas las variables están explicadas en [`.env.example`](.env.example). **No guardes claves ni contraseñas en variables `VITE_*`**: quedan visibles en el navegador.

### Herramientas de demostración
En modo demostración, el botón **Herramientas de demostración** (en el banner) permite evaluar situaciones difíciles de provocar:

- **Usar la aplicación como** RR. HH. o como trabajador (cambia lo que se ve en Consulta).
- **Probar mensajes de error**: la próxima petición falla una vez (error de servidor o sin conexión).
- **Restablecer los datos** de demostración.

El servicio demo también simula reglas del servidor: nombre de turno repetido (400), ventana anti-duplicado de 60 s al marcar (400), observación inválida (400), 403 y 404 en consulta.

## Estructura

```
frontend/
├── docs/CONTRATOS_PENDIENTES.md   Qué falta definir con backend
├── public/                        Ícono de la pestaña
└── src/
    ├── config/entorno.ts          Única lectura de las variables VITE_*
    ├── types/                     Interfaces TypeScript (modelo de la interfaz + DTO de la API)
    ├── services/
    │   ├── contratos.ts           Interfaces que usan las pantallas
    │   ├── index.ts               Elige API real o demostración
    │   ├── http/                  Cliente fetch y clases de error
    │   ├── api/                   Implementación real + mapeadores (formato API <-> interfaz)
    │   └── demo/                  Datos y servicios simulados (aislados de la API)
    ├── utils/                     Fechas en hora de Lima, validaciones, traducción de errores
    ├── hooks/                     useDatos (carga con cancelación), useTitulo
    ├── context/                   Sesión (quién usa la app) y avisos breves
    ├── components/
    │   ├── layout/                Barra lateral, barra inferior móvil, banner de demostración
    │   └── ui/                    Botón, campo de formulario, alerta, diálogo, paginación…
    └── pages/
        ├── turnos/  marcar/  consulta/
```

### Idea central: capa de servicios intercambiable

Las pantallas solo conocen las interfaces de `services/contratos.ts`. Hay dos implementaciones:

```
Pantalla ──> servicios.turnos.listar() ──┬──> services/api/turnosApi.ts   ──> fetch ──> backend
                                         └──> services/demo/turnosDemo.ts ──> datos simulados
```

`services/index.ts` decide cuál se usa según `VITE_API_MODE`. Si backend cambia un nombre de campo, solo se corrige `services/api/mapeadores.ts`.

### Hora de Lima

El servidor devuelve instantes en UTC. `utils/fechas.ts` los convierte a `America/Lima` **solo para mostrarlos**, con `Intl.DateTimeFormat` (no depende de la zona horaria del navegador; está probado). El cliente **nunca** genera ni envía la hora de una marcación. La única excepción es el servicio de **demostración**, que hace de servidor y lo avisa en pantalla.

## Qué cubre cada issue

### #8 · Base del frontend
React 18 + Vite + TypeScript + Tailwind; `npm run dev` en `localhost:5173`; layout con barra lateral (escritorio) y barra inferior (móvil); rutas `/turnos`, `/marcar`, `/consulta` (la raíz redirige a Turnos) y página de ruta inexistente.

### #13 · Turnos
Tabla (tarjetas por debajo de 1280 px) con horario, tolerancia, refrigerio, días laborables y estado; filtro Activos / Inactivos / Todos; formulario en panel lateral para crear y editar con selección de días y validaciones (nombre, horas, cruce de medianoche, rangos 0–120 y 0–180, al menos un día); errores 400 del servidor asignados al campo correspondiente; baja lógica con diálogo de confirmación; estados de carga, vacío, error con «Reintentar» y avisos de éxito.

### #19 · Marcar
Cuatro acciones (entrada, salida, inicio y fin de refrigerio) con confirmación previa y observación opcional; hora devuelta por el servidor convertida a Lima, con el valor UTC original disponible; bloqueo de envíos duplicados (botones deshabilitados y guarda inmediata contra doble clic); errores 400 visibles con su código y mensaje del servidor; el tipo de error (sin conexión, permisos, servidor) se distingue.

### #24 · Consulta
Filtros de trabajador (solo RR. HH.), fecha desde y hasta, con rangos rápidos; tabla ordenada de forma ascendente con fecha y hora de Lima, tipo, trabajador, dispositivo, columna **Manual** y observación; paginación; estados de carga, vacío, error y validación de fechas. Quien no es de RR. HH. solo ve sus propias marcaciones.

## Accesibilidad

Enlace «Saltar al contenido», etiquetas enlazadas a cada campo, errores asociados con `aria-describedby`/`aria-invalid`, foco al primer campo con error, diálogos nativos `<dialog>` (cierre con Esc y foco contenido), alertas con `role="alert"`, estado nunca indicado solo con color, tablas con `scope` y `aria-sort`, y respeto de `prefers-reduced-motion`.

## Pruebas

`npm test` ejecuta pruebas unitarias de: conversión a hora de Lima (incluido el límite de medianoche), validaciones, traducción de errores, mapeadores, cliente HTTP (con `fetch` simulado), que el cliente real **no envía hora** al marcar, y las reglas de los servicios de demostración.

Estas pruebas **no** validan un backend real ni los componentes visuales.

## Decisiones de diseño

- **Color:** petróleo (identidad), gris azulado frío (fondo), ámbar solo como señal (demostración, marca activa), verde y rojo solo para estados.
- **Tipografía:** IBM Plex Sans, con cifras tabulares para que las horas se alineen.
- **Tablas:** se convierten en tarjetas cuando no caben, en lugar de obligar a desplazarse horizontalmente.

## Pendiente para integrar

Ver [`docs/CONTRATOS_PENDIENTES.md`](docs/CONTRATOS_PENDIENTES.md): autenticación y roles, código de dispositivo web, catálogo de trabajadores, nombres definitivos de campos y forma de la paginación.
