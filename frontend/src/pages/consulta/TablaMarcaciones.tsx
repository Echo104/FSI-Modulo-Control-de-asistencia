import { Insignia } from '@/components/ui/Insignia'
import { InsigniaTipo } from '@/components/ui/InsigniaTipo'
import type { Marcacion } from '@/types/marcaciones'
import { aFechaHoraLima } from '@/utils/fechas'

function FechaHora({ marcacion }: { marcacion: Marcacion }) {
  const lima = aFechaHoraLima(marcacion.fechaHoraUtc)
  if (!lima) return <span className="text-tinta-tenue">Sin fecha válida</span>
  return (
    <span className="whitespace-nowrap">
      <span className="text-tinta-suave">{lima.fecha}</span> <span className="font-medium text-tinta">{lima.hora}</span>
    </span>
  )
}

function Manual({ esManual }: { esManual: boolean }) {
  return esManual ? <Insignia tono="aviso">Sí</Insignia> : <span className="text-tinta-suave">No</span>
}

export function TablaMarcaciones({ marcaciones }: { marcaciones: Marcacion[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <caption className="sr-only">Marcaciones ordenadas por fecha y hora, de la más antigua a la más reciente</caption>
          <thead className="border-b border-borde bg-niebla/60 text-tinta-suave">
            <tr>
              <th scope="col" aria-sort="ascending" className="px-5 py-3 font-medium">Fecha y hora (Lima)</th>
              <th scope="col" className="px-3 py-3 font-medium">Tipo</th>
              <th scope="col" className="px-3 py-3 font-medium">Trabajador</th>
              <th scope="col" className="px-3 py-3 font-medium">Dispositivo</th>
              <th scope="col" className="px-3 py-3 font-medium">Manual</th>
              <th scope="col" className="px-5 py-3 font-medium">Observación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {marcaciones.map((marcacion) => (
              <tr key={marcacion.id} className="hover:bg-niebla/40">
                <td className="px-5 py-3"><FechaHora marcacion={marcacion} /></td>
                <td className="px-3 py-3"><InsigniaTipo tipo={marcacion.tipo} /></td>
                <td className="px-3 py-3 text-tinta">{marcacion.trabajadorNombre ?? `Trabajador ${marcacion.trabajadorId}`}</td>
                <td className="px-3 py-3 text-tinta">{marcacion.dispositivo ?? '—'}</td>
                <td className="px-3 py-3"><Manual esManual={marcacion.esManual} /></td>
                <td className="max-w-xs px-5 py-3 text-tinta-suave">{marcacion.observacion ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-borde xl:hidden">
        {marcaciones.map((marcacion) => (
          <li key={marcacion.id} className="space-y-2 px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm"><FechaHora marcacion={marcacion} /></p>
              <InsigniaTipo tipo={marcacion.tipo} />
            </div>
            <p className="text-sm text-tinta">{marcacion.trabajadorNombre ?? `Trabajador ${marcacion.trabajadorId}`}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tinta-suave">
              <span>Dispositivo: {marcacion.dispositivo ?? '—'}</span>
              <span className="inline-flex items-center gap-1.5">
                Manual: <Manual esManual={marcacion.esManual} />
              </span>
            </div>
            {marcacion.observacion && <p className="text-sm text-tinta-suave">{marcacion.observacion}</p>}
          </li>
        ))}
      </ul>
    </>
  )
}
