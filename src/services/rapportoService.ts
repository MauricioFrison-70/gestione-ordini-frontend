import { API_URL } from '../config/api'
import { apiFetch } from './apiFetch'
import type {
  OpzioneParametro,
  Rapporto,
  RisultatoRapporto,
} from '../features/rapporti/types/rapporto'

const URL_RAPPORTI = `${API_URL}/rapporti`
async function richiesta<T>(url: string, messaggioErrore: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(url, init)

  if (!response.ok) {
    const corpo = await response.json().catch(() => null) as { errore?: string } | null
    throw new Error(corpo?.errore || messaggioErrore)
  }
  return response.json() as Promise<T>
}

export function elencareRapporti(): Promise<Rapporto[]> {
  return richiesta(URL_RAPPORTI, 'Errore nel caricamento dei rapporti')
}

export function elencareOpzioniParametro(
  rapportoId: number,
  nomeParametro: string,
): Promise<OpzioneParametro[]> {
  return richiesta(
    `${URL_RAPPORTI}/${rapportoId}/parametri/${encodeURIComponent(nomeParametro)}/opzioni`,
    'Errore nel caricamento delle opzioni',
  )
}

export function eseguireRapporto(
  rapportoId: number,
  parametri: Record<string, unknown>,
): Promise<RisultatoRapporto> {
  return richiesta(`${URL_RAPPORTI}/${rapportoId}/esegui`, "Errore nell'esecuzione del rapporto", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parametri }),
  })
}
