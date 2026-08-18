export interface Prodotto {
  id: number
  codice: string
  descrizione: string
  valoreAcquisto: number
  valoreVendita: number
  quantita: number
  scortaMinima: number
  archiviato: boolean
  dataRegistrazione: string
}

export interface ProdottoRequest {
  codice: string
  descrizione: string
  valoreAcquisto: number
  valoreVendita: number
  quantita: number
  scortaMinima: number
  archiviato: boolean
}

export type ProdottoUpdateRequest = Omit<ProdottoRequest, 'codice'>
