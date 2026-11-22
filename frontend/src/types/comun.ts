/** 'A' = activo, 'I' = inactivo (baja lógica), tal como lo describe la historia HU-01. */
export type Estado = 'A' | 'I'

/** Resultado paginado ya normalizado para la interfaz (ver services/api/mapeadores.ts). */
export interface Pagina<T> {
  /** Cantidad total de registros que cumplen el filtro. */
  total: number
  /** Número de página actual, empezando en 1. */
  pagina: number
  resultados: T[]
  hayAnterior: boolean
  haySiguiente: boolean
}

export interface Trabajador {
  id: number
  nombre: string
}

/** Quién está usando la pantalla y qué puede hacer. */
export interface PerfilSesion {
  trabajadorId: number
  nombre: string
  /** Personal de RR. HH.: puede consultar las marcaciones de cualquier trabajador de su empresa. */
  esRrhh: boolean
}
