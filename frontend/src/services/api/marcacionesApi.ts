import { entorno } from '@/config/entorno'
import type { MarcacionesServicio } from '../contratos'
import { solicitar } from '../http/clienteHttp'
import { ErrorContratoPendiente } from '../http/errores'
import type { MarcacionCrearDto, MarcacionDto } from '@/types/marcaciones'
import { aMarcacion, aPagina } from './mapeadores'

/** Endpoint propuesto en HU-02 y HU-03: /marcaciones/ (POST para registrar, GET para consultar). */
const RUTA = '/marcaciones/'

export const marcacionesApi: MarcacionesServicio = {
  async registrar(trabajadorId, datos) {
    if (!entorno.codigoDispositivoWeb) {
      throw new ErrorContratoPendiente(
        'Falta el código del dispositivo web. Backend debe indicar cuál es y se configura en VITE_CODIGO_DISPOSITIVO_WEB (ver .env.example).',
      )
    }

    // Contrato mínimo de HU-02: trabajador, tipo de marcación y código de dispositivo.
    // No se envía fecha_hora: la fija el servidor y el cliente no puede influir en ella (CA-02).
    const cuerpo: MarcacionCrearDto = {
      trabajador: trabajadorId,
      tipo_marcacion: datos.tipo,
      dispositivo: entorno.codigoDispositivoWeb,
    }
    const observacion = datos.observacion?.trim()
    if (observacion) cuerpo.observacion = observacion

    return aMarcacion(await solicitar<MarcacionDto>(RUTA, { metodo: 'POST', cuerpo }))
  },

  async consultar({ trabajadorId, desde, hasta, pagina }, senal) {
    const datos = await solicitar<unknown>(RUTA, {
      parametros: { trabajador_id: trabajadorId, desde, hasta, page: pagina },
      senal,
    })
    return aPagina<MarcacionDto, ReturnType<typeof aMarcacion>>(datos, aMarcacion, pagina)
  },
}
