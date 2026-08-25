import { API_URL } from '../config/api'
import type {
  OrdineAcquisto,
  OrdineAcquistoRequest,
} from '../features/ordiniAcquisto/types/ordineAcquisto'

const URL = `${API_URL}/ordini-acquisto`
const ERRORE_RETE = 'Impossibile contattare il server. Verificare che il backend sia avviato.'

async function richiesta<T>(url: string, messaggio: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = init ? await fetch(url, init) : await fetch(url)
  } catch {
    throw new Error(ERRORE_RETE)
  }
  if (!response.ok) {
    const corpo = await response.json().catch(() => null) as { errore?: string } | null
    throw new Error(corpo?.errore || messaggio)
  }
  return response.json() as Promise<T>
}

export function elencareOrdiniAcquisto(): Promise<OrdineAcquisto[]> {
  return richiesta(URL, 'Errore nel caricamento degli ordini di acquisto')
}

export function cercareOrdineAcquistoPerId(id: number): Promise<OrdineAcquisto> {
  return richiesta(`${URL}/${id}`, 'Ordine di acquisto non trovato')
}

export function creareOrdineAcquisto(
  request: OrdineAcquistoRequest,
): Promise<OrdineAcquisto> {
  return richiesta(URL, "Errore nella creazione dell'ordine di acquisto", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

export function ricevereOrdineAcquisto(id: number): Promise<OrdineAcquisto> {
  return richiesta(`${URL}/${id}/ricevere`, "Errore nel ricevimento dell'ordine", {
    method: 'POST',
  })
}

export function annullareOrdineAcquisto(id: number): Promise<OrdineAcquisto> {
  return richiesta(`${URL}/${id}/annullare`, "Errore nell'annullamento dell'ordine", {
    method: 'POST',
  })
}

export async function eliminareOrdineAcquisto(id: number): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${URL}/${id}`, { method: 'DELETE' })
  } catch {
    throw new Error(ERRORE_RETE)
  }
  if (!response.ok) {
    const corpo = await response.json().catch(() => null) as { errore?: string } | null
    throw new Error(corpo?.errore || "Errore nell'eliminazione dell'ordine di acquisto")
  }
}
