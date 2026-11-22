import { entorno } from '@/config/entorno'
import type { TrabajadoresServicio } from '../contratos'
import { solicitar } from '../http/clienteHttp'
import { ErrorContratoPendiente } from '../http/errores'
import { aTrabajador, extraerLista, type TrabajadorDto } from './mapeadores'

export const trabajadoresApi: TrabajadoresServicio = {
  async listar(senal) {
    // Las historias no definen cómo obtener el listado de trabajadores, así que la ruta no se inventa:
    // se configura en VITE_API_RUTA_TRABAJADORES cuando backend la publique.
    if (!entorno.rutaTrabajadores) {
      throw new ErrorContratoPendiente(
        'El listado de trabajadores aún no está disponible en la API (falta definir el endpoint).',
      )
    }
    const datos = await solicitar<unknown>(entorno.rutaTrabajadores, { senal })
    return extraerLista<TrabajadorDto>(datos).map(aTrabajador)
  },
}
