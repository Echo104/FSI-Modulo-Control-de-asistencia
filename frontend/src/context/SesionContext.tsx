import { useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { Alerta } from '@/components/ui/Alerta'
import { Boton } from '@/components/ui/Boton'
import { Cargando } from '@/components/ui/Spinner'
import { useDatos } from '@/hooks/useDatos'
import { servicios } from '@/services'
import { obtenerInstantaneaDemo, suscribirDemo } from '@/services/demo/estadoDemo'
import type { PerfilSesion } from '@/types/comun'
import { SesionContext, useSesion } from './sesion'

/** Obtiene quién usa la pantalla (trabajador o RR. HH.). En modo api depende de un endpoint que aún no existe. */
export function SesionProvider({ children }: { children: ReactNode }) {
  // En modo demostración, cambiar de perfil desde el banner vuelve a pedir la sesión.
  const perfilDemo = useSyncExternalStore(suscribirDemo, () => obtenerInstantaneaDemo().perfilId)

  const { datos, cargando, error, recargar } = useDatos((senal) => servicios.sesion.obtenerPerfil(senal), [perfilDemo], {
    accion: 'identificar al usuario',
    conservarDatos: true,
  })

  const valor = useMemo(() => ({ perfil: datos, cargando, error, recargar }), [datos, cargando, error, recargar])
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}

/** Muestra su contenido solo cuando ya se sabe quién es la persona usuaria; mientras tanto muestra carga o error. */
export function ConPerfil({ children }: { children: (perfil: PerfilSesion) => ReactNode }) {
  const { perfil, cargando, error, recargar } = useSesion()

  if (perfil) return <>{children(perfil)}</>
  if (error) {
    return (
      <Alerta
        tono="error"
        titulo={error.titulo}
        etiqueta={error.codigo ?? undefined}
        acciones={
          error.reintentable ? (
            <Boton variante="secundario" tamano="sm" onClick={recargar}>
              Reintentar
            </Boton>
          ) : undefined
        }
      >
        {error.mensajes.map((mensaje) => (
          <p key={mensaje}>{mensaje}</p>
        ))}
      </Alerta>
    )
  }
  return cargando ? <Cargando mensaje="Identificando al usuario…" /> : null
}
