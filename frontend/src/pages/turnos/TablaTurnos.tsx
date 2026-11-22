import { Boton } from '@/components/ui/Boton'
import { IconoBaja, IconoEditar } from '@/components/ui/Iconos'
import { Insignia } from '@/components/ui/Insignia'
import type { DiaTurno, Turno } from '@/types/turnos'
import { DIAS_SEMANA } from '@/utils/textos'

interface Props {
  turnos: Turno[]
  onEditar: (turno: Turno) => void
  onBaja: (turno: Turno) => void
}

function EstadoTurno({ turno }: { turno: Turno }) {
  return turno.estado === 'A' ? <Insignia tono="exito">Activo</Insignia> : <Insignia>Inactivo</Insignia>
}

function Horario({ turno }: { turno: Turno }) {
  return (
    <span>
      <span className="font-medium text-tinta">
        {turno.horaEntrada} a {turno.horaSalida}
      </span>
      {turno.cruzaMedianoche && <span className="block text-xs text-tinta-suave">Termina al día siguiente</span>}
    </span>
  )
}

function minutos(valor: number, vacio?: string): string {
  return valor === 0 && vacio ? vacio : `${valor} min`
}

/** Siete marcas, una por día: rellena cuando el día es laborable. El texto oculto resume el dato para lectores de pantalla. */
function DiasLaborables({ dias }: { dias: DiaTurno[] | null }) {
  if (!dias) return <span className="text-sm text-tinta-tenue">No incluido en el listado</span>

  const laborables = DIAS_SEMANA.filter(({ numero }) => dias.some((d) => d.dia === numero && d.laborable))
  return (
    <>
      <span className="sr-only">
        Días laborables: {laborables.length > 0 ? laborables.map((d) => d.largo).join(', ') : 'ninguno'}
      </span>
      <span aria-hidden="true" className="flex flex-wrap gap-1 sm:max-w-[15.5rem]">
        {DIAS_SEMANA.map(({ numero, corto }) => {
          const activo = dias.some((d) => d.dia === numero && d.laborable)
          return (
            <span
              key={numero}
              className={`inline-flex h-6 min-w-7 items-center justify-center rounded px-1 text-xs font-medium ${
                activo ? 'bg-petroleo-100 text-petroleo-800' : 'text-tinta-tenue ring-1 ring-inset ring-borde'
              }`}
            >
              {corto}
            </span>
          )
        })}
      </span>
    </>
  )
}

function Acciones({ turno, onEditar, onBaja, conIconos = true }: { turno: Turno; conIconos?: boolean } & Omit<Props, 'turnos'>) {
  return (
    <div className="flex gap-1 whitespace-nowrap">
      <Boton
        variante="texto"
        tamano="sm"
        icono={conIconos ? <IconoEditar width={16} height={16} /> : undefined}
        onClick={() => onEditar(turno)}
        aria-label={`Editar el turno ${turno.nombre}`}
      >
        Editar
      </Boton>
      {turno.estado === 'A' && (
        <Boton
          variante="texto"
          tamano="sm"
          className="!text-rojo-700 hover:!bg-rojo-50"
          icono={conIconos ? <IconoBaja width={16} height={16} /> : undefined}
          onClick={() => onBaja(turno)}
          aria-label={`Dar de baja el turno ${turno.nombre}`}
        >
          Dar de baja
        </Boton>
      )}
    </div>
  )
}

export function TablaTurnos({ turnos, onEditar, onBaja }: Props) {
  return (
    <>
      {/* Tabla solo en pantallas anchas: por debajo de 1280 px (con barra lateral) no cabe sin desplazarse */}
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <caption className="sr-only">Lista de turnos</caption>
          <thead className="border-b border-borde bg-niebla/60 text-tinta-suave">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Nombre</th>
              <th scope="col" className="px-3 py-3 font-medium">Horario</th>
              <th scope="col" className="px-3 py-3 font-medium">Tolerancia</th>
              <th scope="col" className="px-3 py-3 font-medium">Refrigerio</th>
              <th scope="col" className="px-3 py-3 font-medium">Días laborables</th>
              <th scope="col" className="px-3 py-3 font-medium">Estado</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {turnos.map((turno) => (
              <tr key={turno.id} className="align-middle hover:bg-niebla/40">
                <th scope="row" className="px-5 py-3.5 font-medium text-tinta">{turno.nombre}</th>
                <td className="px-3 py-3.5"><Horario turno={turno} /></td>
                <td className="px-3 py-3.5 text-tinta">{minutos(turno.toleranciaMin)}</td>
                <td className="px-3 py-3.5 whitespace-nowrap text-tinta">{minutos(turno.refrigerioMin, 'Sin refrigerio')}</td>
                <td className="px-3 py-3.5"><DiasLaborables dias={turno.dias} /></td>
                <td className="px-3 py-3.5"><EstadoTurno turno={turno} /></td>
                <td className="px-3 py-2.5">
                  <div className="flex justify-end">
                    <Acciones turno={turno} onEditar={onEditar} onBaja={onBaja} conIconos={false} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tarjetas en el resto de pantallas: cada turno se lee de arriba hacia abajo, sin desplazamiento horizontal */}
      <ul className="divide-y divide-borde xl:hidden">
        {turnos.map((turno) => (
          <li key={turno.id} className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-tinta">{turno.nombre}</p>
              <EstadoTurno turno={turno} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-tinta-suave">Horario</dt>
                <dd><Horario turno={turno} /></dd>
              </div>
              <div>
                <dt className="text-tinta-suave">Tolerancia</dt>
                <dd className="text-tinta">{minutos(turno.toleranciaMin)}</dd>
              </div>
              <div>
                <dt className="text-tinta-suave">Refrigerio</dt>
                <dd className="text-tinta">{minutos(turno.refrigerioMin, 'Sin refrigerio')}</dd>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <dt className="mb-1 text-tinta-suave">Días laborables</dt>
                <dd><DiasLaborables dias={turno.dias} /></dd>
              </div>
            </dl>
            <Acciones turno={turno} onEditar={onEditar} onBaja={onBaja} />
          </li>
        ))}
      </ul>
    </>
  )
}
