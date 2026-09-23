const MESSAGGIO_ERRORE_RETE =
  'Impossibile contattare il server. Verificare che il backend sia avviato e riprovare.'

export const EVENTO_DATABASE_IN_RIATTIVAZIONE = 'database-in-riattivazione'

const TENTATIVI_MASSIMI = 8
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

/**
 * Ripete esclusivamente GET/HEAD quando la API segnala che Azure SQL è in
 * riattivazione. Le operazioni di scrittura non vengono mai ripetute, per
 * evitare inserimenti o aggiornamenti duplicati.
 */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = Symbol('richiesta-database')
  const puoRiprovare = metodoSicuro(init)

  try {
    for (let tentativo = 1; tentativo <= TENTATIVI_MASSIMI; tentativo += 1) {
      let response: Response
      try {
        response = init ? await fetch(url, init) : await fetch(url)
      } catch {
        throw new Error(MESSAGGIO_ERRORE_RETE)
      }

      const deveRiprovare = puoRiprovare
        && response.status === 503
        && tentativo < TENTATIVI_MASSIMI

      if (!deveRiprovare) return response

      attivareRiattivazione(token)
      await attendere(attesaDaRisposta(response))
    }

    throw new Error(MESSAGGIO_ERRORE_RETE)
  } finally {
    disattivareRiattivazione(token)
  }
}
