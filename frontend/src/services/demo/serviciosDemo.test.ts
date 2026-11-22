import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorApi } from '../http/errores'
import type { Marcacion } from '@/types/marcaciones'
import { datosDemo, fijarPerfilDemo, restablecerDatosDemo, armarFalloDemo } from './estadoDemo'
import { marcacionesDemo, TAMANO_PAGINA_DEMO } from './marcacionesDemo'
import { turnosDemo } from './turnosDemo'

/** Los servicios demo simulan la latencia con temporizadores; aquí se adelantan para no esperar. */
async function ejecutar<T>(promesa: Promise<T>): Promise<T> {
  const resultado = promesa.then(
    (valor) => ({ valor }),
    (error: unknown) => ({ error }),
  )
  await vi.advanceTimersByTimeAsync(1000)
  const final = await resultado
  if ('error' in final) throw final.error
  return final.valor
}

beforeEach(() => {
  vi.useFakeTimers()
  restablecerDatosDemo()
  fijarPerfilDemo('rrhh')
})

afterEach(() => vi.useRealTimers())

describe('turnosDemo', () => {
  const nuevo = {
    nombre: 'Turno de prueba',
    horaEntrada: '09:00',
    horaSalida: '18:00',
    cruzaMedianoche: false,
    toleranciaMin: 5,
    refrigerioMin: 30,
    diasLaborables: [1, 2, 3] as (1 | 2 | 3)[],
  }

  it('lista solo los activos por defecto y los inactivos aparte', async () => {
    const activos = await ejecutar(turnosDemo.listar('A'))
    const inactivos = await ejecutar(turnosDemo.listar('I'))
    expect(activos.every((t) => t.estado === 'A')).toBe(true)
    expect(inactivos.length).toBeGreaterThan(0)
    expect(inactivos.every((t) => t.estado === 'I')).toBe(true)
  })

  it('CA-01 y CA-05: crea un turno activo con sus siete días', async () => {
    const turno = await ejecutar(turnosDemo.crear(nuevo))
    expect(turno.estado).toBe('A')
    expect(turno.dias).toHaveLength(7)
    expect(turno.dias?.filter((d) => d.laborable).map((d) => d.dia)).toEqual([1, 2, 3])
  })

  it('CA-02: un nombre repetido responde 400 asociado al campo nombre', async () => {
    const error = await ejecutar(turnosDemo.crear({ ...nuevo, nombre: 'administrativo DIURNO' })).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorApi)
    expect((error as ErrorApi).estado).toBe(400)
    expect((error as ErrorApi).cuerpo).toHaveProperty('nombre')
  })

  it('CA-06: editar conserva el id y permite conservar el propio nombre', async () => {
    const creado = await ejecutar(turnosDemo.crear(nuevo))
    const editado = await ejecutar(turnosDemo.actualizar(creado.id, { ...nuevo, toleranciaMin: 20 }))
    expect(editado.id).toBe(creado.id)
    expect(editado.toleranciaMin).toBe(20)
    expect(editado.actualizadoEn).not.toBeNull()
  })

  it('CA-07: la baja es lógica; el turno deja de listarse como activo pero no se borra', async () => {
    const creado = await ejecutar(turnosDemo.crear(nuevo))
    await ejecutar(turnosDemo.darDeBaja(creado.id))
    expect((await ejecutar(turnosDemo.listar('A'))).some((t) => t.id === creado.id)).toBe(false)
    expect((await ejecutar(turnosDemo.obtener(creado.id))).estado).toBe('I')
  })

  it('un turno que no existe responde 404', async () => {
    await expect(ejecutar(turnosDemo.obtener(9999))).rejects.toMatchObject({ estado: 404 })
  })
})

