export interface FornitoreRiferimento {
  id: number
  nome: string
}

export interface OrdineAcquisto {
  id: number
  numeroOrdine: string
  fornitore: FornitoreRiferimento
  dataRegistrazione: string
  dataRicevimento: string | null
  dataAnnullamento: string | null
}

export interface OrdineAcquistoRequest {
  fornitoreId: number
}
