/// <reference types="vite/client" />

// Variables de entorno que usa la aplicación (ver .env.example).
interface ImportMetaEnv {
  readonly VITE_API_MODE?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_CODIGO_DISPOSITIVO_WEB?: string
  readonly VITE_API_RUTA_TRABAJADORES?: string
  readonly VITE_PRUEBA_TRABAJADOR_ID?: string
  readonly VITE_PRUEBA_TRABAJADOR_NOMBRE?: string
  readonly VITE_PRUEBA_ES_RRHH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
