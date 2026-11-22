/**
 * Fechas y horas en la zona America/Lima.
 *
 * Regla del proyecto: el servidor guarda y devuelve instantes en UTC; la interfaz solo los convierte
 * a hora de Lima para mostrarlos. Nunca se genera una hora en el cliente para registrar una marcación.
 */

export const ZONA_LIMA = 'America/Lima'

const formatoFecha = new Intl.DateTimeFormat('es-PE', {
  timeZone: ZONA_LIMA,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const formatoHora = new Intl.DateTimeFormat('es-PE', {
  timeZone: ZONA_LIMA,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const formatoFechaLarga = new Intl.DateTimeFormat('es-PE', {
  timeZone: ZONA_LIMA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** "en-CA" entrega AAAA-MM-DD, el formato que usan los filtros y la API. */
const formatoIso = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_LIMA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export interface FechaHoraLima {
  /** 20/11/2026 */
  fecha: string
  /** 08:02:11 (24 horas) */
  hora: string
  /** Viernes 20 de noviembre de 2026 */
  fechaLarga: string
  /** 2026-11-20 */
  fechaIso: string
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** "Viernes 20 de noviembre de 2026". Se arma con las partes para que no cambie según el navegador. */
function formatearFechaLarga(instante: Date): string {
  const partes = Object.fromEntries(formatoFechaLarga.formatToParts(instante).map((p) => [p.type, p.value]))
  return capitalizar(`${partes.weekday} ${partes.day} de ${partes.month} de ${partes.year}`)
}

/**
 * Convierte un texto ISO a Date. Si el servidor enviara el instante sin zona (sin "Z" ni "+hh:mm"),
 * se interpreta como UTC: sin esta precaución JavaScript lo leería como hora local del navegador.
 */
export function interpretarInstante(iso: string): Date | null {
  const texto = iso.trim()
  if (!texto) return null
  const tieneZona = /(Z|[+-]\d{2}:?\d{2})$/i.test(texto)
  const fecha = new Date(tieneZona ? texto : `${texto}Z`)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

/** Devuelve null si el texto no es una fecha válida (la interfaz mostrará un guion). */
export function aFechaHoraLima(iso: string | null | undefined): FechaHoraLima | null {
  if (!iso) return null
  const instante = interpretarInstante(iso)
  if (!instante) return null
  return {
    fecha: formatoFecha.format(instante),
    hora: formatoHora.format(instante),
    fechaLarga: formatearFechaLarga(instante),
    fechaIso: formatoIso.format(instante),
  }
}

/** Fecha de hoy en Lima (AAAA-MM-DD). Solo se usa para sugerir rangos de consulta, no para marcar. */
export function hoyEnLima(ahora: Date = new Date()): string {
  return formatoIso.format(ahora)
}

function partesIso(fechaIso: string): [number, number, number] {
  const [anio = 0, mes = 1, dia = 1] = fechaIso.split('-').map(Number)
  return [anio, mes, dia]
}

/** Suma (o resta) días a una fecha AAAA-MM-DD sin depender de la zona horaria del navegador. */
export function sumarDias(fechaIso: string, dias: number): string {
  const [anio, mes, dia] = partesIso(fechaIso)
  const base = new Date(Date.UTC(anio, mes - 1, dia + dias))
  return base.toISOString().slice(0, 10)
}

export function primerDiaDelMes(fechaIso: string): string {
  const [anio, mes] = partesIso(fechaIso)
  return `${anio}-${String(mes).padStart(2, '0')}-01`
}

/** Comprueba el formato AAAA-MM-DD y que el día exista en el calendario. */
export function esFechaIsoValida(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false
  const [anio, mes, dia] = partesIso(texto)
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
}

/** "2026-11-20" -> "20/11/2026" (para mensajes). */
export function formatearFechaIso(fechaIso: string): string {
  const [anio, mes, dia] = partesIso(fechaIso)
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`
}
