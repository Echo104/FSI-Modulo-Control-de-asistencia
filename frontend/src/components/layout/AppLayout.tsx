import { Outlet } from 'react-router-dom'
import { useSyncExternalStore } from 'react'
import { obtenerInstantaneaDemo, suscribirDemo } from '@/services/demo/estadoDemo'
import { BannerDemo } from './BannerDemo'
import { BarraInferior } from './BarraInferior'
import { BarraLateral } from './BarraLateral'
import { Marca } from './Marca'

/**
 * Estructura común: barra lateral en escritorio, cabecera y barra inferior en móvil.
 * El contenido de cada sección se dibuja en <Outlet />.
 */
export function AppLayout() {
  // Al restablecer los datos de demostración, las pantallas se montan de nuevo con datos limpios.
  const { version } = useSyncExternalStore(suscribirDemo, obtenerInstantaneaDemo)

  return (
    <div className="min-h-dvh lg:pl-64">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      <BarraLateral />

      <header className="sticky top-0 z-20 flex items-center gap-3 bg-petroleo-900 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] lg:hidden">
        <Marca />
      </header>

      <BannerDemo />

      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-14 lg:pt-10"
      >
        <Outlet key={version} />
      </main>

      <BarraInferior />
    </div>
  )
}
