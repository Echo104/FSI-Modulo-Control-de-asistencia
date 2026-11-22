import { afterEach, describe, expect, it, vi } from 'vitest'
import { construirUrl, solicitar } from './clienteHttp'
import { ErrorApi, ErrorRed } from './errores'

afterEach(() => vi.unstubAllGlobals())

function respuesta(estado: number, cuerpo: unknown): Response {
  return new Response(cuerpo === null ? '' : JSON.stringify(cuerpo), { status: estado })
}

describe('construirUrl', () => {
  it('agrega la ruta base y omite parámetros vacíos', () => {
    expect(construirUrl('/marcaciones/', { desde: '2026-11-01', trabajador_id: undefined, hasta: '', page: 2 })).toBe(
      '/api/asistencia/marcaciones/?desde=2026-11-01&page=2',
    )
  })
})

describe('solicitar', () => {
  it('devuelve el JSON de una respuesta correcta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(200, { ok: true })))
    await expect(solicitar('/turnos/')).resolves.toEqual({ ok: true })
  })

  it('acepta respuestas sin cuerpo (204)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    await expect(solicitar('/turnos/1/', { metodo: 'DELETE' })).resolves.toBeNull()
  })

  it('convierte un HTTP 400 en ErrorApi con el cuerpo del servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(400, { nombre: ['Repetido'] })))
    await expect(solicitar('/turnos/', { metodo: 'POST', cuerpo: {} })).rejects.toMatchObject({
      name: 'ErrorApi',
      estado: 400,
      cuerpo: { nombre: ['Repetido'] },
    })
  })

  it('convierte un fallo de red en ErrorRed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(solicitar('/turnos/')).rejects.toBeInstanceOf(ErrorRed)
  })

  it('no confunde una cancelación con un error de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('cancelado', 'AbortError')))
    await expect(solicitar('/turnos/')).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('un cuerpo que no es JSON no rompe el manejo de errores', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 })))
    const error = await solicitar('/turnos/').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorApi)
    expect((error as ErrorApi).estado).toBe(502)
  })
})
