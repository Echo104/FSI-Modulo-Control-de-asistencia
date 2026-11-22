import type { TipoMarcacion } from '@/types/marcaciones'
import type { NumeroDia } from '@/types/turnos'

export const DIAS_SEMANA: ReadonlyArray<{ numero: NumeroDia; corto: string; largo: string }> = [
  { numero: 1, corto: 'Lun', largo: 'Lunes' },
  { numero: 2, corto: 'Mar', largo: 'Martes' },
  { numero: 3, corto: 'Mié', largo: 'Miércoles' },
  { numero: 4, corto: 'Jue', largo: 'Jueves' },
  { numero: 5, corto: 'Vie', largo: 'Viernes' },
  { numero: 6, corto: 'Sáb', largo: 'Sábado' },
  { numero: 7, corto: 'Dom', largo: 'Domingo' },
]

export interface TextosTipoMarcacion {
  /** Nombre del tipo en tablas y etiquetas: "Entrada". */
  nombre: string
  /** Texto del botón de la pantalla Marcar. */
  boton: string
  /** Frase para completar "Se registrará …" en la confirmación. */
  enConfirmacion: string
  descripcion: string
}

export const TIPOS_MARCACION: Record<TipoMarcacion, TextosTipoMarcacion> = {
  ENT: {
    nombre: 'Entrada',
    boton: 'Marcar entrada',
    enConfirmacion: 'tu entrada',
    descripcion: 'Registra el inicio de tu jornada.',
  },
  SAL: {
    nombre: 'Salida',
    boton: 'Marcar salida',
    enConfirmacion: 'tu salida',
    descripcion: 'Registra el fin de tu jornada.',
  },
  IRF: {
    nombre: 'Inicio de refrigerio',
    boton: 'Iniciar refrigerio',
    enConfirmacion: 'el inicio de tu refrigerio',
    descripcion: 'Registra que empiezas tu refrigerio.',
  },
  FRF: {
    nombre: 'Fin de refrigerio',
    boton: 'Finalizar refrigerio',
    enConfirmacion: 'el fin de tu refrigerio',
    descripcion: 'Registra que terminas tu refrigerio.',
  },
}

export function nombreTipoMarcacion(tipo: string): string {
  return tipo in TIPOS_MARCACION ? TIPOS_MARCACION[tipo as TipoMarcacion].nombre : tipo
}

/** Texto de singular/plural: pluralizar(1, 'marcación', 'marcaciones'). */
export function pluralizar(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`
}
