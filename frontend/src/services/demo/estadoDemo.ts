import type { PerfilSesion } from '@/types/comun'
import { hoyEnLima } from '@/utils/fechas'
import { crearDatosDemo, TRABAJADORES_DEMO, type DatosDemo } from './datosDemo'

/**
 * Estado en memoria del modo demostración. Se pierde al recargar la página a propósito:
 * nada de lo que se haga en este modo se guarda en ningún servidor.
 */

export type PerfilDemoId = 'rrhh' | 'trabajador'
export type FalloDemo = 'servidor' | 'red'

export interface InstantaneaDemo {
  perfilId: PerfilDemoId
  /** Fallo que se producirá en la próxima petición, para poder evaluar los mensajes de error. */
  falloArmado: FalloDemo | null
  /** Aumenta al restablecer los datos; las pantallas se vuelven a montar con esta clave. */
  version: number
}

const PERFILES: Record<PerfilDemoId, PerfilSesion> = {
  rrhh: { trabajadorId: 6, nombre: 'Carla Mendoza Vera', esRrhh: true },
  trabajador: { trabajadorId: 1, nombre: 'Rosa Quispe Huamán', esRrhh: false },
}

let instantanea: InstantaneaDemo = { perfilId: 'rrhh', falloArmado: null, version: 0 }
let datos: DatosDemo = crearDatosDemo(hoyEnLima())
const oyentes = new Set<() => void>()

function publicar(cambios: Partial<InstantaneaDemo>): void {
  instantanea = { ...instantanea, ...cambios }
  oyentes.forEach((oyente) => oyente())
}

/* Funciones para useSyncExternalStore (el banner de demostración se actualiza al cambiar el estado). */
export function suscribirDemo(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

export function obtenerInstantaneaDemo(): InstantaneaDemo {
  return instantanea
}

export function perfilDemoActual(): PerfilSesion {
  return { ...PERFILES[instantanea.perfilId] }
}

export function fijarPerfilDemo(perfilId: PerfilDemoId): void {
  publicar({ perfilId })
}

export const PERFILES_DEMO = PERFILES

export function armarFalloDemo(fallo: FalloDemo | null): void {
  publicar({ falloArmado: fallo })
}

/** Devuelve el fallo armado (si hay) y lo desarma: solo afecta a una petición. */
export function consumirFalloDemo(): FalloDemo | null {
  const fallo = instantanea.falloArmado
  if (fallo) publicar({ falloArmado: null })
  return fallo
}

export function datosDemo(): DatosDemo {
  return datos
}

export function restablecerDatosDemo(): void {
  datos = crearDatosDemo(hoyEnLima())
  publicar({ falloArmado: null, version: instantanea.version + 1 })
}

export function siguienteId(coleccion: 'turnos' | 'marcaciones'): number {
  const ids = datos[coleccion].map((elemento) => elemento.id)
  return (ids.length > 0 ? Math.max(...ids) : 0) + 1
}

export function nombreTrabajadorDemo(id: number): string | null {
  return TRABAJADORES_DEMO.find((t) => t.id === id)?.nombre ?? null
}
