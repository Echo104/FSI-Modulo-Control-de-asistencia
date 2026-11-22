import type { Pagina, Trabajador } from '@/types/comun'
import type { Marcacion, MarcacionDto } from '@/types/marcaciones'
import type {
  DatosTurno,
  DiaTurno,
  NumeroDia,
  Turno,
  TurnoDiaDto,
  TurnoDto,
  TurnoEscrituraDto,
} from '@/types/turnos'
import { DIAS_SEMANA } from '@/utils/textos'

/**
 * Traduce entre el formato de la API (snake_case, 'S'/'N') y el que usa la interfaz (camelCase, booleanos).
 * Es el ÚNICO lugar que conoce los nombres de los campos de la API: si backend cambia un nombre,
 * solo se corrige aquí.
 */

function aBooleano(valor: unknown): boolean {
  return valor === 'S' || valor === true
}

function aSN(valor: boolean): 'S' | 'N' {
  return valor ? 'S' : 'N'
}

/** "08:00:00" -> "08:00". */
export function recortarHora(valor: string): string {
  const coincidencia = /^(\d{2}):(\d{2})/.exec(valor)
  return coincidencia ? `${coincidencia[1]}:${coincidencia[2]}` : valor
}

function aDias(dias: TurnoDiaDto[] | undefined): DiaTurno[] | null {
  if (!dias) return null
  return dias
    .filter((d) => d.dia_semana >= 1 && d.dia_semana <= 7)
    .map((d): DiaTurno => ({ dia: d.dia_semana as NumeroDia, laborable: aBooleano(d.laborable) }))
    .sort((a, b) => a.dia - b.dia)
}

export function aTurno(dto: TurnoDto): Turno {
  return {
    id: dto.id,
    nombre: dto.nombre,
    horaEntrada: recortarHora(dto.hora_entrada),
    horaSalida: recortarHora(dto.hora_salida),
    cruzaMedianoche: aBooleano(dto.cruza_medianoche),
    toleranciaMin: dto.tolerancia_min,
    refrigerioMin: dto.refrigerio_min,
    estado: dto.estado,
    dias: aDias(dto.dias),
    creadoEn: dto.creado_en ?? null,
    actualizadoEn: dto.actualizado_en ?? null,
  }
}

/** Se envían siempre los 7 días, con 'S' o 'N' (HU-01, CA-05). */
export function aTurnoEscrituraDto(datos: DatosTurno, empresaId: number): TurnoEscrituraDto {
  return {
    empresa_id: empresaId,
    nombre: datos.nombre,
    hora_entrada: datos.horaEntrada,
    hora_salida: datos.horaSalida,
    cruza_medianoche: aSN(datos.cruzaMedianoche),
    tolerancia_min: datos.toleranciaMin,
    refrigerio_min: datos.refrigerioMin,
    dias: DIAS_SEMANA.map(
      ({ numero }): TurnoDiaDto => ({ dia_semana: numero, laborable: aSN(datos.diasLaborables.includes(numero)) }),
    ),
  }
}

export function aMarcacion(dto: MarcacionDto): Marcacion {
  return {
    id: dto.id,
    tipo: dto.tipo_marcacion,
    fechaHoraUtc: dto.fecha_hora ?? '',
    trabajadorId: dto.trabajador,
    trabajadorNombre: dto.trabajador_nombre ?? null,
    dispositivo: dto.dispositivo ?? null,
    esManual: aBooleano(dto.es_manual),
    observacion: dto.observacion ?? null,
  }
}

export interface TrabajadorDto {
  id: number
  /** SUPUESTO: nombre del campo con el nombre completo (no está definido en las historias). */
  nombre_completo: string
}

export function aTrabajador(dto: TrabajadorDto): Trabajador {
  return { id: dto.id, nombre: dto.nombre_completo }
}

/** Acepta una lista simple o la forma paginada de DRF ({ results: [...] }). */
export function extraerLista<T>(datos: unknown): T[] {
  if (Array.isArray(datos)) return datos as T[]
  if (datos && typeof datos === 'object' && 'results' in datos && Array.isArray(datos.results)) {
    return datos.results as T[]
  }
  return []
}

/** Normaliza la respuesta paginada de DRF ({ count, next, previous, results }). */
export function aPagina<TDto, T>(datos: unknown, mapear: (dto: TDto) => T, pagina: number): Pagina<T> {
  if (Array.isArray(datos)) {
    return {
      total: datos.length,
      pagina: 1,
      resultados: (datos as TDto[]).map(mapear),
      hayAnterior: false,
      haySiguiente: false,
    }
  }

  const cuerpo = (datos ?? {}) as { count?: unknown; next?: unknown; previous?: unknown; results?: unknown }
  const resultados = Array.isArray(cuerpo.results) ? (cuerpo.results as TDto[]).map(mapear) : []
  return {
    total: typeof cuerpo.count === 'number' ? cuerpo.count : resultados.length,
    pagina,
    resultados,
    hayAnterior: Boolean(cuerpo.previous),
    haySiguiente: Boolean(cuerpo.next),
  }
}
