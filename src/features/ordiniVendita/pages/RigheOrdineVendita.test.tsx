import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import type { OrdineVendita } from '../types/ordineVendita'
import RigheOrdineVendita from './RigheOrdineVendita'

const ordine: OrdineVendita = {
  id: 10,
  numeroOrdine: 'OV-2026-000010',
  cliente: { id: 1, nome: 'Alfa SRL' },
  venditore: { id: 2, nome: 'Mario Rossi' },
  trasportatore: { id: 3, nome: 'Trasporti Italia' },
  dataRegistrazione: '2026-08-21T10:30:00',
  dataRilascio: null,
  dataAnnullamento: null,
}
const righe = [{
  id: 30,
  ordineVenditaId: 10,
  codiceProdotto: 'P001',
  descrizioneProdotto: 'Penna',
  quantita: 2,
  valoreUnitario: 10.2,
  totaleRiga: 20.4,
}]
const prodotti = [
  {
    id: 20, codice: 'P001', descrizione: 'Penna', valoreAcquisto: 6,
    valoreVendita: 10.2, quantita: 100, scortaMinima: 10, archiviato: false,
    dataRegistrazione: '2026-08-01T09:00:00',
  },
  {
    id: 21, codice: 'P002', descrizione: 'Quaderno', valoreAcquisto: 3,
    valoreVendita: 5, quantita: 50, scortaMinima: 5, archiviato: false,
    dataRegistrazione: '2026-08-01T09:00:00',
  },
]

function renderizzare() {
  return render(
    <FeedbackProvider>
      <MemoryRouter initialEntries={['/ordini-vendita/10/righe']}>
        <Routes>
          <Route path="/ordini-vendita/:ordineId/righe" element={<RigheOrdineVendita />} />
          <Route path="/ordini-vendita" element={<p>Elenco ordini di vendita</p>} />
          <Route path="/ordini-vendita/dettagli/:id" element={<p>Dettagli ordine</p>} />
        </Routes>
      </MemoryRouter>
    </FeedbackProvider>,
  )
}

function mockCaricamento(ordineRisposta = ordine, righeRisposta = righe) {
  return vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ordineRisposta })
    .mockResolvedValueOnce({ ok: true, json: async () => righeRisposta })
    .mockResolvedValueOnce({ ok: true, json: async () => prodotti })
}

