import { useEffect, useRef, useSyncExternalStore } from 'react'
import { esModoDemo } from '@/config/entorno'
import {
  armarFalloDemo,
  fijarPerfilDemo,
  obtenerInstantaneaDemo,
  PERFILES_DEMO,
  restablecerDatosDemo,
  suscribirDemo,
  type PerfilDemoId,
} from '@/services/demo/estadoDemo'
import { Boton } from '@/components/ui/Boton'
import { claseControl } from '@/components/ui/Campo'
import { IconoMatraz } from '@/components/ui/Iconos'

/**
 * Aviso permanente de que los datos son simulados, con herramientas para evaluar las pantallas:
 * cambiar de perfil, provocar errores y restablecer los datos. Solo existe en modo demostración.
 */
export function BannerDemo() {
  const instantanea = useSyncExternalStore(suscribirDemo, obtenerInstantaneaDemo)
  const detalles = useRef<HTMLDetailsElement>(null)

  // Cierra el panel al hacer clic fuera de él.
  useEffect(() => {
    function alPulsar(evento: PointerEvent) {
      const panel = detalles.current
      if (panel?.open && evento.target instanceof Node && !panel.contains(evento.target)) panel.open = false
    }
    document.addEventListener('pointerdown', alPulsar)
    return () => document.removeEventListener('pointerdown', alPulsar)
  }, [])

  if (!esModoDemo) return null

  return (
    <div className="border-b border-ambar-200 bg-ambar-50 text-ambar-800">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-sm sm:px-6 lg:px-10">
        <IconoMatraz className="shrink-0" width={18} height={18} />
        <p className="min-w-0 flex-1 basis-64">
          <strong className="font-semibold">Modo demostración.</strong>{' '}
          <span className="sm:hidden">Los datos son simulados.</span>
          <span className="hidden sm:inline">
            Los datos son simulados y no se guardan: al recargar la página vuelven a su estado inicial.
          </span>
        </p>

        <details ref={detalles} className="relative">
          <summary className="inline-flex list-none items-center rounded-md border border-ambar-200 bg-white px-3 py-1 font-medium text-ambar-800 hover:bg-ambar-100 [&::-webkit-details-marker]:hidden">
            Herramientas de demostración
          </summary>
          <div className="fixed inset-x-4 z-40 mt-2 space-y-5 rounded-lg border border-borde bg-white p-4 text-tinta shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:w-[24rem]">
            <div>
              <label htmlFor="demo-perfil" className="mb-1.5 block font-medium">
                Usar la aplicación como
              </label>
              <select
                id="demo-perfil"
                value={instantanea.perfilId}
                onChange={(evento) => fijarPerfilDemo(evento.target.value as PerfilDemoId)}
                className={`${claseControl()} h-10`}
              >
                <option value="rrhh">Personal de RR. HH. ({PERFILES_DEMO.rrhh.nombre})</option>
                <option value="trabajador">Trabajador ({PERFILES_DEMO.trabajador.nombre})</option>
              </select>
              <p className="mt-1.5 text-tinta-suave">
                En Consulta, solo RR. HH. puede elegir a otro trabajador.
              </p>
            </div>

            <div>
              <p className="font-medium">Probar los mensajes de error</p>
              <p className="mt-0.5 text-tinta-suave">La próxima petición a los datos fallará una sola vez.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Boton variante="secundario" tamano="sm" onClick={() => armarFalloDemo('servidor')}>
                  Error del servidor
                </Boton>
                <Boton variante="secundario" tamano="sm" onClick={() => armarFalloDemo('red')}>
                  Sin conexión
                </Boton>
              </div>
              {instantanea.falloArmado && (
                <p role="status" className="mt-2 text-ambar-800">
                  Preparado: la próxima petición fallará (
                  {instantanea.falloArmado === 'servidor' ? 'error del servidor' : 'sin conexión'}).{' '}
                  <button type="button" onClick={() => armarFalloDemo(null)} className="font-medium underline">
                    Cancelar
                  </button>
                </p>
              )}
            </div>

            <div className="border-t border-borde pt-4">
              <Boton variante="texto" tamano="sm" onClick={restablecerDatosDemo}>
                Restablecer los datos de demostración
              </Boton>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
