import type { Pagina, PerfilSesion, Trabajador } from '@/types/comun'
import type { ConsultaMarcaciones, Marcacion, NuevaMarcacion } from '@/types/marcaciones'
import type { DatosTurno, FiltroEstadoTurno, Turno } from '@/types/turnos'

/**
 * Contratos que usan las pantallas. Hay dos implementaciones intercambiables:
 *  - services/api/*   → habla con el backend real.
 *  - services/demo/*  → datos simulados para poder evaluar las pantallas sin backend.
 * Las pantallas solo conocen estas interfaces; no saben cuál implementación están usando.
 */

export interface TurnosServicio {
  listar(filtro: FiltroEstadoTurno, senal?: AbortSignal): Promise<Turno[]>
  /** El detalle incluye los días del turno (HU-01, CA-08). */
  obtener(id: number, senal?: AbortSignal): Promise<Turno>
  crear(datos: DatosTurno): Promise<Turno>
  actualizar(id: number, datos: DatosTurno): Promise<Turno>
  /** Baja lógica: el turno pasa a estado "I", no se elimina. */
  darDeBaja(id: number): Promise<void>
}

export interface MarcacionesServicio {
  /**
   * Registra una marcación. La hora NO se envía: la fija el servidor y viene en la respuesta.
   * El trabajador se recibe por parámetro porque aún no hay autenticación definida.
   */
  registrar(trabajadorId: number, datos: NuevaMarcacion): Promise<Marcacion>
  consultar(consulta: ConsultaMarcaciones, senal?: AbortSignal): Promise<Pagina<Marcacion>>
}

export interface TrabajadoresServicio {
  /** Catálogo para el filtro de RR. HH. */
  listar(senal?: AbortSignal): Promise<Trabajador[]>
}

export interface SesionServicio {
  obtenerPerfil(senal?: AbortSignal): Promise<PerfilSesion>
}

export interface Servicios {
  turnos: TurnosServicio
  marcaciones: MarcacionesServicio
  trabajadores: TrabajadoresServicio
  sesion: SesionServicio
}
