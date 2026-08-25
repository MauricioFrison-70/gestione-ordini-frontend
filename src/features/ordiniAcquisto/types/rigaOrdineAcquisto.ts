export interface RigaOrdineAcquisto {
  id: number
  ordineAcquistoId: number
  codiceProdotto: string
  descrizioneProdotto: string
  quantita: number
  valoreUnitario: number
  totaleRiga: number
}

export interface RigaOrdineAcquistoRequest {
  codiceProdotto: string
  quantita: number
  valoreUnitario: number
}
