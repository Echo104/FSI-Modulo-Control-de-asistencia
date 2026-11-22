import type { ReactNode } from 'react'

export type TonoInsignia = 'neutro' | 'exito' | 'aviso' | 'peligro' | 'info'

const TONOS: Record<TonoInsignia, { caja: string; punto: string }> = {
  neutro: { caja: 'bg-niebla text-tinta-suave ring-borde-fuerte', punto: 'bg-tinta-tenue' },
  exito: { caja: 'bg-verde-50 text-verde-700 ring-verde-200', punto: 'bg-verde-700' },
  aviso: { caja: 'bg-ambar-50 text-ambar-800 ring-ambar-200', punto: 'bg-ambar-500' },
  peligro: { caja: 'bg-rojo-50 text-rojo-700 ring-rojo-200', punto: 'bg-rojo-600' },
  info: { caja: 'bg-petroleo-50 text-petroleo-700 ring-petroleo-200', punto: 'bg-petroleo-500' },
}

/** Etiqueta pequeña de estado. El texto siempre acompaña al color (no se depende solo del color). */
export function Insignia({ tono = 'neutro', children }: { tono?: TonoInsignia; children: ReactNode }) {
  const estilo = TONOS[tono]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${estilo.caja}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${estilo.punto}`} />
      {children}
    </span>
  )
}
