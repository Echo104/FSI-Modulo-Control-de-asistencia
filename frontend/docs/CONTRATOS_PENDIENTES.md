# Contratos pendientes con el backend

El frontend se construyó a partir de las historias de usuario **HU-01** (turnos), **HU-02** (marcación) y **HU-03** (consulta) y de las issues de backend relacionadas. En esos textos los endpoints figuran como *propuestos*. El repositorio ya incluye una estructura inicial de Django, pero aún no publica estos endpoints ni un contrato definitivo; por eso **la integración real no se ha podido comprobar**.

Este documento separa tres cosas:

1. Lo que las historias **sí** definen y el frontend respeta.
2. Lo que el frontend **tuvo que suponer** (hay que confirmarlo con backend).
3. Lo que **falta por completo** y bloquea la conexión.

Todas las suposiciones están aisladas: cuando backend confirme o cambie algo, solo se toca el archivo indicado en la columna «Dónde se corrige».

---

## 1. Lo que las historias sí definen (el frontend ya lo respeta)

| Tema | Regla | Dónde se aplica |
|---|---|---|
| Turno: tolerancia | Entero de 0 a 120 minutos | `utils/validacionTurno.ts` |
| Turno: refrigerio | Entero de 0 a 180 minutos | `utils/validacionTurno.ts` |
| Turno: nombre | No admite los caracteres `\|` `/` `\` | `utils/validacionTurno.ts` |
| Turno: horas | Salida anterior a entrada solo si el turno cruza la medianoche | `utils/validacionTurno.ts` |
| Turno: días | Siete días (1 a 7), cada uno laborable `S` o `N` | `services/api/mapeadores.ts` |
| Turno: estado | `A` activo, `I` inactivo; `DELETE` es baja lógica | `services/api/turnosApi.ts` |
| Turno: detalle | El detalle incluye los días; por eso editar pide primero el detalle | `pages/turnos/PanelTurno.tsx` |
| Marcación: datos enviados | Trabajador, tipo (`ENT`, `SAL`, `IRF`, `FRF`) y código de dispositivo | `services/api/marcacionesApi.ts` |
| Marcación: hora | La fija el servidor en UTC; el cliente **nunca** la envía | `services/api/marcacionesApi.ts` (hay una prueba que lo verifica) |
| Marcación: observación | Máximo 200 caracteres, sin `\|` `/` `\` | `utils/validacionMarcacion.ts` |
| Marcación: duplicado | Dos del mismo tipo dentro de la ventana anti-duplicado: la segunda responde 400 | `utils/errores.ts` muestra el mensaje |
| Marcación: inmutable | No se puede editar ni eliminar | Texto de la confirmación en `pages/marcar` |
| Consulta: filtros | Trabajador (RR. HH.), `desde`, `hasta` (AAAA-MM-DD) | `services/api/marcacionesApi.ts` |
| Consulta: rango | Inclusivo y en hora de Lima | `utils/validacionConsulta.ts` |
| Consulta: orden | Ascendente por fecha y hora | `TablaMarcaciones.tsx` (conserva el orden del servidor) |
| Consulta: errores | 400 (fechas faltantes, inválidas o invertidas), 403 (consultar a otro sin ser RR. HH.), 404 (trabajador inexistente) | `utils/errores.ts`, `PaginaConsulta.tsx` |

---

## 2. Suposiciones del frontend (confirmar con backend)

### 2.1 Nombres de campos de Turno
Las historias no fijan los nombres exactos. Se asumió el estilo habitual de Django REST Framework (snake_case):

```json
{
  "id": 1,
  "nombre": "Administrativo diurno",
  "hora_entrada": "08:00:00",
  "hora_salida": "17:00:00",
  "cruza_medianoche": "N",
  "tolerancia_min": 10,
  "refrigerio_min": 60,
  "estado": "A",
  "dias": [{ "dia": 1, "laborable": "S" }],
  "creado_en": "2026-03-02T14:20:00Z",
  "actualizado_en": null
}
```

- `tolerancia_min` y `refrigerio_min` son **nombres inventados**; en las historias solo aparecen como «tolerancia» y «refrigerio».
- Se asume `1 = lunes … 7 = domingo`.
- Se asume `S`/`N` en texto (no booleanos). El mapeador también acepta `true`/`false`.
- Se asume que el nombre tiene máximo 100 caracteres (límite **solo de la interfaz**).

**Dónde se corrige:** `src/types/turnos.ts` (interfaces `TurnoDto`, `TurnoEscrituraDto`) y `src/services/api/mapeadores.ts`.

### 2.2 Listado de turnos
- Se asume que `GET /turnos/?estado=A` y `?estado=I` funcionan, y que **sin filtro** no se devuelven los inactivos (la HU-01 dice que dejan de listarse por defecto).
- Como no hay un valor documentado para «todos», la opción **Todos** del filtro hace **dos peticiones** (A e I) y las une.
- Se asume que el listado puede o no incluir los días; si no los incluye, la tabla muestra «No incluido en el listado». **Conviene que el listado los incluya.**

**Dónde se corrige:** `src/services/api/turnosApi.ts`.

### 2.3 Respuesta al registrar una marcación
Se asume que `POST /marcaciones/` devuelve `201` con la marcación creada, incluyendo `fecha_hora`:

```json
{
  "id": 9,
  "trabajador": 4,
  "tipo_marcacion": "ENT",
  "fecha_hora": "2026-11-20T13:02:11Z",
  "dispositivo": "…",
  "es_manual": "N",
  "observacion": null
}
```

- Si `fecha_hora` no viene, la pantalla Marcar muestra un aviso y **no inventa una hora**.
- Se asume que `fecha_hora` es un instante con zona (`Z` o `+hh:mm`). Si llegara sin zona, el frontend lo interpreta como UTC.

**Dónde se corrige:** `src/types/marcaciones.ts` (`MarcacionDto`) y `src/services/api/mapeadores.ts`.

### 2.4 Consulta de marcaciones
- Parámetros: `trabajador_id`, `desde`, `hasta`, `page`.
- Paginación estilo DRF: `{ "count": 25, "next": "…", "previous": null, "results": [] }`. También se acepta una lista simple. Si backend usa `limit`/`offset`, se cambia en un solo lugar.
- El tamaño de página no se informa en la respuesta: el frontend lo **deduce** de la primera página para mostrar «Página 2 de 5».
- Se necesita el **nombre del trabajador** en cada fila (`trabajador_nombre`). Las historias no lo mencionan; sin él la tabla solo puede mostrar «Trabajador 3».
- Se necesita `dispositivo` como texto legible (código o nombre). Si backend devuelve un objeto, hay que ajustar el mapeador.
- Quien **no** es de RR. HH. siempre envía su propio `trabajador_id`. Para RR. HH., dejar el filtro vacío **omite** el parámetro: se asume que entonces se devuelven las marcaciones de toda su empresa. **Confirmar.**

**Dónde se corrige:** `src/services/api/marcacionesApi.ts` y `mapeadores.ts`.

### 2.5 Formato de errores
Se asume el formato estándar de DRF, con mensajes ya en español:

```json
{ "nombre": ["Ya existe un turno con ese nombre."] }
{ "non_field_errors": ["…"] }
{ "detail": "…" }
```

Los mensajes de 401, 403, 404, 405 y 5xx se muestran con textos propios en español, para no exponer mensajes en inglés del framework. Los mensajes del 400 sí se muestran tal cual los envía el servidor.

**Dónde se corrige:** `src/utils/errores.ts` y `CAMPO_API_A_FORMULARIO` en `pages/turnos/FormularioTurno.tsx`.

### 2.6 Desarrollo local
- En desarrollo, Vite reenvía `/api` a `VITE_API_PROXY_TARGET` (por defecto `http://localhost:8000`), así que no hace falta configurar CORS en el backend para trabajar en local.
- Si backend publica la API en otro origen (sin proxy), tendrá que habilitar CORS.

