import { API_URL } from '../config/api'
import type {
  DomandaAssistenteRequest,
  RispostaAssistenteResponse,
} from '../features/assistente/types/assistente'
import { apiFetch } from './apiFetch'

const URL_DOMANDE = `${API_URL}/assistente/domande`
export async function chiedereAllAssistente(
  richiesta: DomandaAssistenteRequest,
): Promise<RispostaAssistenteResponse> {
  const response = await apiFetch(URL_DOMANDE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(richiesta),
  })

  if (!response.ok) {
    const corpo = await response.json().catch(() => null) as { errore?: string } | null
    throw new Error(corpo?.errore || 'Errore durante la comunicazione con l’assistente IA')
  }
  return response.json() as Promise<RispostaAssistenteResponse>
}
