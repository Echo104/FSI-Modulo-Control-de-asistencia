import { useEffect, useState, type FormEvent } from 'react'
import { EncabezadoPagina } from '@/components/layout/EncabezadoPagina'
import { Alerta } from '@/components/ui/Alerta'
import { Boton } from '@/components/ui/Boton'
import { FilasEsqueleto } from '@/components/ui/Esqueleto'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { IconoBuscar } from '@/components/ui/Iconos'
import { Paginacion } from '@/components/ui/Paginacion'
import { ConPerfil } from '@/context/SesionContext'
import { useDatos } from '@/hooks/useDatos'
import { useTitulo } from '@/hooks/useTitulo'
import { servicios } from '@/services'
import type { PerfilSesion } from '@/types/comun'
import { formatearFechaIso, hoyEnLima, primerDiaDelMes, sumarDias } from '@/utils/fechas'
import { pluralizar } from '@/utils/textos'
import { validarFiltros, type ErroresFiltros, type ValoresFiltros } from '@/utils/validacionConsulta'
import { FiltrosConsulta, type RangoRapido } from './FiltrosConsulta'
import { TablaMarcaciones } from './TablaMarcaciones'

interface FiltrosAplicados {
  trabajadorId: number | undefined
  desde: string
  hasta: string
}

function rangoPorDefecto(): { desde: string; hasta: string } {
  const hoy = hoyEnLima()
  return { desde: sumarDias(hoy, -6), hasta: hoy }
}

