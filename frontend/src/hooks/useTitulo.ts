import { useEffect } from 'react'

/** Actualiza el título de la pestaña; ayuda a quien usa lector de pantalla a saber en qué sección está. */
export function useTitulo(titulo: string): void {
  useEffect(() => {
    document.title = `${titulo} | Control de asistencia`
  }, [titulo])
}
