import type { ComponentType, SVGProps } from 'react'
import { IconoConsulta, IconoMarcar, IconoTurnos } from '@/components/ui/Iconos'

export interface EnlaceNavegacion {
  ruta: string
  texto: string
  icono: ComponentType<SVGProps<SVGSVGElement>>
}

/** Secciones de la aplicación; las usan la barra lateral y la barra inferior móvil. */
export const ENLACES: readonly EnlaceNavegacion[] = [
  { ruta: '/turnos', texto: 'Turnos', icono: IconoTurnos },
  { ruta: '/marcar', texto: 'Marcar', icono: IconoMarcar },
  { ruta: '/consulta', texto: 'Consulta', icono: IconoConsulta },
]
