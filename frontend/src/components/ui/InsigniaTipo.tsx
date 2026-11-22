import type { TipoMarcacion } from '@/types/marcaciones'
import { nombreTipoMarcacion } from '@/utils/textos'
import { Insignia, type TonoInsignia } from './Insignia'

const TONO: Record<TipoMarcacion, TonoInsignia> = {
  ENT: 'exito',
  SAL: 'neutro',
  IRF: 'aviso',
  FRF: 'info',
}

/** Etiqueta con el nombre del tipo de marcación; el color ayuda a distinguirlas, pero el texto siempre está. */
export function InsigniaTipo({ tipo }: { tipo: TipoMarcacion }) {
  return <Insignia tono={TONO[tipo]}>{nombreTipoMarcacion(tipo)}</Insignia>
}
