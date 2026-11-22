import { Link } from 'react-router-dom'
import { EncabezadoPagina } from '@/components/layout/EncabezadoPagina'
import { useTitulo } from '@/hooks/useTitulo'

export function PaginaNoEncontrada() {
  useTitulo('Página no encontrada')
  return (
    <>
      <EncabezadoPagina titulo="No encontramos esta página" descripcion="La dirección no corresponde a ninguna sección del módulo." />
      <Link to="/turnos" className="font-medium text-petroleo-700 underline underline-offset-2 hover:text-petroleo-800">
        Ir a Turnos
      </Link>
    </>
  )
}
