import type { NumeroDia } from '@/types/turnos'
import { DIAS_SEMANA } from '@/utils/textos'
import { IconoAlerta } from '@/components/ui/Iconos'

interface Props {
  /** Prefijo para el id del primer día; permite enfocarlo cuando hay un error. */
  id: string
  valor: NumeroDia[]
  error?: string
  onCambiar: (dias: NumeroDia[]) => void
}

const LUNES_A_VIERNES: NumeroDia[] = [1, 2, 3, 4, 5]
const TODOS: NumeroDia[] = [1, 2, 3, 4, 5, 6, 7]

/** Selección de los días laborables del turno (1 = lunes … 7 = domingo). */
export function SelectorDias({ id, valor, error, onCambiar }: Props) {
  const idError = `${id}-error`

  function alternar(dia: NumeroDia) {
    onCambiar(valor.includes(dia) ? valor.filter((d) => d !== dia) : [...valor, dia].sort((a, b) => a - b))
  }

  return (
    <fieldset aria-describedby={error ? idError : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-tinta">
        Días laborables
        <span aria-hidden="true" className="ml-0.5 text-rojo-700">
          *
        </span>
      </legend>

      <div className="flex flex-wrap gap-2">
        {DIAS_SEMANA.map(({ numero, corto, largo }) => (
          <label key={numero} className="relative cursor-pointer">
            <input
              id={numero === 1 ? id : undefined}
              type="checkbox"
              className="peer sr-only"
              checked={valor.includes(numero)}
              onChange={() => alternar(numero)}
              aria-invalid={error ? true : undefined}
            />
            <span
              className={`inline-flex h-11 min-w-14 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors peer-checked:border-petroleo-700 peer-checked:bg-petroleo-700 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-petroleo-500 sm:h-10 ${
                error ? 'border-rojo-600' : 'border-borde-fuerte'
              } bg-white text-tinta hover:bg-niebla peer-checked:hover:bg-petroleo-800`}
            >
              <span aria-hidden="true">{corto}</span>
              <span className="sr-only">{largo}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-2 flex gap-4 text-sm">
        <button type="button" onClick={() => onCambiar(LUNES_A_VIERNES)} className="font-medium text-petroleo-700 underline underline-offset-2 hover:text-petroleo-800">
          Lunes a viernes
        </button>
        <button type="button" onClick={() => onCambiar(TODOS)} className="font-medium text-petroleo-700 underline underline-offset-2 hover:text-petroleo-800">
          Todos los días
        </button>
      </div>

      {error && (
        <p id={idError} className="mt-1.5 flex items-start gap-1.5 text-sm text-rojo-700">
          <IconoAlerta width={16} height={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  )
}
