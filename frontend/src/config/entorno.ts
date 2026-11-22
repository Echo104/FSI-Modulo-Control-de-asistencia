/**
 * Configuración de la aplicación leída desde las variables VITE_* (ver .env.example).
 * Es el único lugar donde se lee `import.meta.env`, para que el resto del código no dependa de Vite.
 */

export type ModoApi = 'demo' | 'api'

/** Sin definir nada se usa "demo", así `npm run dev` funciona aunque aún no exista backend. */
function leerModo(valor: string | undefined): ModoApi {
  return valor === 'api' ? 'api' : 'demo'
}

function leerEntero(valor: string | undefined): number | null {
  if (!valor || !/^\d+$/.test(valor.trim())) return null
  return Number(valor.trim())
}

const env = import.meta.env

export const entorno = {
  modo: leerModo(env.VITE_API_MODE),
  /** Ruta base de la API, sin barra final. */
  urlBaseApi: (env.VITE_API_BASE_URL ?? '/api/asistencia').trim().replace(/\/+$/, ''),
  /** Código del dispositivo "web" en el catálogo del backend (pendiente de definir por backend). */
  codigoDispositivoWeb: (env.VITE_CODIGO_DISPOSITIVO_WEB ?? '').trim(),
  /** Ruta del listado de trabajadores; vacía mientras el backend no la publique. */
  rutaTrabajadores: (env.VITE_API_RUTA_TRABAJADORES ?? '').trim(),
  /** Perfil temporal para probar en modo api mientras no exista autenticación. */
  perfilPrueba: {
    trabajadorId: leerEntero(env.VITE_PRUEBA_TRABAJADOR_ID),
    nombre: (env.VITE_PRUEBA_TRABAJADOR_NOMBRE ?? '').trim(),
    esRrhh: (env.VITE_PRUEBA_ES_RRHH ?? '').trim().toLowerCase() === 'true',
  },
} as const

export const esModoDemo = entorno.modo === 'demo'
