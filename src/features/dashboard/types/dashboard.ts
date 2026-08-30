import type { ValoreParametro } from '../../rapporti/components/CampoParametro'

export type TipoGrafico = 'BARRE' | 'TORTA'
export type IntervalloAggiornamento = 0 | 30 | 60 | 300

export interface ConfigurazionePannello {
  rapportoCodice: string
  tipoGrafico: TipoGrafico
  intervalloAggiornamento: IntervalloAggiornamento
  parametriPerRapporto: Record<string, Record<string, ValoreParametro>>
}

export interface PreferenzeDashboard {
  versione: 1
  pannelli: [ConfigurazionePannello, ConfigurazionePannello]
}
