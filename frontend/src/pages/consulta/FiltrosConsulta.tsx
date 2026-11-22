import type { FormEvent } from 'react'
import { Alerta } from '@/components/ui/Alerta'
import { Boton } from '@/components/ui/Boton'
import { Campo } from '@/components/ui/Campo'
import { claseControl } from '@/components/ui/claseControl'
import { IconoBuscar } from '@/components/ui/Iconos'
import type { PerfilSesion, Trabajador } from '@/types/comun'
import type { ErrorUi } from '@/utils/errores'
import type { ErroresFiltros, ValoresFiltros } from '@/utils/validacionConsulta'

export type RangoRapido = 'hoy' | 'siete-dias' | 'mes'

interface Props {
  perfil: PerfilSesion
  valores: ValoresFiltros
  errores: ErroresFiltros
  /** Listado de trabajadores para RR. HH. (solo se pide si el perfil es de RR. HH.). */
  trabajadores: { datos: Trabajador[] | null; cargando: boolean; error: ErrorUi | null }
  consultando: boolean
  onCambiar: (campo: keyof ValoresFiltros, valor: string) => void
  onConsultar: (evento: FormEvent<HTMLFormElement>) => void
  onRangoRapido: (rango: RangoRapido) => void
  onLimpiar: () => void
}

export function FiltrosConsulta({
  perfil,
  valores,
  errores,
  trabajadores,
  consultando,
  onCambiar,
  onConsultar,
  onRangoRapido,
  onLimpiar,
}: Props) {
  // Si la API aún no publica el listado, RR. HH. puede escribir el ID del trabajador.
  const listadoNoDisponible = perfil.esRrhh && trabajadores.error !== null

  return (
    <form onSubmit={onConsultar} noValidate className="rounded-lg border border-borde bg-white p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
        {!perfil.esRrhh && (
          <Campo
            id="filtro-trabajador"
            etiqueta="Trabajador"
            ayuda="Solo puedes consultar tus propias marcaciones."
          >
            {(atributos) => (
              <input {...atributos} type="text" readOnly value={perfil.nombre} className={`${claseControl()} h-11 bg-niebla sm:h-10`} />
            )}
          </Campo>
        )}

        {perfil.esRrhh && !listadoNoDisponible && (
          <Campo
            id="filtro-trabajador"
            etiqueta="Trabajador"
            ayuda="Déjalo en «Todos» para ver a todo el personal."
          >
            {(atributos) => (
              <select
                {...atributos}
                value={valores.trabajadorId}
                disabled={trabajadores.cargando}
                onChange={(e) => onCambiar('trabajadorId', e.target.value)}
                className={`${claseControl()} h-11 sm:h-10`}
              >
                <option value="">{trabajadores.cargando ? 'Cargando trabajadores…' : 'Todos los trabajadores'}</option>
                {(trabajadores.datos ?? []).map((trabajador) => (
                  <option key={trabajador.id} value={trabajador.id}>
                    {trabajador.nombre}
                  </option>
                ))}
              </select>
            )}
          </Campo>
        )}

        {listadoNoDisponible && (
          <Campo
            id="filtro-trabajador"
            etiqueta="ID del trabajador (opcional)"
            ayuda="El listado de trabajadores aún no está disponible. Si lo dejas vacío se consulta a todo el personal."
            error={errores.trabajadorId}
          >
            {(atributos) => (
              <input
                {...atributos}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={valores.trabajadorId}
                onChange={(e) => onCambiar('trabajadorId', e.target.value)}
                className={`${claseControl(Boolean(errores.trabajadorId))} h-11 sm:h-10`}
              />
            )}
          </Campo>
        )}

        {/* En móvil las dos fechas comparten fila; desde sm cada una ocupa su columna de la cuadrícula. */}
        <div className="grid grid-cols-2 gap-3 sm:contents">
          <Campo id="filtro-desde" etiqueta="Desde" obligatorio error={errores.desde}>
            {(atributos) => (
              <input
                {...atributos}
                type="date"
                value={valores.desde}
                onChange={(e) => onCambiar('desde', e.target.value)}
                className={`${claseControl(Boolean(errores.desde))} h-11 sm:h-10`}
              />
            )}
          </Campo>

          <Campo id="filtro-hasta" etiqueta="Hasta" obligatorio error={errores.hasta}>
            {(atributos) => (
              <input
                {...atributos}
                type="date"
                value={valores.hasta}
                onChange={(e) => onCambiar('hasta', e.target.value)}
                className={`${claseControl(Boolean(errores.hasta))} h-11 sm:h-10`}
              />
            )}
          </Campo>
        </div>
      </div>

      {perfil.esRrhh && trabajadores.error && trabajadores.error.codigo !== 'Configuración pendiente' && (
        <Alerta tono="aviso" titulo={trabajadores.error.titulo} className="mt-4">
          {trabajadores.error.mensajes.map((mensaje) => (
            <p key={mensaje}>{mensaje}</p>
          ))}
        </Alerta>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
          <span className="mr-1 text-tinta-suave">Rango rápido:</span>
          <Boton variante="texto" tamano="sm" onClick={() => onRangoRapido('hoy')}>Hoy</Boton>
          <Boton variante="texto" tamano="sm" onClick={() => onRangoRapido('siete-dias')}>Últimos 7 días</Boton>
          <Boton variante="texto" tamano="sm" onClick={() => onRangoRapido('mes')}>Este mes</Boton>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Boton variante="secundario" className="flex-1 sm:flex-none" onClick={onLimpiar} disabled={consultando}>
            Limpiar
          </Boton>
          <Boton type="submit" className="flex-1 sm:flex-none" cargando={consultando} icono={<IconoBuscar width={18} height={18} />}>
            Consultar
          </Boton>
        </div>
      </div>

      <p className="mt-3 text-sm text-tinta-suave">
        El rango incluye ambos días y se interpreta en hora de Lima.
      </p>
    </form>
  )
}
