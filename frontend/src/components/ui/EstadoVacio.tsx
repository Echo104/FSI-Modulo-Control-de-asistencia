import type { ReactNode } from 'react'

interface Props {
  icono: ReactNode
  titulo: string
  descripcion: string
  accion?: ReactNode
}

/** Pantalla sin resultados: explica por qué está vacía y qué se puede hacer. */
export function EstadoVacio({ icono, titulo, descripcion, accion }: Props) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-petroleo-50 text-petroleo-600">
        {icono}
      </div>
      <h3 className="mt-4 text-base font-semibold text-tinta">{titulo}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-tinta-suave">{descripcion}</p>
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  )
}
