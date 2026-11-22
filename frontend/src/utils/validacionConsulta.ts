import { esFechaIsoValida } from './fechas'

export interface ValoresFiltros {
  /** Texto: "" significa "todos los trabajadores". */
  trabajadorId: string
  desde: string
  hasta: string
}

export type ErroresFiltros = Partial<Record<keyof ValoresFiltros, string>>

/** Valida los filtros antes de pedir datos (HU-03, CA-03: faltante, inválida o desde > hasta responde 400). */
export function validarFiltros(valores: ValoresFiltros): ErroresFiltros {
  const errores: ErroresFiltros = {}

  if (!valores.desde) errores.desde = 'Indica la fecha inicial del rango.'
  else if (!esFechaIsoValida(valores.desde)) errores.desde = 'La fecha inicial no es válida.'

  if (!valores.hasta) errores.hasta = 'Indica la fecha final del rango.'
  else if (!esFechaIsoValida(valores.hasta)) errores.hasta = 'La fecha final no es válida.'

  if (!errores.desde && !errores.hasta && valores.desde > valores.hasta) {
    errores.hasta = 'La fecha final no puede ser anterior a la fecha inicial.'
  }

  if (valores.trabajadorId.trim() !== '' && !/^[1-9]\d*$/.test(valores.trabajadorId.trim())) {
    errores.trabajadorId = 'Escribe el ID del trabajador como un número entero positivo.'
  }

  return errores
}
