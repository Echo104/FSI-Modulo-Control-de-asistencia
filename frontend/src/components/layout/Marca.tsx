/** Logotipo del módulo: un reloj con la aguja en ámbar. */
export function Marca() {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true" className="shrink-0">
        <rect width="32" height="32" rx="7" fill="#215e69" />
        <circle cx="16" cy="16" r="8.5" fill="none" stroke="#f8e8bf" strokeWidth="2.4" />
        <path
          d="M16 11v5.4l3.4 2"
          fill="none"
          stroke="#d99a1e"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="leading-tight">
        <p className="text-[15px] font-semibold tracking-tight text-white">Control de asistencia</p>
        <p className="text-xs text-petroleo-200">Módulo FSI</p>
      </div>
    </div>
  )
}
