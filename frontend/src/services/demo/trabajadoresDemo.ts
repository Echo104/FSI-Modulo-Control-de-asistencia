import type { TrabajadoresServicio } from '../contratos'
import { datosDemo } from './estadoDemo'
import { simularRed } from './simularRed'

export const trabajadoresDemo: TrabajadoresServicio = {
  async listar(senal) {
    await simularRed(senal)
    return datosDemo()
      .trabajadores.map((t) => ({ ...t }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  },
}
