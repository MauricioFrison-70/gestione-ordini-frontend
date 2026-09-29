const MESSAGGIO_ERRORE_RETE =
  'Impossibile contattare il server. Verificare che il backend sia avviato e riprovare.'
const MESSAGGIO_TIMEOUT_DATABASE =
  'Il database non è diventato disponibile entro 90 secondi. Riprovare.'

export const EVENTO_DATABASE_IN_RIATTIVAZIONE = 'database-in-riattivazione'

const RITARDO_AVVISO_MS = 5_000
const TEMPO_MASSIMO_RIATTIVAZIONE_MS = 90_000
const ATTESA_PREDEFINITA_MS = 8_000
const richiesteInAttesa = new Set<symbol>()

function metodoSicuro(init?: RequestInit): boolean {
  const metodo = init?.method?.toUpperCase() ?? 'GET'
  return metodo === 'GET' || metodo === 'HEAD'
}

function notificareStatoRiattivazione(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENTO_DATABASE_IN_RIATTIVAZIONE, {
    detail: { attivo: richiesteInAttesa.size > 0 },
  }))
}

function attivareRiattivazione(token: symbol): void {
  if (richiesteInAttesa.has(token)) return
  richiesteInAttesa.add(token)
  notificareStatoRiattivazione()
}

function disattivareRiattivazione(token: symbol): void {
  if (richiesteInAttesa.delete(token)) {
    notificareStatoRiattivazione()
  }
}

function attesaDaRisposta(response: Response): number {
  const valore = response.headers?.get?.('Retry-After')
  if (!valore) return ATTESA_PREDEFINITA_MS

  const secondi = Number(valore)
  return Number.isFinite(secondi) && secondi >= 0
    ? secondi * 1_000
    : ATTESA_PREDEFINITA_MS
}

function attendere(millisecondi: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, millisecondi))
}

async function fetchEntroScadenza(
  url: string,
  init: RequestInit | undefined,
  scadenza: number,
): Promise<Response> {
  const tempoRimanente = scadenza - Date.now()
  if (tempoRimanente <= 0) throw new Error(MESSAGGIO_TIMEOUT_DATABASE)

  let timerScadenza: number | undefined
  const richiesta = init ? fetch(url, init) : fetch(url)
  const timeout = new Promise<never>((_, reject) => {
    timerScadenza = window.setTimeout(
      () => reject(new Error(MESSAGGIO_TIMEOUT_DATABASE)),
      tempoRimanente,
    )
  })

  try {
    return await Promise.race([richiesta, timeout])
  } finally {
    if (timerScadenza !== undefined) window.clearTimeout(timerScadenza)
  }
}

async function rispostaTransitoria(response: Response): Promise<boolean> {
  if ([502, 503, 504].includes(response.status)) return true
  if (response.status !== 500) return false

  try {
    const corpo = await response.clone().json() as { codice?: string, errore?: string }
    return corpo.codice === 'DATABASE_IN_RIATTIVAZIONE'
      || corpo.errore === 'Errore interno del server'
  } catch {
    return false
  }
}

/**
 * Ripete esclusivamente GET/HEAD quando la API segnala che Azure SQL è in
 * riattivazione. Le operazioni di scrittura non vengono mai ripetute, per
 * evitare inserimenti o aggiornamenti duplicati.
 */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = Symbol('richiesta-database')
  const puoRiprovare = metodoSicuro(init)
  const inizio = Date.now()
  const scadenza = inizio + TEMPO_MASSIMO_RIATTIVAZIONE_MS
  const timerAvviso = puoRiprovare
    ? window.setTimeout(() => attivareRiattivazione(token), RITARDO_AVVISO_MS)
    : undefined

  try {
    while (true) {
      let response: Response
      try {
        response = puoRiprovare
          ? await fetchEntroScadenza(url, init, scadenza)
          : init ? await fetch(url, init) : await fetch(url)
      } catch {
        if (!puoRiprovare) throw new Error(MESSAGGIO_ERRORE_RETE)
        const tempoRimanente = scadenza - Date.now()
        if (tempoRimanente <= 0) throw new Error(MESSAGGIO_TIMEOUT_DATABASE)
        await attendere(Math.min(ATTESA_PREDEFINITA_MS, tempoRimanente))
        continue
      }

      if (!puoRiprovare || !await rispostaTransitoria(response)) return response

      const tempoRimanente = scadenza - Date.now()
      if (tempoRimanente <= 0) throw new Error(MESSAGGIO_TIMEOUT_DATABASE)

      await attendere(Math.min(attesaDaRisposta(response), tempoRimanente))
      if (Date.now() >= scadenza) throw new Error(MESSAGGIO_TIMEOUT_DATABASE)
    }
  } finally {
    if (timerAvviso !== undefined) window.clearTimeout(timerAvviso)
    disattivareRiattivazione(token)
  }
}
