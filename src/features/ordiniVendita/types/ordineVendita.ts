export interface AgenteRiferimento {
  id: number
  nome: string
}

export interface OrdineVendita {
  id: number
  numeroOrdine: string
  cliente: AgenteRiferimento
  venditore: AgenteRiferimento
  trasportatore: AgenteRiferimento
  dataRegistrazione: string
  dataRilascio: string | null
  dataAnnullamento: string | null
}

export interface OrdineVenditaRequest {
  clienteId: number
  venditoreId: number
  trasportatoreId: number
}