---

## 3. Lo que falta por completo (bloquea la conexión real)

| # | Qué falta | Por qué importa | Solución temporal en el frontend |
|---|---|---|---|
| 1 | **Autenticación y sesión**: cómo se identifica quién usa la pantalla | Marcar necesita el id del trabajador; Consulta necesita saber si es RR. HH. | Variables `VITE_PRUEBA_TRABAJADOR_ID`, `VITE_PRUEBA_TRABAJADOR_NOMBRE`, `VITE_PRUEBA_ES_RRHH` (solo para pruebas locales). Sin ellas, la pantalla muestra «Configuración pendiente». |
| 2 | **Roles**: quién puede ver/usar Turnos | El texto dice que «un responsable administra los turnos», pero no hay regla de acceso | La pantalla Turnos se muestra a todos. No se simuló ninguna restricción. |
| 3 | **Código del dispositivo web** | Es dato obligatorio al marcar | `VITE_CODIGO_DISPOSITIVO_WEB`. Si está vacío, marcar falla con un mensaje claro y **no llama a la red**. |
| 4 | **Endpoint del catálogo de trabajadores** | El selector de RR. HH. necesita la lista | `VITE_API_RUTA_TRABAJADORES`. Si está vacío, aparece un campo «ID del trabajador (opcional)». Forma asumida: `{ "id": 1, "nombre_completo": "…" }`. |
| 5 | **Mecanismo de credenciales** (cookie de sesión, token…) y protección CSRF si aplica | Sin esto las peticiones reales serán rechazadas | Hay un único punto preparado: `encabezadosDeAutenticacion()` en `src/services/http/clienteHttp.ts`. **No se guardó ninguna clave ni token.** |
| 6 | Valor del **parámetro de ventana anti-duplicado** y texto del mensaje | Solo informativo | En demostración se usa 60 s (`services/demo/datosDemo.ts`). |

---

## 4. Reglas que son **solo del frontend** (no vienen de las historias)

Conviene que el equipo las confirme o las quite:

- El formulario de turno exige **al menos un día laborable**.
- Avisos no bloqueantes al editar horas: salida igual a entrada, o «cruza la medianoche» con salida posterior a la entrada.
- Longitud máxima del nombre del turno: 100 caracteres.
- Orden de las acciones de Marcar: se agruparon en «Jornada» (entrada, salida) y «Refrigerio» (inicio, fin).

---

## 5. Cómo pasar de «demostración» a la API real

1. Copia `.env.example` como `.env.local`.
2. Cambia `VITE_API_MODE=api`.
3. Completa (según el avance de backend) `VITE_API_PROXY_TARGET`, `VITE_CODIGO_DISPOSITIVO_WEB`, `VITE_API_RUTA_TRABAJADORES` y las variables `VITE_PRUEBA_*`.
4. Reinicia `npm run dev` y revisa cada punto de la sección 2 contra las respuestas reales (pestaña *Red* del navegador).
5. Ajusta `mapeadores.ts` y los tipos `*Dto` si algún nombre de campo difiere.

Ninguna pantalla cambia: solo la capa `src/services/`.

## 6. Qué NO se ha comprobado

- Ninguna petición real contra un backend (no existe todavía).
- Los nombres de campo, la forma de la paginación y los códigos de error de la API real.
- El comportamiento con autenticación real.
- Las pruebas automáticas validan el cliente HTTP con `fetch` simulado y los servicios de demostración; **no** prueban el backend.
