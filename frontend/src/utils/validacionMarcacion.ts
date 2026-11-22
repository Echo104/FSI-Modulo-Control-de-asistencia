/** Reglas de la observación de una marcación (HU-02, CA-07): máximo 200 caracteres y sin | / \ */
export const MAX_OBSERVACION = 200

const CARACTERES_PROHIBIDOS = /[|/\\]/

export function validarObservacion(texto: string): string | undefined {
  const valor = texto.trim()
  if (valor.length > MAX_OBSERVACION) {
    return `La observación no puede superar los ${MAX_OBSERVACION} caracteres (tiene ${valor.length}).`
  }
  if (CARACTERES_PROHIBIDOS.test(valor)) {
    return 'La observación no puede contener los caracteres | / \\.'
  }
  return undefined
}
