import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * La configuración se lee al importar el módulo, así que cada prueba lo importa de nuevo
 * después de definir las variables de entorno que necesita.
 */
async function cargarServicio(codigoDispositivo: string) {
  vi.resetModules()
  vi.stubEnv('VITE_CODIGO_DISPOSITIVO_WEB', codigoDispositivo)
  return (await import('./marcacionesApi')).marcacionesApi
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ id: 9, trabajador: 4, tipo_marcacion: 'ENT', fecha_hora: '2026-11-20T13:02:11Z', es_manual: 'N' }),
        { status: 201 },
      ),
    ),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('marcacionesApi.registrar', () => {
  it('HU-02 CA-02: no envía ninguna fecha ni hora, solo trabajador, tipo y dispositivo', async () => {
    const servicio = await cargarServicio('DISP-TEST')
    await servicio.registrar(4, { tipo: 'ENT' })

    const llamada = vi.mocked(fetch).mock.calls[0]
    expect(llamada?.[0]).toBe('/api/asistencia/marcaciones/')
    const cuerpo = JSON.parse(String(llamada?.[1]?.body)) as Record<string, unknown>
    expect(cuerpo).toEqual({ trabajador: 4, tipo_marcacion: 'ENT', dispositivo: 'DISP-TEST' })
    expect(Object.keys(cuerpo).some((clave) => /fecha|hora|time/i.test(clave))).toBe(false)
  })

  it('devuelve la hora que fijó el servidor, sin modificarla', async () => {
    const servicio = await cargarServicio('DISP-TEST')
    const marcacion = await servicio.registrar(4, { tipo: 'ENT' })
    expect(marcacion.fechaHoraUtc).toBe('2026-11-20T13:02:11Z')
  })

  it('incluye la observación solo si tiene contenido', async () => {
    const servicio = await cargarServicio('DISP-TEST')
    await servicio.registrar(4, { tipo: 'SAL', observacion: '  Salida anticipada  ' })
    const cuerpo = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body)) as Record<string, unknown>
    expect(cuerpo.observacion).toBe('Salida anticipada')
  })

  it('sin código de dispositivo configurado falla con un mensaje claro y no llama a la red', async () => {
    const servicio = await cargarServicio('')
    await expect(servicio.registrar(4, { tipo: 'ENT' })).rejects.toMatchObject({
      name: 'ErrorContratoPendiente',
      message: expect.stringContaining('VITE_CODIGO_DISPOSITIVO_WEB'),
    })
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('marcacionesApi.consultar', () => {
  it('envía los filtros con los nombres de parámetro propuestos en HU-03', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] })))
    const servicio = await cargarServicio('DISP-TEST')
    const pagina = await servicio.consultar({ trabajadorId: 3, desde: '2026-11-01', hasta: '2026-11-20', pagina: 2 })
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
      '/api/asistencia/marcaciones/?trabajador_id=3&desde=2026-11-01&hasta=2026-11-20&page=2',
    )
    expect(pagina).toMatchObject({ total: 0, pagina: 2, resultados: [] })
  })
})
