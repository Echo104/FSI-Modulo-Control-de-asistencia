/** Marcadores grises que ocupan el lugar de una tabla mientras se cargan los datos. */
export function FilasEsqueleto({ filas = 5, columnas = 5 }: { filas?: number; columnas?: number }) {
  return (
    <div role="status" aria-label="Cargando datos" className="divide-y divide-borde">
      {Array.from({ length: filas }, (_, fila) => (
        <div key={fila} className="flex items-center gap-6 px-5 py-4">
          {Array.from({ length: columnas }, (_, columna) => (
            <div
              key={columna}
              className="h-4 animate-pulse rounded bg-borde"
              style={{ flex: columna === 0 ? 2 : 1, opacity: 1 - fila * 0.12 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
