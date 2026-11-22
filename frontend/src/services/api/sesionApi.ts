import { entorno } from '@/config/entorno'
import type { SesionServicio } from '../contratos'
import { ErrorContratoPendiente } from '../http/errores'

export const sesionApi: SesionServicio = {
  async obtenerPerfil() {
    // PENDIENTE: no existe todavía un endpoint de sesión ni una definición de roles.
    // Mientras tanto, para probar contra un backend local, el perfil se toma de variables de entorno.
    const { trabajadorId, nombre, esRrhh } = entorno.perfilPrueba
    if (trabajadorId === null) {
      throw new ErrorContratoPendiente(
        'No se sabe quién usa la pantalla: backend aún no publica un endpoint de sesión. Para pruebas locales define VITE_PRUEBA_TRABAJADOR_ID (ver .env.example).',
      )
    }
    return { trabajadorId, nombre: nombre || `Trabajador ${trabajadorId}`, esRrhh }
  },
}
