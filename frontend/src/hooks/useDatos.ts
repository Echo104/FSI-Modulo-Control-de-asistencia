import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { esCancelacion } from '@/services/http/errores'
import { describirError, type ErrorUi, type OpcionesError } from '@/utils/errores'

interface EstadoCarga<T> {
  datos: T | null
  cargando: boolean
  error: ErrorUi | null
}

interface OpcionesUseDatos extends OpcionesError {
  /** Frase para el mensaje de error: "No se pudo {accion}". */
  accion: string
  /** Mantiene los datos anteriores visibles mientras llegan los nuevos (útil al cambiar de página). */
  conservarDatos?: boolean
}

/**
 * Carga datos al montar la pantalla y cada vez que cambian las dependencias.
 * - Cancela la petición anterior para que una respuesta lenta no pise a una más reciente.
 * - `recargar()` vuelve a pedir los mismos datos sin borrar lo que ya se ve.
 */
export function useDatos<T>(
  cargar: (senal: AbortSignal) => Promise<T>,
  dependencias: DependencyList,
  { accion, conservarDatos = false, etiquetasCampo, mensajesPorEstado }: OpcionesUseDatos,
) {
  const [estado, setEstado] = useState<EstadoCarga<T>>({ datos: null, cargando: true, error: null })
  const [intento, setIntento] = useState(0)
  const intentoPrevio = useRef(0)

  useEffect(() => {
    const control = new AbortController()
    const esRecarga = intentoPrevio.current !== intento
    intentoPrevio.current = intento

    setEstado((previo) => ({
      datos: esRecarga || conservarDatos ? previo.datos : null,
      cargando: true,
      error: null,
    }))

    cargar(control.signal).then(
      (datos) => {
        if (!control.signal.aborted) setEstado({ datos, cargando: false, error: null })
      },
      (error: unknown) => {
        if (control.signal.aborted || esCancelacion(error)) return
        setEstado((previo) => ({
          datos: previo.datos,
          cargando: false,
          error: describirError(error, accion, { etiquetasCampo, mensajesPorEstado }),
        }))
      },
    )

    return () => control.abort()
    // Las dependencias las define quien llama al hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, intento])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])

  return { ...estado, recargar }
}
