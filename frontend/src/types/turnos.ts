import type { Estado } from './comun'

/* ------------------------------------------------------------------ */
/* Modelo que usa la interfaz (camelCase, booleanos reales)            */
/* ------------------------------------------------------------------ */

/** Día de la semana según la HU-01: 1 a 7. Se asume 1 = lunes … 7 = domingo (por confirmar con backend). */
export type NumeroDia = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface DiaTurno {
  dia: NumeroDia
  laborable: boolean
}

export interface Turno {
  id: number
  nombre: string
  /** Hora en formato 24 h "HH:mm". */
  horaEntrada: string
  horaSalida: string
  /** El turno termina al día siguiente (por ejemplo, 22:00 a 06:00). */
  cruzaMedianoche: boolean
  /** Minutos de tolerancia: de 0 a 120. */
  toleranciaMin: number
  /** Minutos de refrigerio: de 0 a 180. */
  refrigerioMin: number
  estado: Estado
  /** Puede ser null si el listado de la API no incluye los días (el detalle sí los incluye, CA-08). */
  dias: DiaTurno[] | null
  creadoEn: string | null
  actualizadoEn: string | null
}

/** Datos ya validados que se envían al crear o editar un turno. */
export interface DatosTurno {
  nombre: string
  horaEntrada: string
  horaSalida: string
  cruzaMedianoche: boolean
  toleranciaMin: number
  refrigerioMin: number
  diasLaborables: NumeroDia[]
}

/** Estado del formulario: los campos numéricos son texto porque así los entrega un <input>. */
export interface FormularioTurno {
  nombre: string
  horaEntrada: string
  horaSalida: string
  cruzaMedianoche: boolean
  toleranciaMin: string
  refrigerioMin: string
  diasLaborables: NumeroDia[]
}

export type CampoFormularioTurno = keyof FormularioTurno

export type ErroresFormularioTurno = Partial<Record<CampoFormularioTurno, string>>

export type FiltroEstadoTurno = Estado | 'todos'

/* ------------------------------------------------------------------ */
/* Contrato con la API (SUPUESTO: nombres propuestos, aún no definitivos) */
/* Si backend cambia un nombre, solo se corrige en services/api/mapeadores.ts */
/* ------------------------------------------------------------------ */

export interface TurnoDiaDto {
  dia: number
  laborable: 'S' | 'N'
}

export interface TurnoDto {
  id: number
  nombre: string
  /** "HH:MM" o "HH:MM:SS". */
  hora_entrada: string
  hora_salida: string
  cruza_medianoche: 'S' | 'N'
  tolerancia_min: number
  refrigerio_min: number
  estado: Estado
  dias?: TurnoDiaDto[]
  creado_en?: string | null
  actualizado_en?: string | null
}

/** Cuerpo de POST /turnos/ y PUT /turnos/{id}/. */
export interface TurnoEscrituraDto {
  nombre: string
  hora_entrada: string
  hora_salida: string
  cruza_medianoche: 'S' | 'N'
  tolerancia_min: number
  refrigerio_min: number
  dias: TurnoDiaDto[]
}
