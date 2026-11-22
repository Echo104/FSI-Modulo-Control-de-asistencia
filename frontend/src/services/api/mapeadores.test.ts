import { describe, expect, it } from 'vitest'
import type { MarcacionDto } from '@/types/marcaciones'
import type { TurnoDto } from '@/types/turnos'
import { aMarcacion, aPagina, aTurno, aTurnoEscrituraDto, extraerLista, recortarHora } from './mapeadores'

const turnoDto: TurnoDto = {
  id: 7,
  nombre: 'Noche',
  hora_entrada: '22:00:00',
  hora_salida: '06:00:00',
  cruza_medianoche: 'S',
  tolerancia_min: 15,
  refrigerio_min: 60,
  estado: 'A',
  dias: [
    { dia: 2, laborable: 'N' },
    { dia: 1, laborable: 'S' },
  ],
}

describe('turnos', () => {
  it('convierte la API al modelo de la interfaz', () => {
    expect(aTurno(turnoDto)).toMatchObject({
      id: 7,
      horaEntrada: '22:00',
      horaSalida: '06:00',
      cruzaMedianoche: true,
      toleranciaMin: 15,
      dias: [
        { dia: 1, laborable: true },
        { dia: 2, laborable: false },
      ],
      creadoEn: null,
    })
  })

  it('si el listado no trae días, quedan en null', () => {
    const { dias: _dias, ...sinDias } = turnoDto
    expect(_dias).toHaveLength(2)
    expect(aTurno(sinDias).dias).toBeNull()
  })

  it('envía siempre los 7 días con S o N', () => {
    const cuerpo = aTurnoEscrituraDto({
      nombre: 'A',
      horaEntrada: '08:00',
      horaSalida: '17:00',
      cruzaMedianoche: false,
      toleranciaMin: 10,
      refrigerioMin: 60,
      diasLaborables: [1, 2, 3, 4, 5],
    })
    expect(cuerpo.cruza_medianoche).toBe('N')
    expect(cuerpo.dias).toHaveLength(7)
    expect(cuerpo.dias.filter((d) => d.laborable === 'S').map((d) => d.dia)).toEqual([1, 2, 3, 4, 5])
  })

  it('recortarHora quita los segundos', () => {
    expect(recortarHora('08:00:00')).toBe('08:00')
    expect(recortarHora('08:00')).toBe('08:00')
  })
})

describe('marcaciones y paginación', () => {
  const dto: MarcacionDto = {
    id: 1,
    trabajador: 3,
    tipo_marcacion: 'ENT',
    fecha_hora: '2026-11-20T13:02:11Z',
    es_manual: 'N',
  }

  it('convierte una marcación', () => {
    expect(aMarcacion(dto)).toMatchObject({
      tipo: 'ENT',
      fechaHoraUtc: '2026-11-20T13:02:11Z',
      trabajadorId: 3,
      trabajadorNombre: null,
      esManual: false,
    })
    expect(aMarcacion({ ...dto, es_manual: 'S' }).esManual).toBe(true)
  })

  it('normaliza la paginación de DRF', () => {
    const pagina = aPagina<MarcacionDto, number>({ count: 25, next: 'url', previous: null, results: [dto] }, (d) => d.id, 1)
    expect(pagina).toEqual({ total: 25, pagina: 1, resultados: [1], hayAnterior: false, haySiguiente: true })
  })

  it('acepta una lista sin paginar y una respuesta vacía', () => {
    expect(aPagina<MarcacionDto, number>([dto, dto], (d) => d.id, 1).total).toBe(2)
    expect(aPagina<MarcacionDto, number>(null, (d) => d.id, 1)).toMatchObject({ total: 0, resultados: [] })
  })

  it('extraerLista acepta array o { results }', () => {
    expect(extraerLista([1, 2])).toEqual([1, 2])
    expect(extraerLista({ results: [3] })).toEqual([3])
    expect(extraerLista(null)).toEqual([])
  })
})
