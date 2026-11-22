import type { ReactNode } from 'react'
import { IconoAlerta, IconoCheck, IconoInfo } from './Iconos'

type Tono = 'error' | 'exito' | 'aviso' | 'info'

const ESTILOS: Record<Tono, { caja: string; icono: ReactNode; etiqueta: string }> = {
  error: {
    caja: 'border-rojo-200 bg-rojo-50 text-rojo-700',
    icono: <IconoAlerta className="shrink-0" />,
    etiqueta: 'bg-white/70 text-rojo-700 ring-rojo-200',
  },
  exito: {
    caja: 'border-verde-200 bg-verde-50 text-verde-700',
    icono: <IconoCheck className="shrink-0" />,
    etiqueta: 'bg-white/70 text-verde-700 ring-verde-200',
  },
  aviso: {
    caja: 'border-ambar-200 bg-ambar-50 text-ambar-800',
    icono: <IconoAlerta className="shrink-0" />,
    etiqueta: 'bg-white/70 text-ambar-800 ring-ambar-200',
  },
  info: {
    caja: 'border-petroleo-200 bg-petroleo-50 text-petroleo-800',
    icono: <IconoInfo className="shrink-0" />,
    etiqueta: 'bg-white/70 text-petroleo-800 ring-petroleo-200',
  },
}

interface Props {
  tono: Tono
  titulo: string
  /** Texto corto junto al título, por ejemplo "Error 400". */
  etiqueta?: string
  children?: ReactNode
  acciones?: ReactNode
  className?: string
}

/** Mensaje destacado. Los errores usan role="alert" para que se anuncien de inmediato. */
export function Alerta({ tono, titulo, etiqueta, children, acciones, className = '' }: Props) {
  const estilo = ESTILOS[tono]
  return (
    <div
      role={tono === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-lg border p-4 ${estilo.caja} ${className}`}
    >
      <span className="mt-0.5">{estilo.icono}</span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
          {titulo}
          {etiqueta && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${estilo.etiqueta}`}>
              {etiqueta}
            </span>
          )}
        </p>
        {children && <div className="mt-1.5 space-y-1 text-tinta">{children}</div>}
        {acciones && <div className="mt-3">{acciones}</div>}
      </div>
    </div>
  )
}
