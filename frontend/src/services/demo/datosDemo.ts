import type { Trabajador } from '@/types/comun'
import type { Marcacion, TipoMarcacion } from '@/types/marcaciones'
import type { DiaTurno, NumeroDia, Turno } from '@/types/turnos'
import { sumarDias } from '@/utils/fechas'
import { DIAS_SEMANA } from '@/utils/textos'

/**
 * DATOS DE DEMOSTRACIÓN. No provienen de ningún servidor ni de la base de datos del proyecto.
 * Existen para poder evaluar las pantallas sin backend y se generan en el navegador.
 */

export interface DatosDemo {
  trabajadores: Trabajador[]
  turnos: Turno[]
  marcaciones: Marcacion[]
}

export const TRABAJADORES_DEMO: Trabajador[] = [
  { id: 1, nombre: 'Rosa Quispe Huamán' },
  { id: 2, nombre: 'Carlos Mamani Condori' },
  { id: 3, nombre: 'Lucía Flores Paredes' },
  { id: 4, nombre: 'Jorge Ramírez Salas' },
  { id: 5, nombre: 'Mariela Choque Apaza' },
  { id: 6, nombre: 'Carla Mendoza Vera' },
]

/** Ventana anti-duplicado que simula el servidor demo (en el backend real es un parámetro configurable). */
export const VENTANA_ANTIDUPLICADO_SEGUNDOS = 60

function dias(laborables: NumeroDia[]): DiaTurno[] {
  return DIAS_SEMANA.map(({ numero }) => ({ dia: numero, laborable: laborables.includes(numero) }))
}

function crearTurnosDemo(): Turno[] {
  return [
    {
      id: 1,
      nombre: 'Administrativo diurno',
      horaEntrada: '08:00',
      horaSalida: '17:00',
      cruzaMedianoche: false,
      toleranciaMin: 10,
      refrigerioMin: 60,
      estado: 'A',
      dias: dias([1, 2, 3, 4, 5]),
      creadoEn: '2026-03-02T14:20:00Z',
      actualizadoEn: null,
    },
    {
      id: 2,
      nombre: 'Atención al cliente - tarde',
      horaEntrada: '14:00',
      horaSalida: '22:00',
      cruzaMedianoche: false,
      toleranciaMin: 10,
      refrigerioMin: 45,
      estado: 'A',
      dias: dias([1, 2, 3, 4, 5, 6]),
      creadoEn: '2026-03-02T14:25:00Z',
      actualizadoEn: '2026-06-18T16:02:00Z',
    },
    {
      id: 3,
      nombre: 'Operaciones nocturno',
      horaEntrada: '22:00',
      horaSalida: '06:00',
      cruzaMedianoche: true,
      toleranciaMin: 15,
      refrigerioMin: 60,
      estado: 'A',
      dias: dias([1, 2, 3, 4, 5]),
      creadoEn: '2026-03-09T15:10:00Z',
      actualizadoEn: null,
    },
    {
      id: 4,
      nombre: 'Fin de semana',
      horaEntrada: '09:00',
      horaSalida: '15:00',
      cruzaMedianoche: false,
      toleranciaMin: 5,
      refrigerioMin: 30,
      estado: 'A',
      dias: dias([6, 7]),
      creadoEn: '2026-04-14T13:40:00Z',
      actualizadoEn: null,
    },
    {
      id: 5,
      nombre: 'Medio tiempo mañana',
      horaEntrada: '08:00',
      horaSalida: '13:00',
      cruzaMedianoche: false,
      toleranciaMin: 10,
      refrigerioMin: 0,
      estado: 'A',
      dias: dias([1, 2, 3, 4, 5]),
      creadoEn: '2026-05-05T12:55:00Z',
      actualizadoEn: null,
    },
    {
      id: 6,
      nombre: 'Campaña verano 2026',
      horaEntrada: '07:00',
      horaSalida: '16:00',
      cruzaMedianoche: false,
      toleranciaMin: 10,
      refrigerioMin: 60,
      estado: 'I',
      dias: dias([1, 2, 3, 4, 5]),
      creadoEn: '2026-01-12T14:00:00Z',
      actualizadoEn: '2026-03-31T22:30:00Z',
    },
  ]
}

/** Generador pseudoaleatorio con semilla: los datos son los mismos cada vez que se abre la aplicación. */
function generadorConSemilla(semilla: number): () => number {
  let estado = semilla >>> 0
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Lima está en UTC-5 todo el año (no tiene horario de verano); este cálculo es solo para sembrar datos. */
function limaAInstanteUtc(fechaIso: string, segundosDelDia: number): string {
  const [anio = 0, mes = 1, dia = 1] = fechaIso.split('-').map(Number)
  const medianocheUtc = Date.UTC(anio, mes - 1, dia)
  return new Date(medianocheUtc + (segundosDelDia + 5 * 3600) * 1000).toISOString()
}

const DISPOSITIVOS = ['WEB-01', 'MOV-01', 'QRC-01'] as const

/** Marcaciones de lunes a viernes de las últimas tres semanas (sin incluir hoy), relativas a la fecha actual en Lima. */
function crearMarcacionesDemo(hoy: string): Marcacion[] {
  const eventos: Omit<Marcacion, 'id'>[] = []

  for (let atras = 21; atras >= 1; atras--) {
    const fecha = sumarDias(hoy, -atras)
    const diaSemana = new Date(`${fecha}T12:00:00Z`).getUTCDay()
    if (diaSemana === 0 || diaSemana === 6) continue

    for (const trabajador of TRABAJADORES_DEMO) {
      const azar = generadorConSemilla(trabajador.id * 1000 + atras)
      if (azar() < 0.06) continue // días sin asistencia

      const minutoEntrada = 470 + Math.floor(azar() * 32)
      const minutoInicioRefrigerio = 775 + Math.floor(azar() * 20)
      const minutoFinRefrigerio = minutoInicioRefrigerio + 50 + Math.floor(azar() * 15)
      const minutoSalida = 1020 + Math.floor(azar() * 30)

      const secuencia: Array<[TipoMarcacion, number]> = [
        ['ENT', minutoEntrada],
        ['IRF', minutoInicioRefrigerio],
        ['FRF', minutoFinRefrigerio],
        ['SAL', minutoSalida],
      ]

      for (const [tipo, minuto] of secuencia) {
        const segundos = minuto * 60 + Math.floor(azar() * 60)
        // Algunas salidas se muestran como registradas manualmente para poder evaluar la columna «Manual».
        const esManual = tipo === 'SAL' && (trabajador.id + atras) % 17 === 0
        eventos.push({
          tipo,
          fechaHoraUtc: limaAInstanteUtc(fecha, segundos),
          trabajadorId: trabajador.id,
          trabajadorNombre: trabajador.nombre,
          dispositivo: esManual ? 'MAN-01' : (DISPOSITIVOS[Math.floor(azar() * DISPOSITIVOS.length)] ?? 'WEB-01'),
          esManual,
          observacion: esManual ? 'Registrada por RR. HH. por olvido de marcación.' : null,
        })
      }
    }
  }

  eventos.sort((a, b) => a.fechaHoraUtc.localeCompare(b.fechaHoraUtc) || a.trabajadorId - b.trabajadorId)
  return eventos.map((evento, indice) => ({ id: indice + 1, ...evento }))
}

export function crearDatosDemo(hoy: string): DatosDemo {
  return {
    trabajadores: TRABAJADORES_DEMO.map((t) => ({ ...t })),
    turnos: crearTurnosDemo(),
    marcaciones: crearMarcacionesDemo(hoy),
  }
}
