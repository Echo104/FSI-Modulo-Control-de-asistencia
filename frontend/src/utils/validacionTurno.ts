import type {
  DatosTurno,
  ErroresFormularioTurno,
  FormularioTurno,
  NumeroDia,
  Turno,
} from '@/types/turnos'

/** Límites de la historia HU-01 (CA-04). El nombre máximo es un límite de la interfaz, por confirmar con backend. */
export const LIMITES_TURNO = {
  toleranciaMax: 120,
  refrigerioMax: 180,
  nombreMax: 100,
} as const

/** Caracteres que el nombre no admite (HU-01, CA-09). */
const CARACTERES_PROHIBIDOS = /[|/\\]/

export const formularioTurnoVacio: FormularioTurno = {
  nombre: '',
  horaEntrada: '',
  horaSalida: '',
  cruzaMedianoche: false,
  toleranciaMin: '0',
  refrigerioMin: '0',
  diasLaborables: [1, 2, 3, 4, 5],
}

export function formularioDesdeTurno(turno: Turno): FormularioTurno {
  return {
    nombre: turno.nombre,
    horaEntrada: turno.horaEntrada,
    horaSalida: turno.horaSalida,
    cruzaMedianoche: turno.cruzaMedianoche,
    toleranciaMin: String(turno.toleranciaMin),
    refrigerioMin: String(turno.refrigerioMin),
    diasLaborables: (turno.dias ?? []).filter((d) => d.laborable).map((d) => d.dia),
  }
}

function validarMinutos(texto: string, etiqueta: string, maximo: number): string | undefined {
  const valor = texto.trim()
  if (valor === '') return `Indica los minutos de ${etiqueta}. Escribe 0 si no aplica.`
  if (!/^\d+$/.test(valor)) return 'Escribe un número entero de minutos, sin decimales ni signos.'
  if (Number(valor) > maximo) return `Los minutos de ${etiqueta} deben estar entre 0 y ${maximo}.`
  return undefined
}

export interface ResultadoValidacionTurno {
  errores: ErroresFormularioTurno
  /** Solo existe cuando no hay errores. */
  datos: DatosTurno | null
}

/** Reglas que la interfaz comprueba antes de enviar. El servidor vuelve a validar todo (por ejemplo, nombre repetido). */
export function validarFormularioTurno(formulario: FormularioTurno): ResultadoValidacionTurno {
  const errores: ErroresFormularioTurno = {}
  const nombre = formulario.nombre.trim()

  if (nombre === '') {
    errores.nombre = 'Escribe el nombre del turno.'
  } else if (CARACTERES_PROHIBIDOS.test(nombre)) {
    errores.nombre = 'El nombre no puede contener los caracteres | / \\.'
  } else if (nombre.length > LIMITES_TURNO.nombreMax) {
    errores.nombre = `El nombre no puede superar los ${LIMITES_TURNO.nombreMax} caracteres.`
  }

  if (!formulario.horaEntrada) errores.horaEntrada = 'Indica la hora de entrada.'
  if (!formulario.horaSalida) errores.horaSalida = 'Indica la hora de salida.'

  if (formulario.horaEntrada && formulario.horaSalida) {
    // "HH:mm" se puede comparar como texto porque siempre tiene dos dígitos por parte.
    if (formulario.horaSalida < formulario.horaEntrada && !formulario.cruzaMedianoche) {
      errores.horaSalida =
        'La salida es anterior a la entrada. Si el turno termina al día siguiente, marca «El turno cruza la medianoche».'
    }
  }

  const errorTolerancia = validarMinutos(formulario.toleranciaMin, 'tolerancia', LIMITES_TURNO.toleranciaMax)
  if (errorTolerancia) errores.toleranciaMin = errorTolerancia

  const errorRefrigerio = validarMinutos(formulario.refrigerioMin, 'refrigerio', LIMITES_TURNO.refrigerioMax)
  if (errorRefrigerio) errores.refrigerioMin = errorRefrigerio

  if (formulario.diasLaborables.length === 0) {
    errores.diasLaborables = 'Selecciona al menos un día laborable.'
  }

  if (Object.keys(errores).length > 0) return { errores, datos: null }

  return {
    errores,
    datos: {
      nombre,
      horaEntrada: formulario.horaEntrada,
      horaSalida: formulario.horaSalida,
      cruzaMedianoche: formulario.cruzaMedianoche,
      toleranciaMin: Number(formulario.toleranciaMin),
      refrigerioMin: Number(formulario.refrigerioMin),
      diasLaborables: [...formulario.diasLaborables].sort((a, b) => a - b) as NumeroDia[],
    },
  }
}

/** Avisos que no bloquean el guardado pero conviene revisar. */
export function advertenciaHorarioTurno(formulario: FormularioTurno): string | null {
  const { horaEntrada, horaSalida, cruzaMedianoche } = formulario
  if (!horaEntrada || !horaSalida) return null
  if (horaSalida === horaEntrada) {
    return 'La salida es igual a la entrada: el turno duraría 0 horas o 24 horas. Revisa si es lo que buscas.'
  }
  if (cruzaMedianoche && horaSalida > horaEntrada) {
    return 'Marcaste que el turno cruza la medianoche, pero la salida es posterior a la entrada. Revisa si es correcto.'
  }
  return null
}

/** Orden en el que se enfoca el primer campo con error. */
export const ORDEN_CAMPOS_TURNO = [
  'nombre',
  'horaEntrada',
  'horaSalida',
  'toleranciaMin',
  'refrigerioMin',
  'diasLaborables',
] as const
