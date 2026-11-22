import { useState } from 'react'
import { Alerta } from '@/components/ui/Alerta'
import { Boton } from '@/components/ui/Boton'
import { ModalBase } from '@/components/ui/ModalBase'
import { Cargando } from '@/components/ui/Spinner'
import { useDatos } from '@/hooks/useDatos'
import { servicios } from '@/services'
import type { Turno } from '@/types/turnos'
import { formularioDesdeTurno, formularioTurnoVacio } from '@/utils/validacionTurno'
import { FormularioTurno } from './FormularioTurno'

interface Props {
  modo: 'crear' | 'editar'
  idTurno?: number
  onCerrar: () => void
  onGuardado: (turno: Turno, modo: 'crear' | 'editar') => void
}

/**
 * Panel lateral para crear o editar un turno. Al editar se pide primero el detalle del turno
 * porque es el que incluye los días laborables (HU-01, CA-08).
 */
export function PanelTurno({ modo, idTurno, onCerrar, onGuardado }: Props) {
  const [guardando, setGuardando] = useState(false)

  const detalle = useDatos(
    (senal) => (modo === 'editar' && idTurno !== undefined ? servicios.turnos.obtener(idTurno, senal) : Promise.resolve(null)),
    [modo, idTurno],
    { accion: 'cargar el turno' },
  )

  const titulo = modo === 'crear' ? 'Nuevo turno' : 'Editar turno'
  const descripcion =
    modo === 'crear'
      ? 'El turno quedará activo al guardarse.'
      : 'Los cambios no modifican las marcaciones ya registradas.'

  let contenido
  if (modo === 'crear') {
    contenido = (
      <FormularioTurno
        modo="crear"
        inicial={formularioTurnoVacio}
        guardando={guardando}
        onGuardando={setGuardando}
        onCancelar={onCerrar}
        onGuardado={(turno) => onGuardado(turno, 'crear')}
      />
    )
  } else if (detalle.error) {
    contenido = (
      <div className="space-y-4 p-5">
        <Alerta tono="error" titulo={detalle.error.titulo} etiqueta={detalle.error.codigo ?? undefined}>
          {detalle.error.mensajes.map((mensaje) => (
            <p key={mensaje}>{mensaje}</p>
          ))}
        </Alerta>
        <div className="flex gap-2">
          {detalle.error.reintentable && (
            <Boton variante="secundario" onClick={detalle.recargar}>
              Reintentar
            </Boton>
          )}
          <Boton variante="texto" onClick={onCerrar}>
            Cerrar
          </Boton>
        </div>
      </div>
    )
  } else if (detalle.datos) {
    contenido = (
      <FormularioTurno
        modo="editar"
        idTurno={idTurno}
        inicial={formularioDesdeTurno(detalle.datos)}
        guardando={guardando}
        onGuardando={setGuardando}
        onCancelar={onCerrar}
        onGuardado={(turno) => onGuardado(turno, 'editar')}
      />
    )
  } else {
    contenido = <Cargando mensaje="Cargando el turno…" />
  }

  return (
    <ModalBase variante="lateral" titulo={titulo} descripcion={descripcion} bloqueado={guardando} onCerrar={onCerrar}>
      {contenido}
    </ModalBase>
  )
}
