import type { ReactNode } from 'react'
import { IconoAlerta } from './Iconos'

/** Atributos de accesibilidad que el campo entrega al control (input, select, textarea). */
export interface AtributosControl {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  'aria-required'?: true
}

interface Props {
  id: string
  etiqueta: string
  ayuda?: string
  error?: string
  obligatorio?: boolean
  className?: string
  children: (atributos: AtributosControl) => ReactNode
}

/** Clases comunes para inputs, selects y textareas. */
export function claseControl(conError = false): string {
  return [
    'block w-full rounded-md border bg-white px-3 text-base text-tinta shadow-sm sm:text-sm',
    'placeholder:text-tinta-tenue disabled:bg-niebla disabled:text-tinta-suave',
    'focus:outline-none focus:ring-2',
    conError
      ? 'border-rojo-600 focus:border-rojo-600 focus:ring-rojo-600/25'
      : 'border-borde-fuerte focus:border-petroleo-500 focus:ring-petroleo-500/25',
  ].join(' ')
}

/** Etiqueta + control + ayuda + error, enlazados para lectores de pantalla. */
export function Campo({ id, etiqueta, ayuda, error, obligatorio, className = '', children }: Props) {
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`
  const describedBy = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-tinta">
        {etiqueta}
        {obligatorio && (
          <span aria-hidden="true" className="ml-0.5 text-rojo-700">
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': obligatorio ? true : undefined,
      })}
      {ayuda && (
        <p id={idAyuda} className="mt-1.5 text-sm text-tinta-suave">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="mt-1.5 flex items-start gap-1.5 text-sm text-rojo-700">
          <IconoAlerta width={16} height={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