describe('RigheOrdineVendita', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('carica e mostra le righe e il totale dell ordine', async () => {
    const fetchMock = mockCaricamento()
    vi.stubGlobal('fetch', fetchMock)
    renderizzare()

    expect(await screen.findByText('OV-2026-000010 · Alfa SRL')).toBeInTheDocument()
    expect(screen.getByText('P001')).toBeInTheDocument()
    expect(screen.getByText('Penna')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Quantità' })).toHaveAttribute('step', '1')
    expect(screen.getByText('Numero intero maggiore di zero')).toBeInTheDocument()
    expect(screen.getByText('Totale ordine')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:8081/api/ordini-vendita/10')
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:8081/api/ordini-vendita/10/righe')
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'http://localhost:8081/api/prodotti')
  })

  it('torna alla lista degli ordini di vendita', async () => {
    vi.stubGlobal('fetch', mockCaricamento())
    const user = userEvent.setup()
    renderizzare()
    await screen.findByText('P001')

    await user.click(screen.getByRole('button', { name: 'Torna agli ordini di vendita' }))

    expect(await screen.findByText('Elenco ordini di vendita')).toBeInTheDocument()
    expect(screen.queryByText('Dettagli ordine')).not.toBeInTheDocument()
  })

  it('aggiunge una riga usando il valore di vendita del prodotto', async () => {
    const nuovaRiga = {
      id: 31, ordineVenditaId: 10, codiceProdotto: 'P002',
      descrizioneProdotto: 'Quaderno', quantita: 3, valoreUnitario: 5, totaleRiga: 15,
    }
    const fetchMock = mockCaricamento()
      .mockResolvedValueOnce({ ok: true, json: async () => nuovaRiga })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderizzare()
    await screen.findByText('P001')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Prodotto' }), 'P002')
    expect(screen.getByRole('textbox', { name: 'Valore unitario' })).toHaveValue('5')
    await user.type(screen.getByRole('spinbutton', { name: 'Quantità' }), '3')
    await user.click(screen.getByRole('button', { name: 'Aggiungi' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8081/api/ordini-vendita/10/righe',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codiceProdotto: 'P002', quantita: 3, valoreUnitario: 5 }),
      },
    ))
    expect(await screen.findByText('Quaderno')).toBeInTheDocument()
    expect(screen.getByText('Riga aggiunta con successo!')).toBeInTheDocument()
  })

  it('modifica una riga esistente', async () => {
    const aggiornata = { ...righe[0], quantita: 3, totaleRiga: 30.6 }
    const fetchMock = mockCaricamento()
      .mockResolvedValueOnce({ ok: true, json: async () => aggiornata })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderizzare()
    await screen.findByText('P001')

    await user.click(screen.getByRole('button', { name: 'Modifica P001' }))
    const quantita = screen.getByRole('spinbutton', { name: 'Quantità' })
    await user.clear(quantita)
    await user.type(quantita, '3')
    await user.click(screen.getByRole('button', { name: 'Salva' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8081/api/ordini-vendita/10/righe/30',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codiceProdotto: 'P001', quantita: 3, valoreUnitario: 10.2 }),
      },
    ))
    expect(await screen.findByText('Riga aggiornata con successo!')).toBeInTheDocument()
  })

  it('chiede conferma prima di eliminare una riga', async () => {
    const fetchMock = mockCaricamento().mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderizzare()
    await screen.findByText('P001')

    await user.click(screen.getByRole('button', { name: 'Elimina P001' }))
    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText(/P001/)).toBeInTheDocument()
    await user.click(within(dialogo).getByRole('button', { name: 'Elimina' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8081/api/ordini-vendita/10/righe/30',
      { method: 'DELETE' },
    ))
    expect(screen.queryByText('P001')).not.toBeInTheDocument()
    expect(await screen.findByText('Riga eliminata con successo!')).toBeInTheDocument()
  })

  it('rilascia l ordine dopo la conferma', async () => {
    const rilasciato = { ...ordine, dataRilascio: '2026-08-25' }
    const fetchMock = mockCaricamento()
      .mockResolvedValueOnce({ ok: true, json: async () => rilasciato })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderizzare()
    await screen.findByText('P001')

    await user.click(screen.getByRole('button', { name: 'Rilascia ordine' }))
    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText(/Confermi il rilascio/)).toBeInTheDocument()
    await user.click(within(dialogo).getByRole('button', { name: 'Conferma' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8081/api/ordini-vendita/10/rilasciare',
      { method: 'POST' },
    ))
    expect(await screen.findByText('Ordine di vendita rilasciato con successo!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rilascia ordine' })).not.toBeInTheDocument()
  })

  it('annulla l ordine dopo la conferma', async () => {
    const annullato = { ...ordine, dataAnnullamento: '2026-08-25' }
    const fetchMock = mockCaricamento()
      .mockResolvedValueOnce({ ok: true, json: async () => annullato })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderizzare()
    await screen.findByText('P001')

    await user.click(screen.getByRole('button', { name: 'Annulla ordine' }))
    const dialogo = screen.getByRole('dialog')
    await user.click(within(dialogo).getByRole('button', { name: 'Conferma' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8081/api/ordini-vendita/10/annullare',
      { method: 'POST' },
    ))
    expect(await screen.findByText('Ordine di vendita annullato con successo!')).toBeInTheDocument()
  })

  it('mostra os produtos sem saldo e mantém o pedido pendente', async () => {
    const messaggio = "Scorta insufficiente. L'operazione è stata annullata. "
      + 'Prodotti: P001 (disponibile: 1, richiesta: 2).'
    const fetchMock = mockCaricamento()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ codice: 'SCORTA_INSUFFICIENTE', errore: messaggio }),
      })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderizzare()
    await screen.findByText('P001')

    await user.click(screen.getByRole('button', { name: 'Rilascia ordine' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Conferma' }))

    expect(await screen.findByText(messaggio)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Rilascia ordine' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Modifica P001' })).toBeInTheDocument()
  })

  it('mantiene le righe in sola lettura quando l ordine è rilasciato', async () => {
    vi.stubGlobal('fetch', mockCaricamento({ ...ordine, dataRilascio: '2026-08-25' }))
    renderizzare()

    expect(await screen.findByText(/Le righe sono disponibili in sola lettura/)).toBeInTheDocument()
    expect(screen.getByText('P001')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aggiungi' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Modifica P001' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Elimina P001' })).not.toBeInTheDocument()
  })
})
