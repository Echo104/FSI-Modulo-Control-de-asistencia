import type { SesionServicio } from '../contratos'
import { perfilDemoActual } from './estadoDemo'
import { simularRed } from './simularRed'

export const sesionDemo: SesionServicio = {
  async obtenerPerfil(senal) {
    await simularRed(senal)
    return perfilDemoActual()
  },
}
