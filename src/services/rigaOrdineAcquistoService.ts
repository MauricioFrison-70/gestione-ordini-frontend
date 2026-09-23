import { API_URL } from '../config/api'
import type {
  RigaOrdineAcquisto,
  RigaOrdineAcquistoRequest,
} from '../features/ordiniAcquisto/types/rigaOrdineAcquisto'
import { apiFetch } from './apiFetch'

function url(ordineId: number): string {
  return `${API_URL}/ordini-acquisto/${ordineId}/righe`
}

async function richiesta<T>(indirizzo: string, messaggio: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(indirizzo, init)
  if (!response.ok) {
    const corpo = await response.json().catch(() => null) as { errore?: string } | null
    throw new Error(corpo?.errore || messaggio)
  }
  return response.json() as Promise<T>
}

export function elencareRigheOrdineAcquisto(
  ordineId: number,
): Promise<RigaOrdineAcquisto[]> {
  return richiesta(url(ordineId), "Errore nel caricamento delle righe dell'ordine")
}

export function creareRigaOrdineAcquisto(
  ordineId: number,
  request: RigaOrdineAcquistoRequest,
): Promise<RigaOrdineAcquisto> {
  return richiesta(url(ordineId), "Errore nell'inserimento della riga", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

export function aggiornareRigaOrdineAcquisto(
  ordineId: number,
  rigaId: number,
  request: RigaOrdineAcquistoRequest,
): Promise<RigaOrdineAcquisto> {
  return richiesta(
    `${url(ordineId)}/${rigaId}`,
    "Errore nell'aggiornamento della riga",
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
  )
}

export async function eliminareRigaOrdineAcquisto(
  ordineId: number,
  rigaId: number,
): Promise<void> {
  const response = await apiFetch(`${url(ordineId)}/${rigaId}`, { method: 'DELETE' })
  if (!response.ok) {
    const corpo = await response.json().catch(() => null) as { errore?: string } | null
    throw new Error(corpo?.errore || "Errore nell'eliminazione della riga")
  }
}
