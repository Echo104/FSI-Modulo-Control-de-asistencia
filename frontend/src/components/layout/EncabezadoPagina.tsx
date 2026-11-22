import type { ReactNode } from 'react'

interface Props {
  titulo: string
  descripcion: string
  acciones?: ReactNode
}

export function EncabezadoPagina({ titulo, descripcion, acciones }: Props) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-tinta sm:text-[1.75rem]">{titulo}</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-tinta-suave">{descripcion}</p>
      </div>
      {acciones}
    </header>
  )
}
