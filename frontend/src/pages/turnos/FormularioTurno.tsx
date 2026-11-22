import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Alerta } from '@/components/ui/Alerta'
import { Boton } from '@/components/ui/Boton'
import { Campo } from '@/components/ui/Campo'
import { claseControl } from '@/components/ui/claseControl'
import { servicios } from '@/services'
import type { CampoFormularioTurno, ErroresFormularioTurno, FormularioTurno as DatosFormulario, Turno } from '@/types/turnos'
import { describirError, type ErrorUi } from '@/utils/errores'
import {
  advertenciaHorarioTurno,
  LIMITES_TURNO,
  ORDEN_CAMPOS_TURNO,
  validarFormularioTurno,
} from '@/utils/validacionTurno'
import { SelectorDias } from './SelectorDias'

/** Campos del formulario tal como los nombra la API, para repartir los errores 400 en cada campo. */
const CAMPO_API_A_FORMULARIO: Record<string, CampoFormularioTurno> = {
  nombre: 'nombre',
  hora_entrada: 'horaEntrada',
  hora_salida: 'horaSalida',
  cruza_medianoche: 'cruzaMedianoche',
  tolerancia_min: 'toleranciaMin',
  refrigerio_min: 'refrigerioMin',
  dias: 'diasLaborables',
}

const ETIQUETAS_API: Record<string, string> = {
  nombre: 'Nombre',
  hora_entrada: 'Hora de entrada',
  hora_salida: 'Hora de salida',
  cruza_medianoche: 'Cruce de medianoche',
  tolerancia_min: 'Tolerancia',
  refrigerio_min: 'Refrigerio',
  dias: 'Días laborables',
}

interface Props {
  modo: 'crear' | 'editar'
  idTurno?: number
  inicial: DatosFormulario
  guardando: boolean
  onGuardando: (guardando: boolean) => void
  onCancelar: () => void
  onGuardado: (turno: Turno) => void
}

function idCampo(campo: CampoFormularioTurno): string {
  return `turno-${campo}`
}

