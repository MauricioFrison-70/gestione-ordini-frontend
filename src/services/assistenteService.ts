import { API_URL } from '../config/api'
import type {
  DomandaAssistenteRequest,
  RispostaAssistenteResponse,
} from '../features/assistente/types/assistente'

const URL_DOMANDE = `${API_URL}/assistente/domande`
const ERRORE_RETE =
  'Impossibile contattare il server. Verificare che il backend sia avviato e riprovare.'

export async function chiedereAllAssistente(
  richiesta: DomandaAssistenteRequest,
): Promise<RispostaAssistenteResponse> {
  let response: Response
  try {
    response = await fetch(URL_DOMANDE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(richiesta),
    })
  } catch {
    throw new Error(ERRORE_RETE)
  }

  if (!response.ok) {
    const corpo = await response.json().catch(() => null) as { errore?: string } | null
    throw new Error(corpo?.errore || 'Errore durante la comunicazione con l’assistente IA')
  }
  return response.json() as Promise<RispostaAssistenteResponse>
}
