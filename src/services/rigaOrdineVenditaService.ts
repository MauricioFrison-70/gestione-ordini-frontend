import { API_URL } from '../config/api'
import type {
  RigaOrdineVendita,
  RigaOrdineVenditaRequest,
} from '../features/ordiniVendita/types/rigaOrdineVendita'

const MESSAGGIO_ERRORE_RETE =
  'Impossibile contattare il server. Verificare che il backend sia avviato e riprovare.'

function urlRighe(ordineId: number): string {
  return `${API_URL}/ordini-vendita/${ordineId}/righe`
}

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

export function elencareRigheOrdineVendita(
  ordineId: number,
): Promise<RigaOrdineVendita[]> {
  return eseguireRichiesta(
    urlRighe(ordineId),
    "Errore nel caricamento delle righe dell'ordine di vendita",
  )
}

export function creareRigaOrdineVendita(
  ordineId: number,
  request: RigaOrdineVenditaRequest,
): Promise<RigaOrdineVendita> {
  return eseguireRichiesta(
    urlRighe(ordineId),
    "Errore nella creazione della riga dell'ordine di vendita",
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
  )
}

export function aggiornareRigaOrdineVendita(
  ordineId: number,
  rigaId: number,
  request: RigaOrdineVenditaRequest,
): Promise<RigaOrdineVendita> {
  return eseguireRichiesta(
    `${urlRighe(ordineId)}/${rigaId}`,
    "Errore nell'aggiornamento della riga dell'ordine di vendita",
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
  )
}

export async function eliminareRigaOrdineVendita(
  ordineId: number,
  rigaId: number,
): Promise<void> {
  const response = await eseguireFetch(`${urlRighe(ordineId)}/${rigaId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const corpo = await response.json().catch(() => null) as { errore?: string } | null
    throw new Error(
      corpo?.errore || "Errore nell'eliminazione della riga dell'ordine di vendita",
    )
  }
}
