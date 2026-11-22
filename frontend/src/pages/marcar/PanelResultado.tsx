import { Alerta } from '@/components/ui/Alerta'
import { Insignia } from '@/components/ui/Insignia'
import { esModoDemo } from '@/config/entorno'
import type { Marcacion } from '@/types/marcaciones'
import { aFechaHoraLima } from '@/utils/fechas'
import { nombreTipoMarcacion } from '@/utils/textos'

interface Props {
  ultima: Marcacion | null
  /** Marcaciones de esta sesión, de la más reciente a la más antigua. */
  historial: Marcacion[]
}

/** Muestra la hora que devolvió el servidor, convertida a America/Lima. Nunca calcula una hora propia. */
export function PanelResultado({ ultima, historial }: Props) {
  const hora = ultima ? aFechaHoraLima(ultima.fechaHoraUtc) : null
  const anteriores = historial.slice(1)

  return (
    <section aria-labelledby="titulo-resultado" className="space-y-4">
      <h2 id="titulo-resultado" className="text-base font-semibold text-tinta">
        Última marcación registrada
      </h2>

      {!ultima && (
        <div className="rounded-lg border border-dashed border-borde-fuerte bg-white p-5 text-sm leading-relaxed text-tinta-suave">
          Todavía no registraste ninguna marcación en esta sesión. Cuando lo hagas, aquí verás la hora que devuelva el
          servidor, expresada en hora de Lima.
        </div>
      )}

      {ultima && hora && (
        <div className="rounded-lg bg-petroleo-900 p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-petroleo-100">{nombreTipoMarcacion(ultima.tipo)}</p>
            <Insignia tono="exito">Registrada</Insignia>
          </div>
          <p className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">{hora.hora}</p>
          <p className="mt-2 text-petroleo-100">{hora.fechaLarga}</p>
          <p className="mt-4 border-t border-white/15 pt-3 text-sm text-petroleo-200">
            Hora de Lima (America/Lima), fijada por el servidor.
          </p>
          {esModoDemo && (
            <p className="mt-2 text-sm text-ambar-200">
              Modo demostración: esta hora la simula el servicio de prueba, no un servidor real.
            </p>
          )}
          <details className="mt-3 text-sm text-petroleo-200">
            <summary className="w-fit cursor-pointer underline underline-offset-2">Ver el valor original</summary>
            <p className="mt-2">El servidor devolvió el instante en UTC:</p>
            <code className="mt-1 block w-fit max-w-full overflow-x-auto rounded bg-white/10 px-2 py-1 font-mono text-xs whitespace-nowrap text-white">
              {ultima.fechaHoraUtc}
            </code>
          </details>
        </div>
      )}

      {ultima && !hora && (
        <Alerta tono="aviso" titulo="No se pudo mostrar la hora">
          <p>
            La marcación se envió, pero el servidor no devolvió una fecha y hora válidas. No se muestra ninguna hora
            estimada. Revisa el resultado en la pantalla Consulta.
          </p>
        </Alerta>
      )}

      {anteriores.length > 0 && (
        <div className="rounded-lg border border-borde bg-white">
          <h3 className="border-b border-borde px-4 py-3 text-sm font-medium text-tinta">Anteriores en esta sesión</h3>
          <ul className="divide-y divide-borde">
            {anteriores.map((marcacion) => {
              const fechaHora = aFechaHoraLima(marcacion.fechaHoraUtc)
              return (
                <li key={marcacion.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="text-tinta">{nombreTipoMarcacion(marcacion.tipo)}</span>
                  <span className="font-medium text-tinta">{fechaHora ? fechaHora.hora : 'Sin hora'}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
