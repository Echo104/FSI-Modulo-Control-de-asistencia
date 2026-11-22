import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type Variante = 'primario' | 'secundario' | 'peligro' | 'texto'
type Tamano = 'md' | 'sm'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-petroleo-700 text-white hover:bg-petroleo-800 active:bg-petroleo-900',
  secundario: 'border border-borde-fuerte bg-white text-tinta hover:bg-niebla active:bg-borde/60',
  peligro: 'bg-rojo-600 text-white hover:bg-rojo-700 active:bg-rojo-700',
  texto: 'text-petroleo-700 hover:bg-petroleo-50 active:bg-petroleo-100',
}

const TAMANOS: Record<Tamano, string> = {
  md: 'h-11 px-4 text-sm sm:h-10',
  sm: 'h-9 px-3 text-sm',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: Tamano
  /** Muestra un indicador de carga y bloquea el botón para evitar envíos repetidos. */
  cargando?: boolean
  icono?: ReactNode
}

export function Boton({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  icono,
  disabled,
  className = '',
  type = 'button',
  children,
  ...resto
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`}
      {...resto}
    >
      {cargando ? <Spinner /> : icono}
      {children}
    </button>
  )
}
