import { NavLink } from 'react-router-dom'
import { ENLACES } from './enlaces'

/** Navegación principal en móvil y tablet: queda al alcance del pulgar. */
export function BarraInferior() {
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-3">
        {ENLACES.map(({ ruta, texto, icono: Icono }) => (
          <li key={ruta}>
            <NavLink
              to={ruta}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 pb-2 pt-2.5 text-xs font-medium ${
                  isActive ? 'text-petroleo-700' : 'text-tinta-suave'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`rounded-full px-5 py-1 transition-colors ${isActive ? 'bg-petroleo-100' : ''}`}>
                    <Icono />
                  </span>
                  {texto}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
