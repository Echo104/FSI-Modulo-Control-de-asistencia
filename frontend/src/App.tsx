import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AvisosProvider } from '@/context/AvisosContext'
import { SesionProvider } from '@/context/SesionContext'
import { PaginaConsulta } from '@/pages/consulta/PaginaConsulta'
import { PaginaMarcar } from '@/pages/marcar/PaginaMarcar'
import { PaginaNoEncontrada } from '@/pages/PaginaNoEncontrada'
import { PaginaTurnos } from '@/pages/turnos/PaginaTurnos'

export default function App() {
  return (
    <AvisosProvider>
      <SesionProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/turnos" replace />} />
            <Route path="turnos" element={<PaginaTurnos />} />
            <Route path="marcar" element={<PaginaMarcar />} />
            <Route path="consulta" element={<PaginaConsulta />} />
            <Route path="*" element={<PaginaNoEncontrada />} />
          </Route>
        </Routes>
      </SesionProvider>
    </AvisosProvider>
  )
}
