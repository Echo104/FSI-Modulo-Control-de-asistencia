import { useState } from 'react'
import { EncabezadoPagina } from '@/components/layout/EncabezadoPagina'
import { Alerta } from '@/components/ui/Alerta'
import { Boton } from '@/components/ui/Boton'
import { DialogoConfirmacion } from '@/components/ui/DialogoConfirmacion'
import { FilasEsqueleto } from '@/components/ui/Esqueleto'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { IconoMas, IconoTurnos } from '@/components/ui/Iconos'
import { useAvisos } from '@/context/avisos'
import { useDatos } from '@/hooks/useDatos'
import { useTitulo } from '@/hooks/useTitulo'
import { servicios } from '@/services'
import type { FiltroEstadoTurno, Turno } from '@/types/turnos'
import { describirError, type ErrorUi } from '@/utils/errores'
import { pluralizar } from '@/utils/textos'
import { PanelTurno } from './PanelTurno'
import { TablaTurnos } from './TablaTurnos'

type Panel = { modo: 'crear' } | { modo: 'editar'; id: number }

const FILTROS: ReadonlyArray<{ valor: FiltroEstadoTurno; texto: string }> = [
  { valor: 'A', texto: 'Activos' },
  { valor: 'I', texto: 'Inactivos' },
  { valor: 'todos', texto: 'Todos' },
]

const VACIO: Record<FiltroEstadoTurno, { titulo: string; descripcion: string }> = {
  A: {
    titulo: 'Todavía no hay turnos activos',
    descripcion: 'Crea el primer turno para definir el horario base con el que se calculará la asistencia.',
  },
  I: {
    titulo: 'No hay turnos inactivos',
    descripcion: 'Los turnos que des de baja aparecerán aquí. Seguirán guardados, pero no se asignarán a nuevos trabajadores.',
  },
  todos: {
    titulo: 'No hay turnos registrados',
    descripcion: 'Crea el primer turno para empezar.',
  },
}

export function PaginaTurnos() {
  useTitulo('Turnos')
  const { avisar } = useAvisos()
  const [filtro, setFiltro] = useState<FiltroEstadoTurno>('A')
  const [panel, setPanel] = useState<Panel | null>(null)
  const [turnoABaja, setTurnoABaja] = useState<Turno | null>(null)
  const [dandoDeBaja, setDandoDeBaja] = useState(false)
  const [errorBaja, setErrorBaja] = useState<ErrorUi | null>(null)

  const { datos: turnos, cargando, error, recargar } = useDatos(
    (senal) => servicios.turnos.listar(filtro, senal),
    [filtro],
    { accion: 'cargar los turnos' },
  )

  function alGuardar(turno: Turno, modo: 'crear' | 'editar') {
    setPanel(null)
    recargar()
    avisar(
      modo === 'crear'
        ? { tono: 'exito', titulo: 'Turno creado', detalle: `«${turno.nombre}» quedó activo.` }
        : { tono: 'exito', titulo: 'Cambios guardados', detalle: `Se actualizó «${turno.nombre}».` },
    )
  }

  async function confirmarBaja() {
    if (!turnoABaja || dandoDeBaja) return
    setDandoDeBaja(true)
    setErrorBaja(null)
    try {
      await servicios.turnos.darDeBaja(turnoABaja.id)
      avisar({
        tono: 'exito',
        titulo: 'Turno dado de baja',
        detalle: `«${turnoABaja.nombre}» ya no se asignará a nuevos trabajadores.`,
      })
      setTurnoABaja(null)
      recargar()
    } catch (falla) {
      setErrorBaja(describirError(falla, 'dar de baja el turno'))
    } finally {
      setDandoDeBaja(false)
    }
  }

  function cerrarBaja() {
    setTurnoABaja(null)
    setErrorBaja(null)
  }

  const hayDatos = turnos !== null
  const recargando = cargando && hayDatos

  let contenido
  if (error) {
    contenido = (
      <div className="p-5">
        <Alerta
          tono="error"
          titulo={error.titulo}
          etiqueta={error.codigo ?? undefined}
          acciones={
            <Boton variante="secundario" tamano="sm" onClick={recargar}>
              Reintentar
            </Boton>
          }
        >
          {error.mensajes.map((mensaje) => (
            <p key={mensaje}>{mensaje}</p>
          ))}
        </Alerta>
      </div>
    )
  } else if (!hayDatos) {
    contenido = <FilasEsqueleto filas={5} columnas={6} />
  } else if (turnos.length === 0) {
    contenido = (
      <EstadoVacio
        icono={<IconoTurnos />}
        titulo={VACIO[filtro].titulo}
        descripcion={VACIO[filtro].descripcion}
        accion={
          filtro !== 'I' ? (
            <Boton icono={<IconoMas />} onClick={() => setPanel({ modo: 'crear' })}>
              Nuevo turno
            </Boton>
          ) : undefined
        }
      />
    )
  } else {
    contenido = (
      <div aria-busy={recargando} className={recargando ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        <TablaTurnos
          turnos={turnos}
          onEditar={(turno) => setPanel({ modo: 'editar', id: turno.id })}
          onBaja={(turno) => setTurnoABaja(turno)}
        />
      </div>
    )
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Turnos"
        descripcion="Define los horarios base con los que se calculará la asistencia. Un turno dado de baja deja de listarse y no se asigna a nuevos trabajadores."
        acciones={
          <Boton icono={<IconoMas />} onClick={() => setPanel({ modo: 'crear' })}>
            Nuevo turno
          </Boton>
        }
      />

      <section aria-label="Lista de turnos" className="overflow-hidden rounded-lg border border-borde bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borde px-4 py-3 sm:px-5">
          <div role="group" aria-label="Filtrar por estado" className="inline-flex rounded-md bg-niebla p-0.5 ring-1 ring-inset ring-borde">
            {FILTROS.map(({ valor, texto }) => (
              <button
                key={valor}
                type="button"
                aria-pressed={filtro === valor}
                onClick={() => setFiltro(valor)}
                className={`h-9 rounded px-3.5 text-sm font-medium transition-colors ${
                  filtro === valor ? 'bg-white text-petroleo-800 shadow-sm ring-1 ring-borde' : 'text-tinta-suave hover:text-tinta'
                }`}
              >
                {texto}
              </button>
            ))}
          </div>
          <p className="text-sm text-tinta-suave" aria-live="polite">
            {hayDatos && !error ? pluralizar(turnos.length, 'turno', 'turnos') : ''}
          </p>
        </div>
        {contenido}
      </section>

      {panel && (
        <PanelTurno
          modo={panel.modo}
          idTurno={panel.modo === 'editar' ? panel.id : undefined}
          onCerrar={() => setPanel(null)}
          onGuardado={alGuardar}
        />
      )}

      {turnoABaja && (
        <DialogoConfirmacion
          titulo="¿Dar de baja este turno?"
          tono="peligro"
          textoConfirmar="Dar de baja"
          enviando={dandoDeBaja}
          error={errorBaja}
          onConfirmar={confirmarBaja}
          onCancelar={cerrarBaja}
          descripcion={
            <>
              <p>
                Vas a dar de baja el turno <strong className="text-tinta">«{turnoABaja.nombre}»</strong>.
              </p>
              <p>
                Dejará de aparecer en la lista de turnos activos y no podrá asignarse a nuevos trabajadores. El turno no
                se elimina: queda guardado como inactivo.
              </p>
            </>
          }
        />
      )}
    </>
  )
}
