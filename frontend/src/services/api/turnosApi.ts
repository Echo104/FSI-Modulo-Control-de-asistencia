import type { TurnosServicio } from '../contratos'
import { solicitar } from '../http/clienteHttp'
import type { DatosTurno, FiltroEstadoTurno, Turno, TurnoDto } from '@/types/turnos'
import { aTurno, aTurnoEscrituraDto, extraerLista } from './mapeadores'

/** Endpoints propuestos en la HU-01: GET/POST /turnos/ · GET/PUT/PATCH/DELETE /turnos/{id}/ */
const RUTA = '/turnos/'

async function listarPorEstado(estado: 'A' | 'I', senal?: AbortSignal): Promise<Turno[]> {
  const datos = await solicitar<unknown>(RUTA, { parametros: { estado }, senal })
  return extraerLista<TurnoDto>(datos).map(aTurno)
}

export const turnosApi: TurnosServicio = {
  async listar(filtro: FiltroEstadoTurno, senal) {
    if (filtro === 'todos') {
      // La HU-01 solo documenta el filtro por estado (A o I), así que "todos" combina ambos listados.
      const [activos, inactivos] = await Promise.all([listarPorEstado('A', senal), listarPorEstado('I', senal)])
      return [...activos, ...inactivos]
    }
    return listarPorEstado(filtro, senal)
  },

  async obtener(id, senal) {
    return aTurno(await solicitar<TurnoDto>(`${RUTA}${id}/`, { senal }))
  },

  async crear(datos: DatosTurno) {
    return aTurno(await solicitar<TurnoDto>(RUTA, { metodo: 'POST', cuerpo: aTurnoEscrituraDto(datos) }))
  },

  async actualizar(id, datos) {
    return aTurno(
      await solicitar<TurnoDto>(`${RUTA}${id}/`, { metodo: 'PUT', cuerpo: aTurnoEscrituraDto(datos) }),
    )
  },

  async darDeBaja(id) {
    // DELETE = baja lógica (estado I). El turno no se borra de la base de datos.
    await solicitar<null>(`${RUTA}${id}/`, { metodo: 'DELETE' })
  },
}
