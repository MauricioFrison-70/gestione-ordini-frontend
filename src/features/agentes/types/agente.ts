export type TipoAgente = 'CLIENTE' | 'FORNITORE' | 'TRASPORTATORE' | 'VENDITORE'

export interface Agente {
  id: number
  nome: string
  email: string
  tipoAgente: TipoAgente
  archiviato: boolean
  dataRegistrazione: string
}

export interface AgenteRequest {
  nome: string
  email: string
  tipoAgente: TipoAgente
  archiviato: boolean
}
