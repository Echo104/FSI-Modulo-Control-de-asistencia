import { describe, expect, it } from 'vitest'
import type { FormularioTurno } from '@/types/turnos'
import { advertenciaHorarioTurno, formularioTurnoVacio, validarFormularioTurno } from './validacionTurno'

const valido: FormularioTurno = {
  nombre: '  Administrativo diurno ',
  horaEntrada: '08:00',
  horaSalida: '17:00',
  cruzaMedianoche: false,
  toleranciaMin: '10',
  refrigerioMin: '60',
  diasLaborables: [5, 1, 3],
}

describe('validarFormularioTurno', () => {
  it('acepta datos válidos, limpia el nombre y ordena los días', () => {
    const { errores, datos } = validarFormularioTurno(valido)
    expect(errores).toEqual({})
    expect(datos).toEqual({
      nombre: 'Administrativo diurno',
      horaEntrada: '08:00',
      horaSalida: '17:00',
      cruzaMedianoche: false,
      toleranciaMin: 10,
      refrigerioMin: 60,
      diasLaborables: [1, 3, 5],
    })
  })

  it('el formulario vacío pide los campos obligatorios', () => {
    const { errores, datos } = validarFormularioTurno(formularioTurnoVacio)
    expect(datos).toBeNull()
    expect(Object.keys(errores)).toEqual(expect.arrayContaining(['nombre', 'horaEntrada', 'horaSalida']))
  })

  it('CA-09: el nombre no admite | / \\', () => {
    for (const caracter of ['|', '/', '\\']) {
      const { errores } = validarFormularioTurno({ ...valido, nombre: `Turno ${caracter} A` })
      expect(errores.nombre).toMatch(/caracteres/)
    }
  })

  it('CA-03: salida anterior a la entrada solo se acepta si cruza la medianoche', () => {
    const noche = { ...valido, horaEntrada: '22:00', horaSalida: '06:00' }
    expect(validarFormularioTurno(noche).errores.horaSalida).toMatch(/cruza la medianoche/)
    expect(validarFormularioTurno({ ...noche, cruzaMedianoche: true }).errores.horaSalida).toBeUndefined()
  })

  it('CA-04: tolerancia 0-120 y refrigerio 0-180, solo enteros', () => {
    expect(validarFormularioTurno({ ...valido, toleranciaMin: '0' }).errores.toleranciaMin).toBeUndefined()
    expect(validarFormularioTurno({ ...valido, toleranciaMin: '120' }).errores.toleranciaMin).toBeUndefined()
    expect(validarFormularioTurno({ ...valido, toleranciaMin: '121' }).errores.toleranciaMin).toMatch(/entre 0 y 120/)
    expect(validarFormularioTurno({ ...valido, refrigerioMin: '180' }).errores.refrigerioMin).toBeUndefined()
    expect(validarFormularioTurno({ ...valido, refrigerioMin: '181' }).errores.refrigerioMin).toMatch(/entre 0 y 180/)
    expect(validarFormularioTurno({ ...valido, toleranciaMin: '-5' }).errores.toleranciaMin).toMatch(/entero/)
    expect(validarFormularioTurno({ ...valido, refrigerioMin: '1.5' }).errores.refrigerioMin).toMatch(/entero/)
    expect(validarFormularioTurno({ ...valido, toleranciaMin: '' }).errores.toleranciaMin).toMatch(/Indica/)
  })

  it('pide al menos un día laborable', () => {
    expect(validarFormularioTurno({ ...valido, diasLaborables: [] }).errores.diasLaborables).toMatch(/al menos un día/)
  })
})

describe('advertenciaHorarioTurno', () => {
  it('avisa cuando el cruce de medianoche no coincide con las horas', () => {
    expect(advertenciaHorarioTurno({ ...valido, cruzaMedianoche: true })).toMatch(/cruza la medianoche/)
    expect(advertenciaHorarioTurno({ ...valido, horaSalida: '08:00' })).toMatch(/igual a la entrada/)
    expect(advertenciaHorarioTurno(valido)).toBeNull()
  })
})