describe('marcacionesDemo.registrar', () => {
  it('devuelve una marcación con la hora fijada por el servicio (UTC) y no manual', async () => {
    const marcacion = await ejecutar(marcacionesDemo.registrar(1, { tipo: 'ENT' }))
    expect(marcacion.fechaHoraUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(marcacion.esManual).toBe(false)
  })

  it('CA-04: una segunda marcación del mismo tipo dentro de la ventana responde 400', async () => {
    await ejecutar(marcacionesDemo.registrar(1, { tipo: 'ENT' }))
    const error = await ejecutar(marcacionesDemo.registrar(1, { tipo: 'ENT' })).catch((e: unknown) => e)
    expect((error as ErrorApi).estado).toBe(400)
    // Un tipo distinto sí se acepta.
    await expect(ejecutar(marcacionesDemo.registrar(1, { tipo: 'IRF' }))).resolves.toMatchObject({ tipo: 'IRF' })
  })

  it('CA-07: la observación con caracteres prohibidos responde 400', async () => {
    const error = await ejecutar(marcacionesDemo.registrar(1, { tipo: 'SAL', observacion: 'a|b' })).catch((e: unknown) => e)
    expect((error as ErrorApi).estado).toBe(400)
    expect((error as ErrorApi).cuerpo).toHaveProperty('observacion')
  })

  it('un fallo armado desde el banner afecta solo a la siguiente petición', async () => {
    armarFalloDemo('servidor')
    await expect(ejecutar(turnosDemo.listar('A'))).rejects.toMatchObject({ estado: 500 })
    await expect(ejecutar(turnosDemo.listar('A'))).resolves.toBeInstanceOf(Array)
  })
})

describe('marcacionesDemo.consultar', () => {
  function sembrar(fechaHoraUtc: string, trabajadorId = 6): void {
    const marcacion: Marcacion = {
      id: 99999,
      tipo: 'SAL',
      fechaHoraUtc,
      trabajadorId,
      trabajadorNombre: 'Carla Mendoza Vera',
      dispositivo: 'WEB-01',
      esManual: false,
      observacion: null,
    }
    datosDemo().marcaciones.push(marcacion)
  }

  it('CA-02: el rango es inclusivo y se interpreta en hora de Lima', async () => {
    // 23:30 del 20 de noviembre en Lima = 04:30 UTC del 21.
    sembrar('2026-11-21T04:30:00.000Z')
    const dia20 = await ejecutar(marcacionesDemo.consultar({ trabajadorId: 6, desde: '2026-11-20', hasta: '2026-11-20', pagina: 1 }))
    const dia21 = await ejecutar(marcacionesDemo.consultar({ trabajadorId: 6, desde: '2026-11-21', hasta: '2026-11-21', pagina: 1 }))
    expect(dia20.resultados.some((m) => m.id === 99999)).toBe(true)
    expect(dia21.resultados.some((m) => m.id === 99999)).toBe(false)
  })

  it('CA-01 y CA-06: ordena de forma ascendente y pagina', async () => {
    const primera = await ejecutar(marcacionesDemo.consultar({ desde: '2000-01-01', hasta: '2100-01-01', pagina: 1 }))
    expect(primera.resultados).toHaveLength(TAMANO_PAGINA_DEMO)
    expect(primera.haySiguiente).toBe(true)
    expect(primera.hayAnterior).toBe(false)
    const fechas = primera.resultados.map((m) => m.fechaHoraUtc)
    expect(fechas).toEqual([...fechas].sort())

    const segunda = await ejecutar(marcacionesDemo.consultar({ desde: '2000-01-01', hasta: '2100-01-01', pagina: 2 }))
    expect(segunda.hayAnterior).toBe(true)
    expect(segunda.resultados[0]?.id).not.toBe(primera.resultados[0]?.id)
  })

  it('CA-03: fechas faltantes, inválidas o invertidas responden 400', async () => {
    for (const rango of [
      { desde: '', hasta: '2026-11-20' },
      { desde: '2026-02-30', hasta: '2026-11-20' },
      { desde: '2026-11-20', hasta: '2026-11-01' },
    ]) {
      await expect(ejecutar(marcacionesDemo.consultar({ ...rango, pagina: 1 }))).rejects.toMatchObject({ estado: 400 })
    }
  })

  it('CA-04: un rango sin marcaciones responde 200 con lista vacía', async () => {
    const vacio = await ejecutar(marcacionesDemo.consultar({ desde: '2000-01-01', hasta: '2000-01-02', pagina: 1 }))
    expect(vacio).toMatchObject({ total: 0, resultados: [], haySiguiente: false })
  })

  it('CA-05: un trabajador inexistente responde 404', async () => {
    await expect(
      ejecutar(marcacionesDemo.consultar({ trabajadorId: 777, desde: '2026-11-01', hasta: '2026-11-20', pagina: 1 })),
    ).rejects.toMatchObject({ estado: 404 })
  })

  it('CA-07: quien no es de RR. HH. recibe 403 al consultar a otro y solo ve las suyas', async () => {
    fijarPerfilDemo('trabajador') // Rosa Quispe Huamán, id 1
    await expect(
      ejecutar(marcacionesDemo.consultar({ trabajadorId: 2, desde: '2000-01-01', hasta: '2100-01-01', pagina: 1 })),
    ).rejects.toMatchObject({ estado: 403 })

    const propias = await ejecutar(marcacionesDemo.consultar({ desde: '2000-01-01', hasta: '2100-01-01', pagina: 1 }))
    expect(propias.resultados.length).toBeGreaterThan(0)
    expect(propias.resultados.every((m) => m.trabajadorId === 1)).toBe(true)
  })

  it('los datos de demostración incluyen marcaciones manuales para evaluar la columna «Manual»', async () => {
    expect(datosDemo().marcaciones.some((m) => m.esManual)).toBe(true)
  })
})
