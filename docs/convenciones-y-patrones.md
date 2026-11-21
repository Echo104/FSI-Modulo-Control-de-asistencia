# Estructura, patrones y convenciones: Control de Asistencia

## 1. Estructura del backend
```
backend/
  config/                  # settings, urls
  core/                    # entidades compartidas provisionales (trabajador, establecimiento, centro_costo)
  asistencia/
    models.py              # tablas del módulo
    serializers.py         # validación de entrada/salida (HTTP 400 con errores legibles)
    views.py               # ViewSets: solo orquestan la petición
    services/              # reglas de negocio (consolidación, cierre de periodo, anti-duplicado)
    urls.py
  tests/                   # pytest
```
Regla: las vistas no contienen reglas de negocio; las reglas viven en `services/`.

## 2. Patrones a usar
| Patrón | Dónde | Para qué |
|---|---|---|
| Capa de servicios (Service Layer) | `asistencia/services/` | Reglas de tardanza, consolidación y cierre fuera de las vistas |
| Serializer / DTO | `serializers.py` | Contrato JSON y validación de entrada |
| Strategy | Métodos de marcación (WEB, MOV, QRC) | Agregar un método sin tocar el flujo de registro |
| Inmutabilidad (solo insertar) | `marcacion` | La corrección es una nueva marcación manual |
| Vista de solo lectura | `v_resumen_periodo` | Planillas no depende de nuestras tablas internas |

## 3. Frontend
```
frontend/src/
  components/   # piezas reutilizables (Layout, tablas, formularios)
  pages/        # una pantalla por ruta (Turnos, Marcar, Consulta)
  api/          # llamadas a la API
  types/        # interfaces TypeScript que reflejan los JSON de la API
```

## 4. Convenciones de nombres
- Python: `snake_case` para funciones, variables y archivos; `PascalCase` para clases.
- Tablas y campos: `snake_case`, singular (`turno`, `marcacion`), `empresa_id` en todas.
- Endpoints: `/api/asistencia/<recurso-en-plural>/` en minúsculas (`/api/asistencia/turnos/`).
- TypeScript: `PascalCase` para componentes e interfaces; `camelCase` para variables y funciones.

## 5. Ramas
Se crean desde `main` actualizada y se integran por Pull Request con 1 aprobación.
- `feat/<tema>` funcionalidad nueva
- `fix/<tema>` corrección de errores
- `chore/<tema>` configuración y mantenimiento
- `docs/<tema>` documentación
- `ci/<tema>` flujos de integración continua

## 6. Commits
Formato `tipo(ámbito): descripción en minúsculas`, por ejemplo:
- `feat(backend): agregar modelo turno`
- `fix(frontend): corregir ruta de consulta`
- `docs: actualizar README`

## 7. Pull Requests
Descripción con `Closes #número` del issue, comprobaciones realizadas y al menos 1 revisión aprobada antes de integrar.