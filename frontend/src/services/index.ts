import { entorno, type ModoApi } from '@/config/entorno'
import type { Servicios } from './contratos'
import { marcacionesApi } from './api/marcacionesApi'
import { sesionApi } from './api/sesionApi'
import { trabajadoresApi } from './api/trabajadoresApi'
import { turnosApi } from './api/turnosApi'
import { marcacionesDemo } from './demo/marcacionesDemo'
import { sesionDemo } from './demo/sesionDemo'
import { trabajadoresDemo } from './demo/trabajadoresDemo'
import { turnosDemo } from './demo/turnosDemo'

/**
 * Punto único donde se decide si la aplicación usa la API real o los datos de demostración.
 * Para pasar a la API real basta con definir VITE_API_MODE=api (ver .env.example); ninguna pantalla cambia.
 */
export function crearServicios(modo: ModoApi): Servicios {
  if (modo === 'api') {
    return { turnos: turnosApi, marcaciones: marcacionesApi, trabajadores: trabajadoresApi, sesion: sesionApi }
  }
  return { turnos: turnosDemo, marcaciones: marcacionesDemo, trabajadores: trabajadoresDemo, sesion: sesionDemo }
}

export const servicios: Servicios = crearServicios(entorno.modo)
