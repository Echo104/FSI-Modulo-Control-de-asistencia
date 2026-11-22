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

> El frontend arranca en modo demostración. La estructura inicial del backend existe, pero la API de asistencia sigue pendiente. Consulta `frontend/README.md` y `frontend/docs/CONTRATOS_PENDIENTES.md` antes de activar el modo API.
