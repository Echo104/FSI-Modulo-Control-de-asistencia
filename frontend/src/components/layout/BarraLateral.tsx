import { NavLink } from 'react-router-dom'
import { useSesion } from '@/context/sesion'
import { entorno, esModoDemo } from '@/config/entorno'
import { IconoMatraz } from '@/components/ui/Iconos'
import { ENLACES } from './enlaces'
import { Marca } from './Marca'

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('')
}

function PiePerfil() {
  const { perfil } = useSesion()

  return (
    <div className="space-y-3 border-t border-white/10 p-4">
      {esModoDemo ? (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-ambar-500/15 px-2.5 py-1 text-xs font-medium text-ambar-200">
          <IconoMatraz width={14} height={14} />
          Modo demostración
        </p>
      ) : (
        <p className="text-xs text-petroleo-200">
          Modo API
          <span className="block truncate text-petroleo-300">{entorno.urlBaseApi}</span>
        </p>
      )}
      {perfil && (
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ambar-100 text-sm font-semibold text-ambar-800"
          >
            {iniciales(perfil.nombre)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-white">{perfil.nombre}</p>
            <p className="text-xs text-petroleo-200">{perfil.esRrhh ? 'Personal de RR. HH.' : 'Trabajador'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/** Navegación principal en pantallas grandes. */
export function BarraLateral() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-petroleo-900 lg:flex">
      <div className="px-5 pb-8 pt-7">
        <Marca />
      </div>
      <nav aria-label="Secciones" className="flex-1 px-3">
        <ul className="space-y-1">
          {ENLACES.map(({ ruta, texto, icono: Icono }) => (
            <li key={ruta}>
              <NavLink
                to={ruta}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-petroleo-100 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-ambar-500" />
                    )}
                    <Icono />
                    {texto}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <PiePerfil />
    </aside>
  )
}
