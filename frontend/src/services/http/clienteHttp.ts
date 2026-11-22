import { entorno } from '@/config/entorno'
import { ErrorApi, ErrorRed } from './errores'

type MetodoHttp = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type ValorParametro = string | number | null | undefined

export interface OpcionesSolicitud {
  metodo?: MetodoHttp
  /** Parámetros de consulta (?a=1&b=2). Los valores vacíos o indefinidos se omiten. */
  parametros?: Record<string, ValorParametro>
  /** Cuerpo que se envía como JSON. */
  cuerpo?: unknown
  /** Permite cancelar la petición cuando la pantalla ya no necesita la respuesta. */
  senal?: AbortSignal
}

/**
 * PENDIENTE: el mecanismo de autenticación aún no está definido (sesión con cookie, token, etc.).
 * Cuando backend lo defina, los encabezados se agregan aquí y en ningún otro lugar.
 * Nunca se deben escribir claves o tokens fijos en el código.
 */
function encabezadosDeAutenticacion(): Record<string, string> {
  return {}
}

export function construirUrl(ruta: string, parametros?: Record<string, ValorParametro>): string {
  const base = `${entorno.urlBaseApi}${ruta.startsWith('/') ? ruta : `/${ruta}`}`
  const consulta = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') consulta.set(clave, String(valor))
  }
  const texto = consulta.toString()
  return texto ? `${base}?${texto}` : base
}

function interpretarCuerpo(texto: string): unknown {
  if (!texto) return null
  try {
    return JSON.parse(texto)
  } catch {
    return texto
  }
}

/** Única puerta de salida hacia el backend: todas las llamadas reales pasan por esta función. */
export async function solicitar<T>(ruta: string, opciones: OpcionesSolicitud = {}): Promise<T> {
  const { metodo = 'GET', parametros, cuerpo, senal } = opciones

  const encabezados: Record<string, string> = {
    Accept: 'application/json',
    ...encabezadosDeAutenticacion(),
  }
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json'

  let respuesta: Response
  try {
    respuesta = await fetch(construirUrl(ruta, parametros), {
      method: metodo,
      headers: encabezados,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: senal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ErrorRed()
  }

  const contenido = interpretarCuerpo(await respuesta.text())
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, contenido)
  return contenido as T
}
