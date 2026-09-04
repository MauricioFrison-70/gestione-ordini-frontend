import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RisultatoRapporto } from '../../rapporti/types/rapporto'
import Dashboard from './Dashboard'
import { CHIAVE_PREFERENZE_DASHBOARD } from '../utils/preferenzeDashboard'

const rapporti = [
  {
    id: 3,
    codice: 'VENDITE_ULTIMI_DODICI_MESI',
    titolo: 'Vendite degli ultimi dodici mesi',
    descrizione: 'Totale mensile delle vendite.',
    attivo: true,
    parametri: [],
  },
  {
    id: 2,
    codice: 'RANKING_VENDITORI_PER_PERIODO',
    titolo: 'Classifica venditori per periodo',
    descrizione: 'Classifica dei venditori.',
    attivo: true,
    parametri: [
      {
        nome: 'DataInizio', etichetta: 'Data iniziale', tipo: 'DATA' as const,
        obbligatorio: true, ordine: 1, valorePredefinito: null, haOpzioni: false,
      },
      {
        nome: 'DataFine', etichetta: 'Data finale', tipo: 'DATA' as const,
        obbligatorio: true, ordine: 2, valorePredefinito: null, haOpzioni: false,
      },
    ],
  },
]

const vendite: RisultatoRapporto = {
  colonne: [
    { nome: 'mese', etichetta: 'Mese', tipo: 'nvarchar', formato: null, totalizzare: false },
    { nome: 'numeroOrdini', etichetta: 'Numero ordini', tipo: 'bigint', formato: null, totalizzare: true },
    { nome: 'valoreTotale', etichetta: 'Valore totale', tipo: 'decimal', formato: 'VALUTA', totalizzare: true },
  ],
  righe: [
    { mese: 'luglio 2026', numeroOrdini: 3, valoreTotale: 1200 },
    { mese: 'agosto 2026', numeroOrdini: 4, valoreTotale: 1800 },
  ],
  totali: { numeroOrdini: 7, valoreTotale: 3000 },
  totaleRighe: 2,
  troncato: false,
}

const ranking: RisultatoRapporto = {
  colonne: [
    { nome: 'venditore', etichetta: 'Venditore', tipo: 'nvarchar', formato: null, totalizzare: false },
    { nome: 'valoreTotale', etichetta: 'Valore totale', tipo: 'decimal', formato: 'VALUTA', totalizzare: true },
  ],
  righe: [
    { venditore: 'Alessandro', valoreTotale: 2200 },
    { venditore: 'Giulia', valoreTotale: 1600 },
  ],
  totali: { valoreTotale: 3800 },
  totaleRighe: 2,
  troncato: false,
}

function preparareFetch() {
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/api/rapporti') && !init) {
      return { ok: true, json: async () => rapporti }
    }
    if (url.endsWith('/api/rapporti/3/esegui')) {
      return { ok: true, json: async () => vendite }
    }
    if (url.endsWith('/api/rapporti/2/esegui')) {
      return { ok: true, json: async () => ranking }
    }
    throw new Error(`Richiesta non prevista: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
  })

  it('crea due dashboard e una singola area per l’assistente', async () => {
    const fetchMock = preparareFetch()
    render(<Dashboard />)

    expect(await screen.findByTestId('dashboard-panel-1')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-panel-2')).toBeInTheDocument()
    expect(screen.getByTestId('assistente-sistema')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /Grafico a barre: Valore totale per Mese/ })).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /Grafico a torta: Valore totale per Venditore/ })).toBeInTheDocument()
    expect(await screen.findAllByText(/Ultimo aggiornamento:/)).toHaveLength(2)
    expect(within(screen.getByTestId('dashboard-panel-1')).getByLabelText('Aggiornamento'))
      .toHaveTextContent('1 minuto')

    await waitFor(() => {
      const chiamataRanking = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/2/esegui'))
      expect(chiamataRanking).toBeDefined()
      const corpo = JSON.parse(String(chiamataRanking?.[1]?.body)) as {
        parametri: Record<string, string>
      }
      expect(corpo.parametri.DataInizio).toMatch(/^\d{4}-\d{2}-01$/)
      expect(corpo.parametri.DataFine).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('salva il tipo di grafico e ripristina la selezione dal localStorage', async () => {
    const user = userEvent.setup()
    preparareFetch()
    render(<Dashboard />)

    const pannello = await screen.findByTestId('dashboard-panel-1')
    await screen.findByRole('img', { name: /Grafico a barre: Valore totale per Mese/ })
    await user.click(within(pannello).getByLabelText('Tipo di grafico'))
    await user.click(await screen.findByRole('option', { name: 'Grafico a torta' }))
    await user.click(within(pannello).getByLabelText('Aggiornamento'))
    await user.click(await screen.findByRole('option', { name: '30 secondi' }))

    expect(await within(pannello).findByRole('img', { name: /Grafico a torta: Valore totale per Mese/ }))
      .toBeInTheDocument()
    await waitFor(() => {
      const preferenze = JSON.parse(localStorage.getItem(CHIAVE_PREFERENZE_DASHBOARD) ?? '{}') as {
        pannelli: { tipoGrafico: string, intervalloAggiornamento: number }[]
      }
      expect(preferenze.pannelli[0].tipoGrafico).toBe('TORTA')
      expect(preferenze.pannelli[0].intervalloAggiornamento).toBe(30)
    })
  })

  it('aggiorna periodicamente, sospende la scheda nascosta e aggiorna al ritorno', async () => {
    localStorage.setItem(CHIAVE_PREFERENZE_DASHBOARD, JSON.stringify({
      versione: 1,
      pannelli: [
        {
          rapportoCodice: 'VENDITE_ULTIMI_DODICI_MESI',
          tipoGrafico: 'BARRE',
          intervalloAggiornamento: 30,
          parametriPerRapporto: {},
        },
        {
          rapportoCodice: 'RANKING_VENDITORI_PER_PERIODO',
          tipoGrafico: 'TORTA',
          intervalloAggiornamento: 0,
          parametriPerRapporto: {},
        },
      ],
    }))
    let aggiornamentoAutomatico: (() => void) | undefined
    vi.spyOn(window, 'setInterval').mockImplementation((gestore, intervallo) => {
      if (intervallo === 30_000 && typeof gestore === 'function') {
        aggiornamentoAutomatico = () => { gestore() }
      }
      return 123
    })
    const fetchMock = preparareFetch()
    render(<Dashboard />)

    await screen.findByRole('img', { name: /Grafico a barre: Valore totale per Mese/ })
    const numeroEsecuzioni = () => fetchMock.mock.calls.filter(
      ([url]) => String(url).endsWith('/api/rapporti/3/esegui'),
    ).length
    expect(numeroEsecuzioni()).toBe(1)
    expect(aggiornamentoAutomatico).toBeDefined()

    await act(async () => { aggiornamentoAutomatico?.() })
    await waitFor(() => expect(numeroEsecuzioni()).toBe(2))

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    await act(async () => { aggiornamentoAutomatico?.() })
    expect(numeroEsecuzioni()).toBe(2)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    await waitFor(() => expect(numeroEsecuzioni()).toBe(3))
  })
})
