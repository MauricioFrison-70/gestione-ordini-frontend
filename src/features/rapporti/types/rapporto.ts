export type TipoParametroRapporto =
  | 'DATA'
  | 'INTERO'
  | 'SELEZIONE'
  | 'DECIMALE'
  | 'BOOLEANO'
  | 'TESTO'

export interface ParametroRapporto {
  nome: string
  etichetta: string
  tipo: TipoParametroRapporto
  obbligatorio: boolean
  ordine: number
  valorePredefinito: string | null
  haOpzioni: boolean
}

export interface Rapporto {
  id: number
  codice: string
  titolo: string
  descrizione: string | null
  attivo: boolean
  parametri: ParametroRapporto[]
}

export interface OpzioneParametro {
  valore: string | number
  etichetta: string
}

export interface ColonnaRapporto {
  nome: string
  etichetta: string
  tipo: string
  formato: string | null
  totalizzare: boolean
}

export interface RisultatoRapporto {
  colonne: ColonnaRapporto[]
  righe: Record<string, unknown>[]
  totali: Record<string, number>
  totaleRighe: number
  troncato: boolean
}
