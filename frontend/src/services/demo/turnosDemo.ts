import type { TurnosServicio } from '../contratos'
import { ErrorApi } from '../http/errores'
import type { DatosTurno, DiaTurno, Turno } from '@/types/turnos'
import { LIMITES_TURNO } from '@/utils/validacionTurno'
import { DIAS_SEMANA } from '@/utils/textos'
import { datosDemo, siguienteId } from './estadoDemo'
import { simularRed } from './simularRed'

/**
 * Simula el servidor de turnos, incluidas las respuestas 400 con el formato de Django REST Framework,
 * para comprobar que la pantalla las muestra bien. Las reglas son las de la HU-01.
 */

function copiar(turno: Turno): Turno {
  return { ...turno, dias: turno.dias ? turno.dias.map((d) => ({ ...d })) : null }
}

function validarEnServidor(datos: DatosTurno, idActual?: number): Record<string, string[]> {
  const errores: Record<string, string[]> = {}
  const agregar = (campo: string, mensaje: string) => (errores[campo] ??= []).push(mensaje)

  const repetido = datosDemo().turnos.some(
    (t) => t.id !== idActual && t.nombre.trim().toLowerCase() === datos.nombre.trim().toLowerCase(),
  )
  if (repetido) agregar('nombre', 'Ya existe un turno con ese nombre en la empresa.')
  if (/[|/\\]/.test(datos.nombre)) agregar('nombre', 'El nombre no puede contener los caracteres | / \\.')
  if (datos.horaSalida < datos.horaEntrada && !datos.cruzaMedianoche) {
    agregar('hora_salida', 'La hora de salida es anterior a la de entrada y el turno no cruza la medianoche.')
  }
  if (datos.toleranciaMin < 0 || datos.toleranciaMin > LIMITES_TURNO.toleranciaMax) {
    agregar('tolerancia_min', 'La tolerancia debe estar entre 0 y 120 minutos.')
  }
  if (datos.refrigerioMin < 0 || datos.refrigerioMin > LIMITES_TURNO.refrigerioMax) {
    agregar('refrigerio_min', 'El refrigerio debe estar entre 0 y 180 minutos.')
  }
  return errores
}

function diasDesde(datos: DatosTurno): DiaTurno[] {
  return DIAS_SEMANA.map(({ numero }) => ({ dia: numero, laborable: datos.diasLaborables.includes(numero) }))
}

function noEncontrado(): ErrorApi {
  return new ErrorApi(404, { detail: 'No encontrado.' })
}

export const turnosDemo: TurnosServicio = {
  async listar(filtro, senal) {
    await simularRed(senal)
    return datosDemo()
      .turnos.filter((t) => filtro === 'todos' || t.estado === filtro)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map(copiar)
  },

  async obtener(id, senal) {
    await simularRed(senal)
    const turno = datosDemo().turnos.find((t) => t.id === id)
    if (!turno) throw noEncontrado()
    return copiar(turno)
  },

  async crear(datos) {
    await simularRed()
    const errores = validarEnServidor(datos)
    if (Object.keys(errores).length > 0) throw new ErrorApi(400, errores)

    const turno: Turno = {
      id: siguienteId('turnos'),
      nombre: datos.nombre,
      horaEntrada: datos.horaEntrada,
      horaSalida: datos.horaSalida,
      cruzaMedianoche: datos.cruzaMedianoche,
      toleranciaMin: datos.toleranciaMin,
      refrigerioMin: datos.refrigerioMin,
      estado: 'A',
      dias: diasDesde(datos),
      creadoEn: new Date().toISOString(),
      actualizadoEn: null,
    }
    datosDemo().turnos.push(turno)
    return copiar(turno)
  },

  async actualizar(id, datos) {
    await simularRed()
    const turno = datosDemo().turnos.find((t) => t.id === id)
    if (!turno) throw noEncontrado()

    const errores = validarEnServidor(datos, id)
    if (Object.keys(errores).length > 0) throw new ErrorApi(400, errores)

    Object.assign(turno, {
      nombre: datos.nombre,
      horaEntrada: datos.horaEntrada,
      horaSalida: datos.horaSalida,
      cruzaMedianoche: datos.cruzaMedianoche,
      toleranciaMin: datos.toleranciaMin,
      refrigerioMin: datos.refrigerioMin,
      dias: diasDesde(datos),
      actualizadoEn: new Date().toISOString(),
    })
    return copiar(turno)
  },

  async darDeBaja(id) {
    await simularRed()
    const turno = datosDemo().turnos.find((t) => t.id === id)
    if (!turno) throw noEncontrado()
    turno.estado = 'I'
    turno.actualizadoEn = new Date().toISOString()
  },
}
