import { describe, expect, it } from 'vitest'
import {
  aFechaHoraLima,
  esFechaIsoValida,
  formatearFechaIso,
  hoyEnLima,
  interpretarInstante,
  primerDiaDelMes,
  sumarDias,
} from './fechas'

describe('aFechaHoraLima', () => {
  it('convierte un instante UTC a hora de Lima (UTC-5)', () => {
    const lima = aFechaHoraLima('2026-11-21T03:30:00Z')
    expect(lima?.hora).toBe('22:30:00')
    expect(lima?.fecha).toBe('20/11/2026')
    expect(lima?.fechaIso).toBe('2026-11-20')
  })

  it('respeta el límite de medianoche en Lima', () => {
    expect(aFechaHoraLima('2026-11-21T04:59:59Z')).toMatchObject({ hora: '23:59:59', fechaIso: '2026-11-20' })
    expect(aFechaHoraLima('2026-11-21T05:00:00Z')).toMatchObject({ hora: '00:00:00', fechaIso: '2026-11-21' })
  })

  it('entiende instantes con desplazamiento horario', () => {
    expect(aFechaHoraLima('2026-11-20T08:02:11-05:00')?.hora).toBe('08:02:11')
  })

  it('trata como UTC un instante sin zona, en lugar de usar la zona del navegador', () => {
    expect(aFechaHoraLima('2026-11-21T03:30:00')?.hora).toBe('22:30:00')
  })

  it('escribe la fecha larga en español', () => {
    expect(aFechaHoraLima('2026-11-20T15:00:00Z')?.fechaLarga).toBe('Viernes 20 de noviembre de 2026')
  })

  it('devuelve null si el texto no es una fecha', () => {
    expect(aFechaHoraLima('no es una fecha')).toBeNull()
    expect(aFechaHoraLima('')).toBeNull()
    expect(aFechaHoraLima(null)).toBeNull()
  })
})

describe('interpretarInstante', () => {
  it('devuelve null con texto vacío o inválido', () => {
    expect(interpretarInstante('   ')).toBeNull()
    expect(interpretarInstante('abc')).toBeNull()
  })
})

describe('fechas AAAA-MM-DD', () => {
  it('hoyEnLima usa el día de Lima', () => {
    expect(hoyEnLima(new Date('2026-11-21T03:00:00Z'))).toBe('2026-11-20')
    expect(hoyEnLima(new Date('2026-11-21T05:00:00Z'))).toBe('2026-11-21')
  })

  it('sumarDias cruza meses y años bisiestos', () => {
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28')
    expect(sumarDias('2028-03-01', -1)).toBe('2028-02-29')
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(sumarDias('2026-11-20', -6)).toBe('2026-11-14')
  })

  it('primerDiaDelMes', () => {
    expect(primerDiaDelMes('2026-11-20')).toBe('2026-11-01')
  })

  it('esFechaIsoValida rechaza días inexistentes y formatos incorrectos', () => {
    expect(esFechaIsoValida('2026-11-20')).toBe(true)
    expect(esFechaIsoValida('2026-02-30')).toBe(false)
    expect(esFechaIsoValida('20/11/2026')).toBe(false)
    expect(esFechaIsoValida('')).toBe(false)
  })

  it('formatearFechaIso', () => {
    expect(formatearFechaIso('2026-11-05')).toBe('05/11/2026')
  })
})
