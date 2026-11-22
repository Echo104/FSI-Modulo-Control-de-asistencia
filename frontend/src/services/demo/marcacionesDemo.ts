import type { MarcacionesServicio } from '../contratos'
import { ErrorApi } from '../http/errores'
import type { Marcacion } from '@/types/marcaciones'
import { aFechaHoraLima, esFechaIsoValida, interpretarInstante } from '@/utils/fechas'
import { nombreTipoMarcacion } from '@/utils/textos'
import { validarObservacion } from '@/utils/validacionMarcacion'
import { VENTANA_ANTIDUPLICADO_SEGUNDOS } from './datosDemo'
import { datosDemo, nombreTrabajadorDemo, perfilDemoActual, siguienteId } from './estadoDemo'
import { simularRed } from './simularRed'

/** Tamaño de página del servidor demo, pensado para que la paginación se pueda evaluar. */
export const TAMANO_PAGINA_DEMO = 8

/**
 * Simula el servidor de marcaciones. IMPORTANTE: en modo demostración esta clase hace el papel del servidor,
 * por eso es el único lugar del proyecto que genera una hora de marcación. El código real (services/api)
 * jamás envía ni calcula la hora: la recibe en la respuesta.
 */
export const marcacionesDemo: MarcacionesServicio = {
  async registrar(trabajadorId, datos) {
    await simularRed()

    const errores: Record<string, string[]> = {}
    if (!datosDemo().trabajadores.some((t) => t.id === trabajadorId)) {
      errores.trabajador = ['El trabajador no es válido.']
    }
    const observacion = datos.observacion?.trim() ?? ''
    const errorObservacion = observacion ? validarObservacion(observacion) : undefined
    if (errorObservacion) errores.observacion = [errorObservacion]
    if (Object.keys(errores).length > 0) throw new ErrorApi(400, errores)

    const ahora = new Date()
    const repetida = datosDemo().marcaciones.some((m) => {
      if (m.trabajadorId !== trabajadorId || m.tipo !== datos.tipo) return false
      const instante = interpretarInstante(m.fechaHoraUtc)
      if (!instante) return false
      const transcurrido = ahora.getTime() - instante.getTime()
      return transcurrido >= 0 && transcurrido < VENTANA_ANTIDUPLICADO_SEGUNDOS * 1000
    })
    if (repetida) {
      throw new ErrorApi(400, {
        non_field_errors: [
          `Ya existe una marcación de «${nombreTipoMarcacion(datos.tipo)}» registrada hace menos de ${VENTANA_ANTIDUPLICADO_SEGUNDOS} segundos. Espera un momento antes de volver a marcar.`,
        ],
      })
    }

    const marcacion: Marcacion = {
      id: siguienteId('marcaciones'),
      tipo: datos.tipo,
      fechaHoraUtc: ahora.toISOString(),
      trabajadorId,
      trabajadorNombre: nombreTrabajadorDemo(trabajadorId),
      dispositivo: 'WEB-01',
      esManual: false,
      observacion: observacion || null,
    }
    datosDemo().marcaciones.push(marcacion)
    return { ...marcacion }
  },

  async consultar({ trabajadorId, desde, hasta, pagina }, senal) {
    await simularRed(senal)
    const perfil = perfilDemoActual()
    const { trabajadores, marcaciones } = datosDemo()

    if (!desde || !hasta) {
      throw new ErrorApi(400, { non_field_errors: ['Indica las fechas «desde» y «hasta».'] })
    }
    if (!esFechaIsoValida(desde) || !esFechaIsoValida(hasta)) {
      throw new ErrorApi(400, { non_field_errors: ['Una de las fechas no es válida. Usa el formato AAAA-MM-DD.'] })
    }
    if (desde > hasta) {
      throw new ErrorApi(400, { non_field_errors: ['La fecha «desde» no puede ser posterior a la fecha «hasta».'] })
    }
    if (trabajadorId !== undefined && !trabajadores.some((t) => t.id === trabajadorId)) {
      throw new ErrorApi(404, { detail: 'No encontrado.' })
    }
    if (!perfil.esRrhh && trabajadorId !== undefined && trabajadorId !== perfil.trabajadorId) {
      throw new ErrorApi(403, { detail: 'No tienes permiso para consultar a otro trabajador.' })
    }

    // Quien no es de RR. HH. solo ve sus propias marcaciones.
    const objetivo = perfil.esRrhh ? trabajadorId : perfil.trabajadorId

    // El rango es inclusivo y se interpreta en hora de Lima (HU-03, CA-02).
    const filtradas = marcaciones
      .filter((m) => objetivo === undefined || m.trabajadorId === objetivo)
      .filter((m) => {
        const fechaLima = aFechaHoraLima(m.fechaHoraUtc)?.fechaIso
        return fechaLima !== undefined && fechaLima >= desde && fechaLima <= hasta
      })
      .sort((a, b) => a.fechaHoraUtc.localeCompare(b.fechaHoraUtc) || a.id - b.id)

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / TAMANO_PAGINA_DEMO))
    const actual = Math.min(Math.max(1, pagina), totalPaginas)
    const inicio = (actual - 1) * TAMANO_PAGINA_DEMO

    return {
      total: filtradas.length,
      pagina: actual,
      resultados: filtradas.slice(inicio, inicio + TAMANO_PAGINA_DEMO).map((m) => ({ ...m })),
      hayAnterior: actual > 1,
      haySiguiente: actual < totalPaginas,
    }
  },
}
