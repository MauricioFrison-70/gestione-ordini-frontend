import { API_URL } from '../config/api'
import type { Prodotto, ProdottoRequest, ProdottoUpdateRequest } from '../features/prodotti/types/prodotto'

const URL_PRODOTTI = `${API_URL}/prodotti`

async function eseguireRichiesta<T>(url: string, messaggioErrore: string, init?: RequestInit): Promise<T> {
  const response = init ? await fetch(url, init) : await fetch(url)

  if (!response.ok) {
    let dettaglioErrore: string | null = null

    try {
      const corpo: unknown = await response.json()

        if (typeof corpo === 'object' && corpo !== null && 'errore' in corpo && typeof corpo.errore === 'string') {
          dettaglioErrore = corpo.errore
        }
    } catch {
      // Alcune risposte di errore non possiedono un corpo JSON.
    }

    if (dettaglioErrore) {
      throw new Error(dettaglioErrore)
    }

    throw new Error(messaggioErrore)
  }

  return response.json() as Promise<T>
}

export function elencareProdotti(): Promise<Prodotto[]> {
  return eseguireRichiesta(URL_PRODOTTI, 'Errore nel caricamento dei prodotti')
}

export function cercareProdottoPerId(id: number): Promise<Prodotto> {
  return eseguireRichiesta(`${URL_PRODOTTI}/${id}`, 'Prodotto non trovato')
}

export function creareProdotto(prodotto: ProdottoRequest): Promise<Prodotto> {
  return eseguireRichiesta(URL_PRODOTTI, 'Errore nella creazione del prodotto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prodotto),
  })
}

export function aggiornareProdotto(id: number, prodotto: ProdottoUpdateRequest): Promise<Prodotto> {
  return eseguireRichiesta(`${URL_PRODOTTI}/${id}`, 'Errore nell’aggiornamento del prodotto', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prodotto),
  })
}

export async function eliminareProdotto(id: number): Promise<void> {
  const response = await fetch(`${URL_PRODOTTI}/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw new Error('Errore nell’eliminazione del prodotto')
  }
}
