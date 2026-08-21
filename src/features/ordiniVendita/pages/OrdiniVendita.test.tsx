import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import OrdiniVendita from './OrdiniVendita'

const ordini = [
  {
    id: 1,
    numeroOrdine: 'OV-2026-000001',
    cliente: { id: 1, nome: 'Alfa SRL' },
    venditore: { id: 2, nome: 'Mario Rossi' },
    trasportatore: { id: 3, nome: 'Trasporti Italia' },
    dataRegistrazione: '2026-08-21T10:30:00',
    dataRilascio: null,
  },
  {
    id: 2,
    numeroOrdine: 'OV-2026-000002',
    cliente: { id: 4, nome: 'Beta SPA' },
    venditore: { id: 2, nome: 'Mario Rossi' },
    trasportatore: { id: 3, nome: 'Trasporti Italia' },
    dataRegistrazione: '2026-08-22T10:30:00',
    dataRilascio: '2026-08-25',
  },
]

function renderizzare() {
  return render(
    <FeedbackProvider>
      <MemoryRouter initialEntries={['/ordini-vendita']}>
        <Routes>
          <Route path="/ordini-vendita" element={<OrdiniVendita />} />
          <Route path="/ordini-vendita/creare" element={<p>Nuovo ordine</p>} />
          <Route path="/ordini-vendita/dettagli/:id" element={<p>Dettagli ordine</p>} />
          <Route path="/ordini-vendita/modificare/:id" element={<p>Modifica ordine</p>} />
        </Routes>
      </MemoryRouter>
    </FeedbackProvider>,
  )
}

describe('OrdiniVendita', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('carica e mostra gli ordini ricevuti dalla API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ordini })
    vi.stubGlobal('fetch', fetchMock)
    renderizzare()

    expect(await screen.findByText('OV-2026-000001')).toBeInTheDocument()
    expect(screen.getByText('Alfa SRL')).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8081/api/ordini-vendita')
  })

  it('filtra per numero o nome del cliente', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ordini }))
    renderizzare()
    await screen.findByText('OV-2026-000001')

    await user.type(screen.getByRole('textbox', { name: 'Cerca per numero o cliente' }), 'Beta')
    expect(screen.queryByText('OV-2026-000001')).not.toBeInTheDocument()
    expect(screen.getByText('OV-2026-000002')).toBeInTheDocument()
  })

  it('naviga alla creazione di un nuovo ordine', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderizzare()

    await user.click(screen.getByRole('button', { name: 'Crea ordine di vendita' }))
    expect(await screen.findByText('Nuovo ordine')).toBeInTheDocument()
  })

  it('oferece detalhes e alteração para o pedido', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ordini }))
    renderizzare()
    const linha = (await screen.findByText('OV-2026-000001')).closest('tr')
    await user.click(within(linha!).getByTitle('Dettagli'))
    expect(await screen.findByText('Dettagli ordine')).toBeInTheDocument()
  })

  it('spiega la regola per un ordine rilasciato ed elimina quello non rilasciato', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ordini })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    renderizzare()
    await screen.findByText('OV-2026-000001')

    const eliminaOrdineRilasciato = screen.getByRole('button', { name: 'Elimina OV-2026-000002' })
    expect(eliminaOrdineRilasciato).toBeEnabled()
    await user.click(eliminaOrdineRilasciato)
    expect(await screen.findByText(
      "L'ordine di vendita OV-2026-000002 non può essere eliminato perché è già stato rilasciato il 25/08/2026.",
    )).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Elimina OV-2026-000001' }))
    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText(/OV-2026-000001/)).toBeInTheDocument()
    await user.click(within(dialogo).getByRole('button', { name: 'Elimina' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8081/api/ordini-vendita/1', { method: 'DELETE' },
    ))
    expect(await screen.findByText('Ordine di vendita eliminato con successo!')).toBeInTheDocument()
    expect(screen.queryByText('OV-2026-000001')).not.toBeInTheDocument()
  })
})
