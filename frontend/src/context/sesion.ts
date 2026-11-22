import { createContext, useContext } from 'react'
import type { PerfilSesion } from '@/types/comun'
import type { ErrorUi } from '@/utils/errores'

interface ValorSesion {
  perfil: PerfilSesion | null
  cargando: boolean
  error: ErrorUi | null
  recargar: () => void
}

export const SesionContext = createContext<ValorSesion | null>(null)

export function useSesion(): ValorSesion {
  const contexto = useContext(SesionContext)
  if (!contexto) throw new Error('useSesion debe usarse dentro de <SesionProvider>')
  return contexto
}
