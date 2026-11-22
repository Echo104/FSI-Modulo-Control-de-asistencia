import type { ReactNode } from 'react'
import type { TipoMarcacion } from '@/types/marcaciones'
import { TIPOS_MARCACION } from '@/utils/textos'

interface Props {
  tipo: TipoMarcacion
  icono: ReactNode
  /** Las acciones de jornada (entrada y salida) tienen más peso visual que las de refrigerio. */
  principal?: boolean
  deshabilitado: boolean
  onClick: (tipo: TipoMarcacion) => void
}

export function BotonAccion({ tipo, icono, principal = false, deshabilitado, onClick }: Props) {
  const textos = TIPOS_MARCACION[tipo]

  return (
    <button
      type="button"
      disabled={deshabilitado}
      onClick={() => onClick(tipo)}
      className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:p-5 ${
        principal
          ? 'border-petroleo-700 bg-petroleo-700 text-white hover:bg-petroleo-800 active:bg-petroleo-900'
          : 'border-borde-fuerte bg-white text-tinta hover:border-petroleo-300 hover:bg-petroleo-50/50'
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
          principal ? 'bg-white/15 text-white' : 'bg-petroleo-50 text-petroleo-700'
        }`}
      >
        {icono}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold">{textos.boton}</span>
        <span className={`mt-0.5 block text-sm ${principal ? 'text-petroleo-100' : 'text-tinta-suave'}`}>
          {textos.descripcion}
        </span>
      </span>
    </button>
  )
}
