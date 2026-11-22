import { useEffect, useId, useRef, type ReactNode } from 'react'
import { IconoCerrar } from './Iconos'

interface Props {
  titulo: string
  descripcion?: string
  variante?: 'centro' | 'lateral'
  /** Mientras es true no se puede cerrar (por ejemplo, durante un envío). */
  bloqueado?: boolean
  onCerrar: () => void
  children: ReactNode
}

/**
 * Ventana modal basada en el elemento nativo <dialog>: el navegador se encarga de atrapar el foco,
 * cerrar con Esc y marcar el resto de la página como inactiva. Se monta solo mientras está abierta.
 */
export function ModalBase({ titulo, descripcion, variante = 'centro', bloqueado = false, onCerrar, children }: Props) {
  const referencia = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const idDescripcion = useId()

  useEffect(() => {
    const dialogo = referencia.current
    if (!dialogo) return
    if (!dialogo.open) dialogo.showModal()

    // El diálogo nativo no impide que la página de fondo se desplace.
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflowAnterior
      if (dialogo.open) dialogo.close()
    }
  }, [])

  const esLateral = variante === 'lateral'

  return (
    <dialog
      ref={referencia}
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      onCancel={(evento) => {
        evento.preventDefault()
        if (!bloqueado) onCerrar()
      }}
      onClick={(evento) => {
        // Un clic directo sobre el <dialog> (y no sobre su contenido) es un clic en el fondo.
        if (evento.target === evento.currentTarget && !bloqueado) onCerrar()
      }}
      className={
        esLateral
          ? 'modal-lateral m-0 ml-auto h-dvh max-h-none w-full max-w-xl overflow-hidden bg-white p-0 text-tinta shadow-2xl backdrop:bg-petroleo-950/50'
          : 'modal-centro m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 text-tinta shadow-2xl backdrop:bg-petroleo-950/50'
      }
    >
      <div className={esLateral ? 'flex h-full flex-col' : 'flex flex-col'}>
        <div className="flex items-start justify-between gap-4 border-b border-borde px-5 py-4">
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-lg font-semibold tracking-tight">
              {titulo}
            </h2>
            {descripcion && (
              <p id={idDescripcion} className="mt-0.5 text-sm text-tinta-suave">
                {descripcion}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={bloqueado}
            aria-label="Cerrar"
            className="-mr-2 rounded-md p-2 text-tinta-suave hover:bg-niebla hover:text-tinta disabled:opacity-50"
          >
            <IconoCerrar />
          </button>
        </div>
        <div className={esLateral ? 'flex min-h-0 flex-1 flex-col' : ''}>{children}</div>
      </div>
    </dialog>
  )
}