function ContenidoConsulta({ perfil }: { perfil: PerfilSesion }) {
  // Se calcula una sola vez al abrir la pantalla.
  const [inicial] = useState(rangoPorDefecto)
  const [valores, setValores] = useState<ValoresFiltros>({ trabajadorId: '', ...inicial })
  const [errores, setErrores] = useState<ErroresFiltros>({})
  const [aplicados, setAplicados] = useState<FiltrosAplicados>({ trabajadorId: undefined, ...inicial })
  const [pagina, setPagina] = useState(1)
  const [tamanoPagina, setTamanoPagina] = useState<number | null>(null)

  // Listado para el filtro de RR. HH. (las demás personas no lo necesitan).
  const trabajadores = useDatos(
    (senal) => (perfil.esRrhh ? servicios.trabajadores.listar(senal) : Promise.resolve([])),
    [perfil.esRrhh],
    { accion: 'cargar el listado de trabajadores' },
  )

  const consulta = useDatos(
    (senal) =>
      servicios.marcaciones.consultar(
        {
          // Quien no es de RR. HH. consulta siempre sus propias marcaciones.
          trabajadorId: perfil.esRrhh ? aplicados.trabajadorId : perfil.trabajadorId,
          desde: aplicados.desde,
          hasta: aplicados.hasta,
          pagina,
        },
        senal,
      ),
    [aplicados, pagina],
    {
      accion: 'consultar las marcaciones',
      conservarDatos: true,
      mensajesPorEstado: {
        403: 'No tienes permiso para consultar las marcaciones de otro trabajador.',
        404: 'El trabajador seleccionado no existe. Elige otro o consulta a todo el personal.',
      },
    },
  )

  // La API solo informa la cantidad total y si hay página siguiente; el tamaño de página se deduce de la primera.
  useEffect(() => {
    const datos = consulta.datos
    // Se conserva el tamaño deducido de la primera página para calcular el total.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (datos && datos.pagina === 1 && datos.haySiguiente) setTamanoPagina(datos.resultados.length)
  }, [consulta.datos])

  function aplicar(nuevos: ValoresFiltros) {
    setPagina(1)
    setAplicados({
      trabajadorId: nuevos.trabajadorId.trim() === '' ? undefined : Number(nuevos.trabajadorId),
      desde: nuevos.desde,
      hasta: nuevos.hasta,
    })
  }

  function consultar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const encontrados = validarFiltros(valores)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) {
      const primero = (['trabajadorId', 'desde', 'hasta'] as const).find((campo) => encontrados[campo])
      const ids = { trabajadorId: 'filtro-trabajador', desde: 'filtro-desde', hasta: 'filtro-hasta' }
      if (primero) document.getElementById(ids[primero])?.focus()
      return
    }
    aplicar(valores)
  }

  function usarRango(rango: RangoRapido) {
    const hoy = hoyEnLima()
    const nuevoRango =
      rango === 'hoy'
        ? { desde: hoy, hasta: hoy }
        : rango === 'siete-dias'
          ? { desde: sumarDias(hoy, -6), hasta: hoy }
          : { desde: primerDiaDelMes(hoy), hasta: hoy }
    const nuevos = { ...valores, ...nuevoRango }
    setValores(nuevos)
    setErrores({})
    aplicar(nuevos)
  }

  function limpiar() {
    const nuevos = { trabajadorId: '', ...rangoPorDefecto() }
    setValores(nuevos)
    setErrores({})
    aplicar(nuevos)
  }

  const datos = consulta.datos
  const nombreTrabajador =
    perfil.esRrhh && aplicados.trabajadorId !== undefined
      ? (trabajadores.datos?.find((t) => t.id === aplicados.trabajadorId)?.nombre ?? `el trabajador ${aplicados.trabajadorId}`)
      : null
  const recargando = consulta.cargando && datos !== null
  const tamanoParaMostrar = tamanoPagina ?? (datos && !datos.haySiguiente && !datos.hayAnterior ? datos.resultados.length : null)

  let resultado
  if (consulta.error) {
    resultado = (
      <div className="p-5">
        <Alerta
          tono="error"
          titulo={consulta.error.titulo}
          etiqueta={consulta.error.codigo ?? undefined}
          acciones={
            consulta.error.reintentable ? (
              <Boton variante="secundario" tamano="sm" onClick={consulta.recargar}>
                Reintentar
              </Boton>
            ) : undefined
          }
        >
          {consulta.error.mensajes.map((mensaje) => (
            <p key={mensaje}>{mensaje}</p>
          ))}
        </Alerta>
      </div>
    )
  } else if (datos === null) {
    resultado = <FilasEsqueleto filas={6} columnas={6} />
  } else if (datos.resultados.length === 0) {
    resultado = (
      <EstadoVacio
        icono={<IconoBuscar />}
        titulo="No hay marcaciones en este rango"
        descripcion={`No encontramos marcaciones entre el ${formatearFechaIso(aplicados.desde)} y el ${formatearFechaIso(aplicados.hasta)}${
          nombreTrabajador ? ` para ${nombreTrabajador}` : ''
        }. Prueba con otro rango de fechas${perfil.esRrhh ? ' o con otro trabajador' : ''}.`}
      />
    )
  } else {
    resultado = (
      <>
        <div aria-busy={recargando} className={recargando ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <TablaMarcaciones marcaciones={datos.resultados} />
        </div>
        <Paginacion
          pagina={datos.pagina}
          total={datos.total}
          tamanoPagina={tamanoParaMostrar}
          cantidadEnPagina={datos.resultados.length}
          nombrePlural="marcaciones"
          hayAnterior={datos.hayAnterior}
          haySiguiente={datos.haySiguiente}
          cargando={consulta.cargando}
          onCambiar={setPagina}
        />
      </>
    )
  }

  return (
    <div className="space-y-5">
      <FiltrosConsulta
        perfil={perfil}
        valores={valores}
        errores={errores}
        trabajadores={{ datos: trabajadores.datos, cargando: trabajadores.cargando, error: trabajadores.error }}
        consultando={consulta.cargando}
        onCambiar={(campo, valor) => setValores((actuales) => ({ ...actuales, [campo]: valor }))}
        onConsultar={consultar}
        onRangoRapido={usarRango}
        onLimpiar={limpiar}
      />

      <section aria-label="Resultados de la consulta" className="overflow-hidden rounded-lg border border-borde bg-white">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-borde px-4 py-3 text-sm sm:px-5">
          <p className="font-medium text-tinta" aria-live="polite">
            {datos && !consulta.error
              ? `${pluralizar(datos.total, 'marcación', 'marcaciones')} del ${formatearFechaIso(aplicados.desde)} al ${formatearFechaIso(aplicados.hasta)}`
              : 'Resultados'}
          </p>
          <p className="text-tinta-suave">Orden cronológico: de la más antigua a la más reciente</p>
        </div>
        {resultado}
      </section>
    </div>
  )
}

export function PaginaConsulta() {
  useTitulo('Consulta')

  return (
    <>
      <EncabezadoPagina
        titulo="Consulta"
        descripcion="Revisa las marcaciones por rango de fechas. Las horas se muestran en hora de Lima."
      />
      {/* Al cambiar de perfil se empieza de cero: la `key` vuelve a montar la pantalla con filtros limpios. */}
      <ConPerfil>
        {(perfil) => <ContenidoConsulta key={`${perfil.trabajadorId}-${perfil.esRrhh}`} perfil={perfil} />}
      </ConPerfil>
    </>
  )
}
