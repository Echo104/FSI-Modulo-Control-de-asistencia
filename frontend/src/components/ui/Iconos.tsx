import type { SVGProps } from 'react'

/** Iconos de trazo propios del proyecto (24×24). Heredan el color del texto (currentColor). */
function Base({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

type Props = SVGProps<SVGSVGElement>

export const IconoTurnos = (p: Props) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <path d="M8 14h3M8 17h6" />
  </Base>
)

export const IconoMarcar = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
)

export const IconoConsulta = (p: Props) => (
  <Base {...p}>
    <path d="M4 6h11M4 11h6M4 16h7" />
    <circle cx="17" cy="15" r="3.5" />
    <path d="M19.6 17.6L22 20" />
  </Base>
)

export const IconoEntrada = (p: Props) => (
  <Base {...p}>
    <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" />
    <path d="M4 12h10M10.5 8.5L14 12l-3.5 3.5" />
  </Base>
)

export const IconoSalida = (p: Props) => (
  <Base {...p}>
    <path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" />
    <path d="M10 12h10M16.5 8.5L20 12l-3.5 3.5" />
  </Base>
)

export const IconoRefrigerio = (p: Props) => (
  <Base {...p}>
    <path d="M4.5 8.5h11v5.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 4.5 14V8.5z" />
    <path d="M15.5 10h1.5a2.5 2.5 0 0 1 0 5h-1.5" />
    <path d="M8 3.5v2M12 3.5v2" />
  </Base>
)

export const IconoFinRefrigerio = (p: Props) => (
  <Base {...p}>
    <path d="M4.5 8.5h11v5.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 4.5 14V8.5z" />
    <path d="M15.5 10h1.5a2.5 2.5 0 0 1 0 5h-1.5" />
    <path d="M7.5 13.2l1.9 1.9 3.2-3.4" />
  </Base>
)

export const IconoMas = (p: Props) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
)

export const IconoEditar = (p: Props) => (
  <Base {...p}>
    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
    <path d="M13.5 6.5l3 3" />
  </Base>
)

export const IconoBaja = (p: Props) => (
  <Base {...p}>
    <rect x="3.5" y="4.5" width="17" height="4.5" rx="1" />
    <path d="M5 9v9a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V9M10 13h4" />
  </Base>
)

export const IconoCerrar = (p: Props) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
)

export const IconoAlerta = (p: Props) => (
  <Base {...p}>
    <path d="M12 4l9 15.5H3L12 4z" />
    <path d="M12 10v4M12 17v.01" />
  </Base>
)

export const IconoCheck = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12.2l2.4 2.4 4.6-4.9" />
  </Base>
)

export const IconoInfo = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8v.01" />
  </Base>
)

export const IconoRefrescar = (p: Props) => (
  <Base {...p}>
    <path d="M20 11a8 8 0 0 0-14-4.5L4 9" />
    <path d="M4 4v5h5" />
    <path d="M4 13a8 8 0 0 0 14 4.5L20 15" />
    <path d="M20 20v-5h-5" />
  </Base>
)

export const IconoChevronIzquierda = (p: Props) => (
  <Base {...p}>
    <path d="M14.5 6l-6 6 6 6" />
  </Base>
)

export const IconoChevronDerecha = (p: Props) => (
  <Base {...p}>
    <path d="M9.5 6l6 6-6 6" />
  </Base>
)

export const IconoMatraz = (p: Props) => (
  <Base {...p}>
    <path d="M9 3.5h6M10 3.5v5.2L5 18a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9.3V3.5" />
    <path d="M7.5 15h9" />
  </Base>
)

export const IconoBuscar = (p: Props) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Base>
)
