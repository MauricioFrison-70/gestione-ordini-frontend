import type {
  ConfigurazionePannello,
  IntervalloAggiornamento,
  PreferenzeDashboard,
  TipoGrafico,
} from '../types/dashboard'

export const CHIAVE_PREFERENZE_DASHBOARD = 'gestione-ordini.dashboard.v1'

export const PREFERENZE_PREDEFINITE: PreferenzeDashboard = {
  versione: 1,
  pannelli: [
    {
      rapportoCodice: 'VENDITE_ULTIMI_DODICI_MESI',
      tipoGrafico: 'BARRE',
      intervalloAggiornamento: 60,
      parametriPerRapporto: {},
    },
    {
      rapportoCodice: 'RANKING_VENDITORI_PER_PERIODO',
      tipoGrafico: 'TORTA',
      intervalloAggiornamento: 60,
      parametriPerRapporto: {},
    },
  ],
}

const INTERVALLI_VALIDI: IntervalloAggiornamento[] = [0, 30, 60, 300]

function normalizzarePannello(
  valore: Partial<ConfigurazionePannello> | undefined,
  predefinito: ConfigurazionePannello,
): ConfigurazionePannello {
  const tipoGrafico = valore?.tipoGrafico === 'BARRE' || valore?.tipoGrafico === 'TORTA'
    ? valore.tipoGrafico as TipoGrafico
    : predefinito.tipoGrafico
  const intervallo = INTERVALLI_VALIDI.includes(
    valore?.intervalloAggiornamento as IntervalloAggiornamento,
  )
    ? valore?.intervalloAggiornamento as IntervalloAggiornamento
    : 60

  return {
    rapportoCodice: typeof valore?.rapportoCodice === 'string'
      ? valore.rapportoCodice
      : predefinito.rapportoCodice,
    tipoGrafico,
    intervalloAggiornamento: intervallo,
    parametriPerRapporto: valore?.parametriPerRapporto
      && typeof valore.parametriPerRapporto === 'object'
      ? valore.parametriPerRapporto
      : {},
  }
}

export function leggerePreferenzeDashboard(): PreferenzeDashboard {
  try {
    const contenuto = localStorage.getItem(CHIAVE_PREFERENZE_DASHBOARD)
    if (!contenuto) return PREFERENZE_PREDEFINITE
    const preferenze = JSON.parse(contenuto) as Partial<PreferenzeDashboard>
    if (preferenze.versione !== 1 || !Array.isArray(preferenze.pannelli)
      || preferenze.pannelli.length !== 2) {
      return PREFERENZE_PREDEFINITE
    }
    return {
      versione: 1,
      pannelli: [
        normalizzarePannello(preferenze.pannelli[0], PREFERENZE_PREDEFINITE.pannelli[0]),
        normalizzarePannello(preferenze.pannelli[1], PREFERENZE_PREDEFINITE.pannelli[1]),
      ],
    }
  } catch {
    return PREFERENZE_PREDEFINITE
  }
}

export function salvarePreferenzeDashboard(preferenze: PreferenzeDashboard): void {
  try {
    localStorage.setItem(CHIAVE_PREFERENZE_DASHBOARD, JSON.stringify(preferenze))
  } catch {
    // La dashboard resta utilizzabile anche quando il browser blocca lo storage.
  }
}
