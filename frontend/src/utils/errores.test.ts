import { describe, expect, it } from 'vitest'
import { ErrorApi, ErrorContratoPendiente, ErrorRed } from '@/services/http/errores'
import { aplanarErrores, describirError } from './errores'

describe('aplanarErrores', () => {
  it('separa mensajes generales y por campo (formato de Django REST Framework)', () => {
    expect(
      aplanarErrores({
        nombre: ['Ya existe un turno con ese nombre.'],
        non_field_errors: ['Revisa los horarios.'],
        detail: 'Datos inválidos.',
      }),
    ).toEqual({
      '': ['Revisa los horarios.', 'Datos inválidos.'],
      nombre: ['Ya existe un turno con ese nombre.'],
    })
  })

  it('conserva el campo de primer nivel en errores anidados', () => {
    expect(aplanarErrores({ dias: [{}, { dia: ['Día repetido.'] }] })).toEqual({ dias: ['Día repetido.'] })
  })

  it('acepta un texto o una lista como cuerpo', () => {
    expect(aplanarErrores('Algo falló')).toEqual({ '': ['Algo falló'] })
    expect(aplanarErrores(['Uno', 'Dos'])).toEqual({ '': ['Uno', 'Dos'] })
    expect(aplanarErrores(null)).toEqual({})
  })
})

describe('describirError', () => {
  it('HTTP 400: muestra los mensajes del servidor y el código', () => {
    const error = describirError(new ErrorApi(400, { observacion: ['Texto demasiado largo.'] }), 'registrar la marcación', {
      etiquetasCampo: { observacion: 'Observación' },
    })
    expect(error.titulo).toBe('No se pudo registrar la marcación')
    expect(error.codigo).toBe('Error 400')
    expect(error.estado).toBe(400)
    expect(error.mensajes).toEqual(['Observación: Texto demasiado largo.'])
    expect(error.porCampo).toEqual({ observacion: ['Texto demasiado largo.'] })
    expect(error.reintentable).toBe(false)
  })

  it('HTTP 400 sin detalle usa un mensaje genérico en español', () => {
    expect(describirError(new ErrorApi(400, null), 'guardar').mensajes[0]).toMatch(/rechazó los datos/)
  })

  it('traduce 403, 404 y 5xx sin mostrar texto en inglés del servidor', () => {
    expect(describirError(new ErrorApi(403, { detail: 'You do not have permission.' }), 'consultar').mensajes[0]).toMatch(/permiso/)
    expect(describirError(new ErrorApi(404, { detail: 'Not found.' }), 'consultar').mensajes[0]).toMatch(/No se encontró/)
    const servidor = describirError(new ErrorApi(500, 'Internal Server Error'), 'consultar')
    expect(servidor.mensajes[0]).toMatch(/problema/)
    expect(servidor.reintentable).toBe(true)
  })

  it('permite mensajes propios por código', () => {
    const error = describirError(new ErrorApi(403, {}), 'consultar', { mensajesPorEstado: { 403: 'Mensaje propio.' } })
    expect(error.mensajes).toEqual(['Mensaje propio.'])
  })

  it('distingue falta de conexión y configuración pendiente', () => {
    expect(describirError(new ErrorRed(), 'cargar')).toMatchObject({ codigo: 'Sin conexión', reintentable: true })
    expect(describirError(new ErrorContratoPendiente('Falta X'), 'cargar')).toMatchObject({
      codigo: 'Configuración pendiente',
      mensajes: ['Falta X'],
      reintentable: false,
    })
  })

  it('un error desconocido no rompe la pantalla', () => {
    expect(describirError(new Error('boom'), 'cargar').mensajes[0]).toMatch(/inesperado/)
  })
})
