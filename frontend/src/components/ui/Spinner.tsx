import type { SVGProps } from 'react'

export function Spinner({ className = '', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      aria-hidden="true"
      className={`animate-spin ${className}`}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** Bloque de carga para una sección completa; se anuncia a los lectores de pantalla. */
export function Cargando({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-tinta-suave">
      <Spinner width={22} height={22} className="text-petroleo-600" />
      <span className="text-sm">{mensaje}</span>
    </div>
  )
}
