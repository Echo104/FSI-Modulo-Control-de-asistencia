import { ErrorApi, ErrorRed } from '../http/errores'
import { consumirFalloDemo } from './estadoDemo'

/**
 * Simula el tiempo de respuesta de un servidor para que se puedan ver los estados de carga.
 * También produce el fallo que se haya armado desde el banner de demostración.
 * Respeta la cancelación igual que lo haría fetch.
 */
export function simularRed(senal?: AbortSignal): Promise<void> {
  const espera = 350 + Math.random() * 300

  return new Promise<void>((resolver, rechazar) => {
    if (senal?.aborted) {
      rechazar(new DOMException('Petición cancelada', 'AbortError'))
      return
    }

    const temporizador = setTimeout(() => {
      senal?.removeEventListener('abort', alCancelar)
      const fallo = consumirFalloDemo()
      if (fallo === 'servidor') {
        rechazar(new ErrorApi(500, { detail: 'Error interno simulado por el modo demostración.' }))
      } else if (fallo === 'red') {
        rechazar(new ErrorRed())
      } else {
        resolver()
      }
    }, espera)

    function alCancelar(): void {
      clearTimeout(temporizador)
      rechazar(new DOMException('Petición cancelada', 'AbortError'))
    }

    senal?.addEventListener('abort', alCancelar, { once: true })
  })
}
