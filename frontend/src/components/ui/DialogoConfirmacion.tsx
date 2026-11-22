import type { ReactNode } from 'react'
import type { ErrorUi } from '@/utils/errores'
import { Alerta } from './Alerta'
import { Boton } from './Boton'
import { ModalBase } from './ModalBase'

interface Props {
  titulo: string
  /** Explica qué va a pasar y qué consecuencias tiene. */
  descripcion: ReactNode
  textoConfirmar: string
  tono?: 'primario' | 'peligro'
  /** Hay una petición en curso: se bloquean los botones y el cierre. */
  enviando?: boolean
  error?: ErrorUi | null
  /** Contenido adicional entre la descripción y los botones (por ejemplo, un campo de observación). */
  children?: ReactNode
  onConfirmar: () => void
  onCancelar: () => void
}

/** Ventana de confirmación previa a una acción que no conviene hacer por error. */
export function DialogoConfirmacion({
  titulo,
  descripcion,
  textoConfirmar,
  tono = 'primario',
  enviando = false,
  error,
  children,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <ModalBase titulo={titulo} bloqueado={enviando} onCerrar={onCancelar}>
      <div className="space-y-4 px-5 py-5 text-sm text-tinta">
        <div className="space-y-2 text-[15px] leading-relaxed text-tinta-suave">{descripcion}</div>
        {children}
        {error && (
          <Alerta tono="error" titulo={error.titulo} etiqueta={error.codigo ?? undefined}>
            {error.mensajes.map((mensaje) => (
              <p key={mensaje}>{mensaje}</p>
            ))}
          </Alerta>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-borde px-5 py-4 sm:flex-row sm:justify-end">
        <Boton variante="secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Boton>
        <Boton variante={tono} onClick={onConfirmar} cargando={enviando}>
          {error?.reintentable ? 'Reintentar' : textoConfirmar}
        </Boton>
      </div>
    </ModalBase>
  )
}
