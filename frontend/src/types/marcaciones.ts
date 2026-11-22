/** Tipos de marcación del catálogo `tipo_marcacion` (HU-02, CA-05). */
export type TipoMarcacion = 'ENT' | 'SAL' | 'IRF' | 'FRF'

export interface Marcacion {
  id: number
  tipo: TipoMarcacion
  /** Instante en UTC tal como lo devuelve el servidor. Se convierte a hora de Lima solo para mostrarlo. */
  fechaHoraUtc: string
  trabajadorId: number
  trabajadorNombre: string | null
  /** Código del dispositivo con el que se registró (por ejemplo, el web). */
  dispositivo: string | null
  esManual: boolean
  observacion: string | null
}

/** Lo único que decide la persona al marcar. La hora NUNCA se envía: la fija el servidor (HU-02, CA-02). */
export interface NuevaMarcacion {
  tipo: TipoMarcacion
  observacion?: string
}

export interface ConsultaMarcaciones {
  /** Solo lo usa RR. HH.; si se omite, la API decide qué devuelve según el rol. */
  trabajadorId?: number
  /** Fecha en formato AAAA-MM-DD, interpretada por el servidor en hora de Lima. */
  desde: string
  hasta: string
  pagina: number
}

/* ------------------------------------------------------------------ */
/* Contrato con la API (SUPUESTO: nombres propuestos, aún no definitivos) */
/* ------------------------------------------------------------------ */

export interface MarcacionDto {
  id: number
  /** Id del trabajador. */
  trabajador: number
  /** Nombre para mostrar; no está definido en las historias (ver docs/CONTRATOS_PENDIENTES.md). */
  trabajador_nombre?: string | null
  tipo_marcacion: TipoMarcacion
  /** Instante generado por el servidor (UTC). */
  fecha_hora: string
  dispositivo?: string | null
  es_manual: 'S' | 'N'
  observacion?: string | null
}

/** Cuerpo de POST /marcaciones/. No incluye fecha_hora a propósito. */
export interface MarcacionCrearDto {
  trabajador: number
  tipo_marcacion: TipoMarcacion
  dispositivo: string
  observacion?: string
}

/** Forma paginada habitual de Django REST Framework. */
export interface PaginaDto<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
