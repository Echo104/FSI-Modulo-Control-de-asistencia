# FSI — Control de Asistencia

Módulo de Control de Asistencia del ERP académico (Fundamentos de Sistemas de Información, UNSA). Registra marcaciones, consolida la asistencia diaria y entrega datos a Planillas y Contabilidad.

## Tecnologías
- Backend: Python + Django REST Framework
- Frontend: React + Vite + TypeScript
- Base de datos: PostgreSQL 16 (Docker)
- Estilos: Tailwind CSS

## Estructura
- `backend/`: API (Django REST Framework)
- `frontend/`: aplicación web (React + Vite)
- `database/`: scripts SQL (estructura y datos de prueba)
- `docs/`: informe, diccionario de datos y arquitectura
- `.github/`: plantillas de Pull Request

## Cómo levantar el proyecto
1. Copia `.env.example` a `.env` y completa los valores:
   ```bash
   cp .env.example .env   # Windows: copy .env.example .env
   ```
2. Levanta la base de datos PostgreSQL 16 con Docker:
   ```bash
   docker compose up -d
   ```
3. Backend:
   ```bash
   cd backend
   python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver    # http://localhost:8000
   ```
4. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev    # http://localhost:5173
   ```

> Los pasos 3 y 4 funcionarán cuando se suba el código del backend y del frontend.

## API disponible

Documentación interactiva (Swagger): `http://localhost:8000/api/docs/`

### HU-01 · Turnos (`/api/asistencia/turnos/`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/asistencia/turnos/` | Lista turnos activos. Filtros: `?estado=A\|I\|todos`, `?empresa_id=1` |
| POST | `/api/asistencia/turnos/` | Crea un turno con sus días (`dias: [{dia_semana, laborable}]`) |
| GET | `/api/asistencia/turnos/{id}/` | Detalle del turno con sus días |
| PUT / PATCH | `/api/asistencia/turnos/{id}/` | Edita el turno (actualiza `actualizado_en/por`) |
| DELETE | `/api/asistencia/turnos/{id}/` | Baja lógica: `estado = I`, no se borra de la BD |

Mientras no exista autenticación, el usuario de auditoría (`creado_por`, `actualizado_por`)
se toma de la cabecera `X-Usuario`; si no se envía se registra `sistema`.

```bash
curl -X POST http://localhost:8000/api/asistencia/turnos/ \
  -H "Content-Type: application/json" -H "X-Usuario: rrhh.ana" \
  -d '{"empresa_id":1,"nombre":"Mañana","hora_entrada":"08:00","hora_salida":"17:00",
       "tolerancia_min":10,"refrigerio_min":60,"cruza_medianoche":"N",
       "dias":[{"dia_semana":1,"laborable":"S"},{"dia_semana":6,"laborable":"N"}]}'
```

### Pruebas

```bash
cd backend
pytest            # requiere PostgreSQL levantado (docker compose up -d)
```