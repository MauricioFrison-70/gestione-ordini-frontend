export interface RigaOrdineVendita {
  id: number
  ordineVenditaId: number
  codiceProdotto: string
  descrizioneProdotto: string
  quantita: number
  valoreUnitario: number
  totaleRiga: number
}

export interface RigaOrdineVenditaRequest {
  codiceProdotto: string
  quantita: number
  valoreUnitario: number
}
