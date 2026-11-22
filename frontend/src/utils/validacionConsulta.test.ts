import { describe, expect, it } from 'vitest'
import { validarFiltros } from './validacionConsulta'

describe('validarFiltros', () => {
  it('acepta un rango válido, incluso de un solo día', () => {
    expect(validarFiltros({ trabajadorId: '', desde: '2026-11-14', hasta: '2026-11-20' })).toEqual({})
    expect(validarFiltros({ trabajadorId: '', desde: '2026-11-20', hasta: '2026-11-20' })).toEqual({})
  })

  it('exige las dos fechas', () => {
    const errores = validarFiltros({ trabajadorId: '', desde: '', hasta: '' })
    expect(errores.desde).toBeDefined()
    expect(errores.hasta).toBeDefined()
  })

  it('rechaza fechas inexistentes y rangos invertidos', () => {
    expect(validarFiltros({ trabajadorId: '', desde: '2026-02-30', hasta: '2026-03-01' }).desde).toMatch(/no es válida/)
    expect(validarFiltros({ trabajadorId: '', desde: '2026-11-20', hasta: '2026-11-14' }).hasta).toMatch(/anterior/)
  })

  it('valida el ID de trabajador cuando se escribe a mano', () => {
    expect(validarFiltros({ trabajadorId: '12', desde: '2026-11-14', hasta: '2026-11-20' }).trabajadorId).toBeUndefined()
    expect(validarFiltros({ trabajadorId: 'abc', desde: '2026-11-14', hasta: '2026-11-20' }).trabajadorId).toBeDefined()
    expect(validarFiltros({ trabajadorId: '0', desde: '2026-11-14', hasta: '2026-11-20' }).trabajadorId).toBeDefined()
  })
})
