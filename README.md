\# FSI — Control de Asistencia



Módulo de Control de Asistencia del ERP académico (Fundamentos de Sistemas de

Información, UNSA). Registra marcaciones, consolida la asistencia diaria y

entrega datos a Planillas y Contabilidad.



\## Tecnologías

\- Backend: Python + Django REST Framework

\- Frontend: React + Vite + TypeScript

\- Base de datos: PostgreSQL

\- Estilos: Tailwind CSS



\## Estructura

\- `backend/`: API (Django REST Framework)

\- `frontend/`: aplicación web (React + Vite)

\- `database/`: scripts SQL (estructura y datos de prueba)

\- `docs/`: informe, diccionario de datos y arquitectura

\- `.github/`: plantillas de Pull Request



\## Cómo levantar el proyecto

1\. Copia `.env.example` a `.env` y completa los valores.

2\. Crea la base de datos PostgreSQL con los datos del `.env`.

3\. Backend:

&#x20;  ```bash

&#x20;  cd backend

&#x20;  python -m venv venv \&\& source venv/bin/activate   # Windows: venv\\Scripts\\activate

&#x20;  pip install -r requirements.txt

&#x20;  python manage.py migrate

&#x20;  python manage.py runserver    # http://localhost:8000

&#x20;  ```

4\. Frontend:

&#x20;  ```bash

&#x20;  cd frontend

&#x20;  npm install

&#x20;  npm run dev    # http://localhost:5173

&#x20;  ```



> Los pasos 3 y 4 funcionarán cuando se suba el código del backend y del frontend.



