import { API_URL } from '../config/api'
import type { Agente, AgenteRequest, TipoAgente } from '../features/agentes/types/agente'

const URL_AGENTI = `${API_URL}/agenti`
const URL_TIPI_AGENTE = `${API_URL}/tipo-agente`

async function eseguireRichiesta<T>(
  url: string,
  messaggioErrore: string,
  init?: RequestInit,
): Promise<T> {
  const response = init ? await fetch(url, init) : await fetch(url)

  if (!response.ok) {
    throw new Error(messaggioErrore)
  }

  return response.json() as Promise<T>
}

export function listarAgentes(): Promise<Agente[]> {
  return eseguireRichiesta(URL_AGENTI, 'Errore nel caricamento degli agenti')
}

export function buscarAgentePorId(id: number): Promise<Agente> {
  return eseguireRichiesta(`${URL_AGENTI}/${id}`, 'Agente non trovato')
}

export function listarTiposAgente(): Promise<TipoAgente[]> {
  return eseguireRichiesta(URL_TIPI_AGENTE, 'Errore nel caricamento dei tipi di agente')
}

export function criarAgente(agente: AgenteRequest): Promise<Agente> {
  return eseguireRichiesta(URL_AGENTI, 'Errore nella creazione dell’agente', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agente),
  })
}

export function atualizarAgente(id: number, agente: AgenteRequest): Promise<Agente> {
  return eseguireRichiesta(`${URL_AGENTI}/${id}`, 'Errore nell’aggiornamento dell’agente', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agente),
  })
}

export async function excluirAgente(id: number): Promise<void> {
  const response = await fetch(`${URL_AGENTI}/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw new Error('Errore nell’eliminazione dell’agente')
  }
}
