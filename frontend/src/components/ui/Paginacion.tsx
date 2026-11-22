import { Boton } from './Boton'
import { IconoChevronDerecha, IconoChevronIzquierda } from './Iconos'

interface Props {
  pagina: number
  total: number
  /** Cantidad de filas por página, si se pudo deducir de la respuesta de la API. */
  tamanoPagina: number | null
  cantidadEnPagina: number
  nombrePlural: string
  hayAnterior: boolean
  haySiguiente: boolean
  cargando?: boolean
  onCambiar: (pagina: number) => void
}

export function Paginacion({
  pagina,
  total,
  tamanoPagina,
  cantidadEnPagina,
  nombrePlural,
  hayAnterior,
  haySiguiente,
  cargando = false,
  onCambiar,
}: Props) {
  const totalPaginas = tamanoPagina ? Math.max(1, Math.ceil(total / tamanoPagina)) : null
  const inicio = tamanoPagina ? (pagina - 1) * tamanoPagina + 1 : null
  const fin = inicio !== null ? inicio + cantidadEnPagina - 1 : null

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col gap-3 border-t border-borde px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-tinta-suave" aria-live="polite">
        {inicio !== null && fin !== null && cantidadEnPagina > 0
          ? `Mostrando del ${inicio} al ${fin} de ${total} ${nombrePlural}`
          : `${total} ${nombrePlural}`}
      </p>
      <div className="flex items-center gap-2">
        <Boton
          variante="secundario"
          tamano="sm"
          disabled={!hayAnterior || cargando}
          onClick={() => onCambiar(pagina - 1)}
          icono={<IconoChevronIzquierda width={16} height={16} />}
        >
          Anterior
        </Boton>
        <span className="min-w-24 text-center text-sm text-tinta">
          {totalPaginas ? `Página ${pagina} de ${totalPaginas}` : `Página ${pagina}`}
        </span>
        <Boton variante="secundario" tamano="sm" disabled={!haySiguiente || cargando} onClick={() => onCambiar(pagina + 1)}>
          Siguiente
          <IconoChevronDerecha width={16} height={16} />
        </Boton>
      </div>
    </nav>
  )
}
