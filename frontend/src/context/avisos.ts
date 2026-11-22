import { createContext, useContext } from 'react'

export type TonoAviso = 'exito' | 'error' | 'info'

export interface Aviso {
  id: number
  tono: TonoAviso
  titulo: string
  detalle?: string
}

interface ValorAvisos {
  avisar: (aviso: Omit<Aviso, 'id'>) => void
}

export const AvisosContext = createContext<ValorAvisos | null>(null)

export function useAvisos(): ValorAvisos {
  const contexto = useContext(AvisosContext)
  if (!contexto) throw new Error('useAvisos debe usarse dentro de <AvisosProvider>')
  return contexto
}
