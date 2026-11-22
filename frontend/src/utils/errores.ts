import { ErrorApi, ErrorContratoPendiente, ErrorRed } from '@/services/http/errores'

/** Error ya traducido, listo para mostrarse en pantalla. */
export interface ErrorUi {
  /** Ejemplo: "No se pudo guardar el turno". */
  titulo: string
  /** Mensajes legibles; el primero es el más importante. */
  mensajes: string[]
  /** Mensajes que la API asoció a un campo concreto (clave = nombre del campo en la API). */
  porCampo: Record<string, string[]>
  /** Código HTTP si lo hubo. */
  estado: number | null
  /** Texto corto para la etiqueta de la alerta, por ejemplo "Error 400". */
  codigo: string | null
  /** Tiene sentido ofrecer un botón "Reintentar". */
  reintentable: boolean
}

export interface OpcionesError {
  /** Nombres legibles de los campos de la API, para anteponerlos al mensaje ("Observación: …"). */
  etiquetasCampo?: Record<string, string>
  /** Mensaje propio para códigos concretos, por ejemplo { 403: 'No puedes consultar a otro trabajador.' }. */
  mensajesPorEstado?: Partial<Record<number, string>>
}

const GENERAL = ''
const CLAVES_GENERALES = new Set(['detail', 'non_field_errors', 'error', 'mensaje', 'message'])

function recolectar(valor: unknown, campo: string, salida: Record<string, string[]>): void {
  if (typeof valor === 'string') {
    const texto = valor.trim()
    if (texto) {
      const lista = (salida[campo] ??= [])
      if (!lista.includes(texto)) lista.push(texto)
    }
    return
  }
  if (Array.isArray(valor)) {
    valor.forEach((item) => recolectar(item, campo, salida))
    return
  }
  if (valor && typeof valor === 'object') {
    for (const [clave, contenido] of Object.entries(valor)) {
      // Dentro de un campo (por ejemplo "dias") se conserva el campo de primer nivel.
      const destino = campo === GENERAL ? (CLAVES_GENERALES.has(clave) ? GENERAL : clave) : campo
      recolectar(contenido, destino, salida)
    }
  }
}

/**
 * Aplana el cuerpo de un error 400 de Django REST Framework. Acepta, por ejemplo:
 *   { "nombre": ["Ya existe un turno con ese nombre."] }
 *   { "non_field_errors": ["…"] }   { "detail": "…" }   ["…"]
 * Los mensajes sin campo quedan bajo la clave "".
 */
export function aplanarErrores(cuerpo: unknown): Record<string, string[]> {
  const salida: Record<string, string[]> = {}
  recolectar(cuerpo, GENERAL, salida)
  return salida
}

function construirMensajes(agrupados: Record<string, string[]>, etiquetas: Record<string, string>): string[] {
  const mensajes: string[] = [...(agrupados[GENERAL] ?? [])]
  for (const [campo, lista] of Object.entries(agrupados)) {
    if (campo === GENERAL) continue
    const etiqueta = etiquetas[campo]
    for (const texto of lista) mensajes.push(etiqueta ? `${etiqueta}: ${texto}` : texto)
  }
  return mensajes
}

/** Traduce cualquier error de la capa de servicios a un mensaje que la persona usuaria pueda entender. */
export function describirError(error: unknown, accion: string, opciones: OpcionesError = {}): ErrorUi {
  const titulo = `No se pudo ${accion}`
  const { etiquetasCampo = {}, mensajesPorEstado = {} } = opciones

  if (error instanceof ErrorContratoPendiente) {
    return {
      titulo,
      mensajes: [error.message],
      porCampo: {},
      estado: null,
      codigo: 'Configuración pendiente',
      reintentable: false,
    }
  }

  if (error instanceof ErrorRed) {
    return {
      titulo,
      mensajes: ['No hay conexión con el servidor. Revisa tu conexión a internet y vuelve a intentarlo.'],
      porCampo: {},
      estado: null,
      codigo: 'Sin conexión',
      reintentable: true,
    }
  }

  if (error instanceof ErrorApi) {
    const estado = error.estado
    const codigo = `Error ${estado}`
    const propio = mensajesPorEstado[estado]
    if (propio) return { titulo, mensajes: [propio], porCampo: {}, estado, codigo, reintentable: estado >= 500 }

    if (estado === 400) {
      const agrupados = aplanarErrores(error.cuerpo)
      const porCampo = { ...agrupados }
      delete porCampo[GENERAL]
      const mensajes = construirMensajes(agrupados, etiquetasCampo)
      return {
        titulo,
        mensajes: mensajes.length > 0 ? mensajes : ['El servidor rechazó los datos enviados. Revísalos e inténtalo de nuevo.'],
        porCampo,
        estado,
        codigo,
        reintentable: false,
      }
    }

    const textos: Record<number, string> = {
      401: 'Tu sesión no es válida o ya venció. Inicia sesión otra vez.',
      403: 'No tienes permiso para realizar esta acción.',
      404: 'No se encontró lo que buscabas. Es posible que ya no exista.',
      405: 'El servidor no permite esta operación.',
    }
    const conocido = textos[estado]
    if (conocido) return { titulo, mensajes: [conocido], porCampo: {}, estado, codigo, reintentable: false }

    if (estado >= 500) {
      return {
        titulo,
        mensajes: [
          'El servidor tuvo un problema al procesar la solicitud. Inténtalo de nuevo en unos minutos; si continúa, avisa al equipo de backend.',
        ],
        porCampo: {},
        estado,
        codigo,
        reintentable: true,
      }
    }

    return {
      titulo,
      mensajes: [`El servidor respondió con el código ${estado}.`],
      porCampo: {},
      estado,
      codigo,
      reintentable: false,
    }
  }

  return {
    titulo,
    mensajes: ['Ocurrió un problema inesperado. Vuelve a intentarlo.'],
    porCampo: {},
    estado: null,
    codigo: null,
    reintentable: true,
  }
}
