import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Turnos from './pages/Turnos'
import Marcar from './pages/Marcar'
import Consulta from './pages/Consulta'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Turnos />} />
          <Route path="/turnos" element={<Turnos />} />
          <Route path="/marcar" element={<Marcar />} />
          <Route path="/consulta" element={<Consulta />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}