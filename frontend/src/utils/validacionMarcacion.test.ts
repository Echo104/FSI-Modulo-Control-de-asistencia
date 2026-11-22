import { describe, expect, it } from 'vitest'
import { MAX_OBSERVACION, validarObservacion } from './validacionMarcacion'

describe('validarObservacion', () => {
  it('acepta vacío y textos normales', () => {
    expect(validarObservacion('')).toBeUndefined()
    expect(validarObservacion('Llegué tarde por el tráfico.')).toBeUndefined()
  })

  it('CA-07: rechaza | / \\ y más de 200 caracteres', () => {
    expect(validarObservacion('a|b')).toMatch(/caracteres/)
    expect(validarObservacion('a/b')).toMatch(/caracteres/)
    expect(validarObservacion('a\\b')).toMatch(/caracteres/)
    expect(validarObservacion('x'.repeat(MAX_OBSERVACION))).toBeUndefined()
    expect(validarObservacion('x'.repeat(MAX_OBSERVACION + 1))).toMatch(/200/)
  })
})
