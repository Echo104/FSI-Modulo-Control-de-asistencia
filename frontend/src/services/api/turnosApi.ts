import { entorno } from '@/config/entorno'
import type { TurnosServicio } from '../contratos'
import { solicitar } from '../http/clienteHttp'
import { ErrorContratoPendiente } from '../http/errores'
import type { DatosTurno, FiltroEstadoTurno, Turno, TurnoDto } from '@/types/turnos'
import { aTurno, aTurnoEscrituraDto, extraerLista } from './mapeadores'

/** Endpoints propuestos en la HU-01: GET/POST /turnos/ · GET/PUT/PATCH/DELETE /turnos/{id}/ */
const RUTA = '/turnos/'

function empresaId(): number {
  if (entorno.empresaPruebaId && entorno.empresaPruebaId > 0) return entorno.empresaPruebaId
  throw new ErrorContratoPendiente(
    'Falta identificar la empresa del usuario. Para pruebas de la API de Turnos configura VITE_PRUEBA_EMPRESA_ID en .env.local.',
  )
}

async function listarPorEstado(estado: 'A' | 'I' | 'todos', senal?: AbortSignal): Promise<Turno[]> {
  const datos = await solicitar<unknown>(RUTA, { parametros: { estado, empresa_id: empresaId() }, senal })
  return extraerLista<TurnoDto>(datos).map(aTurno)
}

export const turnosApi: TurnosServicio = {
  async listar(filtro: FiltroEstadoTurno, senal) {
    return listarPorEstado(filtro, senal)
  },

  async obtener(id, senal) {
    empresaId()
    return aTurno(await solicitar<TurnoDto>(`${RUTA}${id}/`, { senal }))
  },

  async crear(datos: DatosTurno) {
    return aTurno(await solicitar<TurnoDto>(RUTA, { metodo: 'POST', cuerpo: aTurnoEscrituraDto(datos, empresaId()) }))
  },

  async actualizar(id, datos) {
    return aTurno(
      await solicitar<TurnoDto>(`${RUTA}${id}/`, { metodo: 'PUT', cuerpo: aTurnoEscrituraDto(datos, empresaId()) }),
    )
  },

  async darDeBaja(id) {
    empresaId()
    // DELETE = baja lógica (estado I). El turno no se borra de la base de datos.
    await solicitar<null>(`${RUTA}${id}/`, { metodo: 'DELETE' })
  },
}
