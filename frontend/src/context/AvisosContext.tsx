import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { IconoAlerta, IconoCerrar, IconoCheck, IconoInfo } from '@/components/ui/Iconos'

type TonoAviso = 'exito' | 'error' | 'info'

interface Aviso {
  id: number
  tono: TonoAviso
  titulo: string
  detalle?: string
}

interface ValorAvisos {
  avisar: (aviso: Omit<Aviso, 'id'>) => void
}

const AvisosContext = createContext<ValorAvisos | null>(null)

const ESTILOS: Record<TonoAviso, { caja: string; icono: ReactNode }> = {
  exito: { caja: 'border-verde-200 text-verde-700', icono: <IconoCheck className="mt-0.5 shrink-0" /> },
  error: { caja: 'border-rojo-200 text-rojo-700', icono: <IconoAlerta className="mt-0.5 shrink-0" /> },
  info: { caja: 'border-petroleo-200 text-petroleo-700', icono: <IconoInfo className="mt-0.5 shrink-0" /> },
}

/** Avisos breves (por ejemplo, "Turno guardado") que se anuncian a los lectores de pantalla. */
export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const contador = useRef(0)
  const temporizadores = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const cerrar = useCallback((id: number) => {
    const temporizador = temporizadores.current.get(id)
    if (temporizador) clearTimeout(temporizador)
    temporizadores.current.delete(id)
    setAvisos((lista) => lista.filter((a) => a.id !== id))
  }, [])

  const avisar = useCallback(
    (aviso: Omit<Aviso, 'id'>) => {
      const id = ++contador.current
      setAvisos((lista) => [...lista.slice(-2), { ...aviso, id }])
      temporizadores.current.set(id, setTimeout(() => cerrar(id), aviso.tono === 'error' ? 9000 : 6000))
    },
    [cerrar],
  )

  useEffect(() => {
    const mapa = temporizadores.current
    return () => mapa.forEach((t) => clearTimeout(t))
  }, [])

  const valor = useMemo(() => ({ avisar }), [avisar])

  return (
    <AvisosContext.Provider value={valor}>
      {children}
      <div
        role="region"
        aria-label="Notificaciones"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:items-end"
      >
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-white py-3 pl-4 pr-2 shadow-lg ${ESTILOS[aviso.tono].caja}`}
          >
            {ESTILOS[aviso.tono].icono}
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-tinta">{aviso.titulo}</p>
              {aviso.detalle && <p className="mt-0.5 text-tinta-suave">{aviso.detalle}</p>}
            </div>
            <button
              type="button"
              onClick={() => cerrar(aviso.id)}
              className="rounded p-1.5 text-tinta-suave hover:bg-niebla hover:text-tinta"
              aria-label="Cerrar aviso"
            >
              <IconoCerrar width={16} height={16} />
            </button>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  )
}

export function useAvisos(): ValorAvisos {
  const contexto = useContext(AvisosContext)
  if (!contexto) throw new Error('useAvisos debe usarse dentro de <AvisosProvider>')
  return contexto
}
