import { useRef, useState } from 'react'
import { EncabezadoPagina } from '@/components/layout/EncabezadoPagina'
import { Campo, claseControl } from '@/components/ui/Campo'
import { DialogoConfirmacion } from '@/components/ui/DialogoConfirmacion'
import { IconoEntrada, IconoFinRefrigerio, IconoRefrigerio, IconoSalida } from '@/components/ui/Iconos'
import { useAvisos } from '@/context/AvisosContext'
import { ConPerfil } from '@/context/SesionContext'
import { useTitulo } from '@/hooks/useTitulo'
import { servicios } from '@/services'
import type { PerfilSesion } from '@/types/comun'
import type { Marcacion, TipoMarcacion } from '@/types/marcaciones'
import { describirError, type ErrorUi } from '@/utils/errores'
import { aFechaHoraLima } from '@/utils/fechas'
import { TIPOS_MARCACION } from '@/utils/textos'
import { MAX_OBSERVACION, validarObservacion } from '@/utils/validacionMarcacion'
import { BotonAccion } from './BotonAccion'
import { PanelResultado } from './PanelResultado'

const ETIQUETAS_API = { observacion: 'Observación', trabajador: 'Trabajador', tipo_marcacion: 'Tipo de marcación', dispositivo: 'Dispositivo' }

function ContenidoMarcar({ perfil }: { perfil: PerfilSesion }) {
  const { avisar } = useAvisos()
  const [pendiente, setPendiente] = useState<TipoMarcacion | null>(null)
  const [observacion, setObservacion] = useState('')
  const [errorObservacion, setErrorObservacion] = useState<string | undefined>()
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<ErrorUi | null>(null)
  const [historial, setHistorial] = useState<Marcacion[]>([])

  // La referencia se actualiza al instante; el estado `enviando` tarda un render. Con la referencia
  // un doble clic muy rápido no puede enviar la misma marcación dos veces.
  const envioEnCurso = useRef(false)

  function abrirConfirmacion(tipo: TipoMarcacion) {
    if (envioEnCurso.current) return
    setObservacion('')
    setErrorObservacion(undefined)
    setErrorEnvio(null)
    setPendiente(tipo)
  }

  function cerrarConfirmacion() {
    if (envioEnCurso.current) return
    setPendiente(null)
    setErrorEnvio(null)
  }

  async function confirmar() {
    if (!pendiente || envioEnCurso.current) return

    const problema = validarObservacion(observacion)
    setErrorObservacion(problema)
    if (problema) return

    envioEnCurso.current = true
    setEnviando(true)
    setErrorEnvio(null)
    try {
      const marcacion = await servicios.marcaciones.registrar(perfil.trabajadorId, {
        tipo: pendiente,
        observacion: observacion.trim() || undefined,
      })
      setHistorial((anteriores) => [marcacion, ...anteriores].slice(0, 6))
      setPendiente(null)

      const hora = aFechaHoraLima(marcacion.fechaHoraUtc)
      avisar({
        tono: 'exito',
        titulo: `${TIPOS_MARCACION[marcacion.tipo].nombre} registrada`,
        detalle: hora ? `${hora.hora}, hora de Lima.` : undefined,
      })
    } catch (error) {
      const descrito = describirError(error, 'registrar la marcación', { etiquetasCampo: ETIQUETAS_API })
      setErrorEnvio(descrito)
      if (descrito.porCampo.observacion) setErrorObservacion(descrito.porCampo.observacion.join(' '))
    } finally {
      envioEnCurso.current = false
      setEnviando(false)
    }
  }

  const textos = pendiente ? TIPOS_MARCACION[pendiente] : null
  const longitud = observacion.trim().length

  return (
    <>
      <p className="-mt-3 mb-6 text-[15px] text-tinta-suave">
        Estás registrando como <strong className="font-semibold text-tinta">{perfil.nombre}</strong>.
      </p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-8">
          <section aria-labelledby="titulo-jornada" className="space-y-3">
            <h2 id="titulo-jornada" className="text-base font-semibold text-tinta">
              Jornada
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <BotonAccion tipo="ENT" principal icono={<IconoEntrada width={24} height={24} />} deshabilitado={enviando} onClick={abrirConfirmacion} />
              <BotonAccion tipo="SAL" principal icono={<IconoSalida width={24} height={24} />} deshabilitado={enviando} onClick={abrirConfirmacion} />
            </div>
          </section>

          <section aria-labelledby="titulo-refrigerio" className="space-y-3">
            <h2 id="titulo-refrigerio" className="text-base font-semibold text-tinta">
              Refrigerio
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <BotonAccion tipo="IRF" icono={<IconoRefrigerio width={24} height={24} />} deshabilitado={enviando} onClick={abrirConfirmacion} />
              <BotonAccion tipo="FRF" icono={<IconoFinRefrigerio width={24} height={24} />} deshabilitado={enviando} onClick={abrirConfirmacion} />
            </div>
          </section>

          <p className="max-w-xl text-sm leading-relaxed text-tinta-suave">
            Cada acción te pedirá confirmación. Una vez registrada, la marcación no se puede editar ni eliminar.
          </p>
        </div>

        <PanelResultado ultima={historial[0] ?? null} historial={historial} />
      </div>

      {pendiente && textos && (
        <DialogoConfirmacion
          titulo={`¿${textos.boton}?`}
          textoConfirmar={`Sí, ${textos.boton.toLowerCase()}`}
          enviando={enviando}
          error={errorEnvio}
          onConfirmar={confirmar}
          onCancelar={cerrarConfirmacion}
          descripcion={
            <>
              <p>
                Se registrará <strong className="text-tinta">{textos.enConfirmacion}</strong> con la hora que fije el
                servidor, en hora de Lima.
              </p>
              <p>Una marcación no se puede modificar ni eliminar después.</p>
            </>
          }
        >
          <Campo
            id="observacion-marcacion"
            etiqueta="Observación (opcional)"
            ayuda={`Máximo ${MAX_OBSERVACION} caracteres. No uses | / \\.`}
            error={errorObservacion}
          >
            {(atributos) => (
              <>
                <textarea
                  {...atributos}
                  rows={2}
                  value={observacion}
                  disabled={enviando}
                  onChange={(e) => {
                    setObservacion(e.target.value)
                    setErrorObservacion(undefined)
                  }}
                  className={`${claseControl(Boolean(errorObservacion))} resize-none py-2`}
                />
                <p className={`mt-1 text-right text-xs ${longitud > MAX_OBSERVACION ? 'text-rojo-700' : 'text-tinta-tenue'}`}>
                  {longitud}/{MAX_OBSERVACION}
                </p>
              </>
            )}
          </Campo>
        </DialogoConfirmacion>
      )}
    </>
  )
}

export function PaginaMarcar() {
  useTitulo('Marcar')

  return (
    <>
      <EncabezadoPagina
        titulo="Marcar"
        descripcion="Registra tu entrada, tu salida y tu refrigerio. La hora la fija el servidor: este equipo no puede cambiarla."
      />
      <ConPerfil>{(perfil) => <ContenidoMarcar perfil={perfil} />}</ConPerfil>
    </>
  )
}
