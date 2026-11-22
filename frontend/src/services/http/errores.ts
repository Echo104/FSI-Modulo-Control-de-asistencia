/**
 * Errores que puede producir la capa de servicios. Las pantallas no leen estos objetos directamente:
 * los traducen con `describirError` (utils/errores.ts) a mensajes comprensibles para la persona usuaria.
 */

/** El servidor respondió con un código HTTP de error (400, 403, 404, 500…). */
export class ErrorApi extends Error {
  readonly estado: number
  /** Cuerpo de la respuesta ya interpretado como JSON (o texto si no lo era). */
  readonly cuerpo: unknown

  constructor(estado: number, cuerpo: unknown, mensaje?: string) {
    super(mensaje ?? `La API respondió con el código HTTP ${estado}`)
    this.name = 'ErrorApi'
    this.estado = estado
    this.cuerpo = cuerpo
  }
}

/** No hubo respuesta: sin internet, backend apagado o bloqueo del navegador. */
export class ErrorRed extends Error {
  constructor(mensaje = 'No se pudo conectar con el servidor') {
    super(mensaje)
    this.name = 'ErrorRed'
  }
}

/** Falta algo que el backend o el equipo aún no han definido (endpoint, código de dispositivo, etc.). */
export class ErrorContratoPendiente extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorContratoPendiente'
  }
}

export function esCancelacion(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
