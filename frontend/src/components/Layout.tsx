import { NavLink, Outlet } from 'react-router-dom'

const enlaces = [
  { to: '/turnos', texto: 'Turnos' },
  { to: '/marcar', texto: 'Marcar' },
  { to: '/consulta', texto: 'Consulta' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-blue-700 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <h1 className="text-lg font-semibold">Control de Asistencia</h1>
          <nav className="flex gap-4">
            {enlaces.map((e) => (
              <NavLink
                key={e.to}
                to={e.to}
                className={({ isActive }) =>
                  isActive ? 'font-semibold underline' : 'hover:underline'
                }
              >
                {e.texto}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  )
}