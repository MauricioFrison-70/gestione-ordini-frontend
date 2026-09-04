export type RuoloMessaggio = 'UTENTE' | 'ASSISTENTE'

export interface MessaggioAssistente {
  id: number
  ruolo: RuoloMessaggio
  contenuto: string
}

export interface DomandaAssistenteRequest {
  domanda: string
  cronologia: Array<Pick<MessaggioAssistente, 'ruolo' | 'contenuto'>>
}

export interface RispostaAssistenteResponse {
  risposta: string
}