export function FormularioTurno({ modo, idTurno, inicial, guardando, onGuardando, onCancelar, onGuardado }: Props) {
  const [valores, setValores] = useState<DatosFormulario>(inicial)
  const [erroresCliente, setErroresCliente] = useState<ErroresFormularioTurno>({})
  const [errorServidor, setErrorServidor] = useState<ErrorUi | null>(null)
  const [intentado, setIntentado] = useState(false)
  const enviando = useRef(false)
  const zonaError = useRef<HTMLDivElement>(null)

  // Reparte los errores 400 del servidor en los campos correspondientes.
  const erroresServidor = useMemo(() => {
    const resultado: ErroresFormularioTurno = {}
    for (const [campoApi, mensajes] of Object.entries(errorServidor?.porCampo ?? {})) {
      const campo = CAMPO_API_A_FORMULARIO[campoApi]
      if (campo) resultado[campo] = mensajes.join(' ')
    }
    return resultado
  }, [errorServidor])

  // Los errores de un campo se muestran junto a ese campo; el aviso superior recoge solo lo que no pertenece a ninguno.
  const mensajesGenerales = useMemo(() => {
    if (!errorServidor) return []
    const yaMostrados = new Set<string>()
    for (const [campoApi, mensajes] of Object.entries(errorServidor.porCampo)) {
      if (!CAMPO_API_A_FORMULARIO[campoApi]) continue
      for (const mensaje of mensajes) yaMostrados.add(`${ETIQUETAS_API[campoApi] ?? campoApi}: ${mensaje}`)
    }
    const restantes = errorServidor.mensajes.filter((mensaje) => !yaMostrados.has(mensaje))
    if (restantes.length === 0 && yaMostrados.size > 0) return ['Corrige los campos marcados en rojo e inténtalo de nuevo.']
    return restantes
  }, [errorServidor])

  useEffect(() => {
    if (errorServidor) zonaError.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [errorServidor])

  const advertencia = advertenciaHorarioTurno(valores)
  const errorDe = (campo: CampoFormularioTurno) => erroresCliente[campo] ?? erroresServidor[campo]

  function cambiar<K extends CampoFormularioTurno>(campo: K, valor: DatosFormulario[K]) {
    const siguiente = { ...valores, [campo]: valor }
    setValores(siguiente)
    // Tras el primer intento de guardar, los errores se actualizan mientras la persona corrige.
    if (intentado) setErroresCliente(validarFormularioTurno(siguiente).errores)
    if (errorServidor?.porCampo) setErrorServidor(null)
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando.current) return // evita el doble envío (doble clic o Enter repetido)

    setIntentado(true)
    setErrorServidor(null)
    const { errores, datos } = validarFormularioTurno(valores)
    setErroresCliente(errores)

    if (!datos) {
      const primero = ORDEN_CAMPOS_TURNO.find((campo) => errores[campo])
      if (primero) document.getElementById(idCampo(primero))?.focus()
      return
    }

    enviando.current = true
    onGuardando(true)
    try {
      const turno =
        modo === 'crear'
          ? await servicios.turnos.crear(datos)
          : await servicios.turnos.actualizar(idTurno ?? 0, datos)
      onGuardado(turno)
    } catch (error) {
      setErrorServidor(
        describirError(error, modo === 'crear' ? 'crear el turno' : 'guardar los cambios', {
          etiquetasCampo: ETIQUETAS_API,
        }),
      )
    } finally {
      enviando.current = false
      onGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <p className="text-sm text-tinta-suave">
          Los campos con <span className="text-rojo-700">*</span> son obligatorios.
        </p>

        {errorServidor && (
          <div ref={zonaError}>
            <Alerta tono="error" titulo={errorServidor.titulo} etiqueta={errorServidor.codigo ?? undefined}>
              {mensajesGenerales.map((mensaje) => (
                <p key={mensaje}>{mensaje}</p>
              ))}
            </Alerta>
          </div>
        )}

        <Campo id={idCampo('nombre')} etiqueta="Nombre del turno" obligatorio error={errorDe('nombre')}>
          {(atributos) => (
            <input
              {...atributos}
              type="text"
              autoComplete="off"
              value={valores.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              disabled={guardando}
              placeholder="Por ejemplo: Administrativo diurno"
              className={`${claseControl(Boolean(errorDe('nombre')))} h-11 sm:h-10`}
            />
          )}
        </Campo>

        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          <Campo id={idCampo('horaEntrada')} etiqueta="Hora de entrada" obligatorio error={errorDe('horaEntrada')}>
            {(atributos) => (
              <input
                {...atributos}
                type="time"
                value={valores.horaEntrada}
                onChange={(e) => cambiar('horaEntrada', e.target.value)}
                disabled={guardando}
                className={`${claseControl(Boolean(errorDe('horaEntrada')))} h-11 sm:h-10`}
              />
            )}
          </Campo>
          <Campo id={idCampo('horaSalida')} etiqueta="Hora de salida" obligatorio error={errorDe('horaSalida')}>
            {(atributos) => (
              <input
                {...atributos}
                type="time"
                value={valores.horaSalida}
                onChange={(e) => cambiar('horaSalida', e.target.value)}
                disabled={guardando}
                className={`${claseControl(Boolean(errorDe('horaSalida')))} h-11 sm:h-10`}
              />
            )}
          </Campo>
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              id={idCampo('cruzaMedianoche')}
              type="checkbox"
              checked={valores.cruzaMedianoche}
              onChange={(e) => cambiar('cruzaMedianoche', e.target.checked)}
              disabled={guardando}
              className="mt-0.5 size-5 shrink-0 rounded border-borde-fuerte accent-petroleo-700"
            />
            <span className="text-sm">
              <span className="font-medium text-tinta">El turno cruza la medianoche</span>
              <span className="mt-0.5 block text-tinta-suave">
                Márcalo si la salida ocurre al día siguiente, por ejemplo de 22:00 a 06:00.
              </span>
            </span>
          </label>
          {advertencia && (
            <Alerta tono="aviso" titulo="Revisa el horario" className="mt-3">
              <p>{advertencia}</p>
            </Alerta>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          <Campo
            id={idCampo('toleranciaMin')}
            etiqueta="Tolerancia (minutos)"
            obligatorio
            ayuda={`Entre 0 y ${LIMITES_TURNO.toleranciaMax} minutos.`}
            error={errorDe('toleranciaMin')}
          >
            {(atributos) => (
              <input
                {...atributos}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={valores.toleranciaMin}
                onChange={(e) => cambiar('toleranciaMin', e.target.value)}
                disabled={guardando}
                className={`${claseControl(Boolean(errorDe('toleranciaMin')))} h-11 sm:h-10`}
              />
            )}
          </Campo>
          <Campo
            id={idCampo('refrigerioMin')}
            etiqueta="Refrigerio (minutos)"
            obligatorio
            ayuda={`Entre 0 y ${LIMITES_TURNO.refrigerioMax} minutos.`}
            error={errorDe('refrigerioMin')}
          >
            {(atributos) => (
              <input
                {...atributos}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={valores.refrigerioMin}
                onChange={(e) => cambiar('refrigerioMin', e.target.value)}
                disabled={guardando}
                className={`${claseControl(Boolean(errorDe('refrigerioMin')))} h-11 sm:h-10`}
              />
            )}
          </Campo>
        </div>

        <SelectorDias
          id={idCampo('diasLaborables')}
          valor={valores.diasLaborables}
          error={errorDe('diasLaborables')}
          onCambiar={(dias) => cambiar('diasLaborables', dias)}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-borde bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
        <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={guardando}>
          {modo === 'crear' ? 'Crear turno' : 'Guardar cambios'}
        </Boton>
      </div>
    </form>
  )
}
