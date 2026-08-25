import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import type { OrdineAcquisto } from '../types/ordineAcquisto'
import RigheOrdineAcquisto from './RigheOrdineAcquisto'

const ordine: OrdineAcquisto = {
  id: 10,
  numeroOrdine: 'OA-2026-000010',
  fornitore: { id: 2, nome: 'Fornitore Uno' },
  dataRegistrazione: '2026-08-22T10:00:00',
  dataRicevimento: null,
  dataAnnullamento: null,
}

const riga = {
  id: 30,
  ordineAcquistoId: 10,
  codiceProdotto: 'P001',
  descrizioneProdotto: 'Prodotto test',
  quantita: 5,
  valoreUnitario: 2.5,
  totaleRiga: 12.5,
}

const prodotti = [{
  id: 20,
  codice: 'P001',
  descrizione: 'Prodotto test',
  valoreAcquisto: 2.5,
  valoreVendita: 4,
  quantita: 10,
  scortaMinima: 2,
  archiviato: false,
  dataRegistrazione: '2026-08-01T10:00:00',
}]

function renderizzare() {
  return render(
    <FeedbackProvider>
      <MemoryRouter initialEntries={['/ordini-acquisto/10/righe']}>
        <Routes>
          <Route path="/ordini-acquisto/:ordineId/righe" element={<RigheOrdineAcquisto />} />
          <Route path="/ordini-acquisto" element={<p>Elenco acquisti</p>} />
        </Routes>
      </MemoryRouter>
    </FeedbackProvider>,
  )
}

function mockCaricamento(
  ordineRisposta = ordine,
  righeRisposta = [riga],
) {
  return vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ordineRisposta })
    .mockResolvedValueOnce({ ok: true, json: async () => righeRisposta })
    .mockResolvedValueOnce({ ok: true, json: async () => prodotti })
}

describe('RigheOrdineAcquisto', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('riceve la merce e informa che la giacenza è stata aggiornata', async () => {
    const user = userEvent.setup()
    const ricevuto = { ...ordine, dataRicevimento: '2026-08-22' }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ordine })
      .mockResolvedValueOnce({ ok: true, json: async () => [riga] })
      .mockResolvedValueOnce({ ok: true, json: async () => prodotti })
      .mockResolvedValueOnce({ ok: true, json: async () => ricevuto })
    vi.stubGlobal('fetch', fetchMock)
    renderizzare()

    await user.click(await screen.findByRole('button', { name: 'Ricevi merce' }))
    const dialogo = screen.getByRole('dialog')
    await user.click(within(dialogo).getByRole('button', { name: 'Conferma' }))

    expect(await screen.findByText('Merce ricevuta e giacenza aggiornata con successo!'))
      .toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8081/api/ordini-acquisto/10/ricevere',
      { method: 'POST' },
    )
    expect(screen.queryByRole('button', { name: 'Ricevi merce' })).not.toBeInTheDocument()
  })

  it('altera un item quando l ordine è pendente', async () => {
    const aggiornata = { ...riga, quantita: 8, totaleRiga: 20 }
    const fetchMock = mockCaricamento()
      .mockResolvedValueOnce({ ok: true, json: async () => aggiornata })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderizzare()
    await screen.findByRole('button', { name: 'Modifica P001' })

    await user.click(screen.getByRole('button', { name: 'Modifica P001' }))
    expect(screen.getByRole('heading', { name: 'Modifica riga' })).toBeInTheDocument()
    const quantita = screen.getByRole('textbox', { name: 'Quantità' })
    await user.clear(quantita)
    await user.type(quantita, '8')
    await user.click(screen.getByRole('button', { name: 'Salva' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8081/api/ordini-acquisto/10/righe/30',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codiceProdotto: 'P001',
          quantita: 8,
          valoreUnitario: 2.5,
        }),
      },
    ))
    expect(await screen.findByText('Riga aggiornata con successo!')).toBeInTheDocument()
  })

  it('non mostra l opzione di alterazione quando l ordine è ricevuto', async () => {
    vi.stubGlobal('fetch', mockCaricamento({
      ...ordine,
      dataRicevimento: '2026-08-25',
    }))
    renderizzare()

    expect(await screen.findByText(/Le righe sono disponibili in sola lettura/))
      .toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Modifica P001' }))
      .not.toBeInTheDocument()
  })
})
