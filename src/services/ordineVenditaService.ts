import { API_URL } from '../config/api'
import type {
  OrdineVendita,
  OrdineVenditaRequest,
} from '../features/ordiniVendita/types/ordineVendita'

const URL_ORDINI_VENDITA = `${API_URL}/ordini-vendita`
const MESSAGGIO_ERRORE_RETE =
  'Impossibile contattare il server. Verificare che il backend sia avviato e riprovare.'

async function eseguireFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return init ? await fetch(url, init) : await fetch(url)
  } catch {
    throw new Error(MESSAGGIO_ERRORE_RETE)
  }
}

async function eseguireRichiesta<T>(
  url: string,
  messaggioErrore: string,
  init?: RequestInit,
): Promise<T> {
  const response = await eseguireFetch(url, init)

  if (!response.ok) {
    const corpo = await response.json().catch(() => null) as { errore?: string } | null
    throw new Error(corpo?.errore || messaggioErrore)
  }

  return response.json() as Promise<T>
}

export function elencareOrdiniVendita(): Promise<OrdineVendita[]> {
  return eseguireRichiesta(URL_ORDINI_VENDITA, 'Errore nel caricamento degli ordini di vendita')
}

export function creareOrdineVendita(request: OrdineVenditaRequest): Promise<OrdineVendita> {
  return eseguireRichiesta(URL_ORDINI_VENDITA, "Errore nella creazione dell'ordine di vendita", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

export function cercareOrdineVenditaPerId(id: number): Promise<OrdineVendita> {
  return eseguireRichiesta(
    `${URL_ORDINI_VENDITA}/${id}`,
    'Ordine di vendita non trovato',
  )
}

export function aggiornareOrdineVendita(
  id: number,
  request: OrdineVenditaRequest,
): Promise<OrdineVendita> {
  return eseguireRichiesta(
    `${URL_ORDINI_VENDITA}/${id}`,
    "Errore nell'aggiornamento dell'ordine di vendita",
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
  )
}

export async function eliminareOrdineVendita(id: number): Promise<void> {
  const response = await eseguireFetch(`${URL_ORDINI_VENDITA}/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    const corpo = await response.json().catch(() => null) as { errore?: string } | null
    throw new Error(corpo?.errore || "Errore nell'eliminazione dell'ordine di vendita")
  }
}
