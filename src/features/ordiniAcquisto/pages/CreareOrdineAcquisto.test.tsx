import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import CreareOrdineAcquisto from './CreareOrdineAcquisto'

const agenti = [
  { id: 1, nome: 'Fornitore Attivo', email: 'f@example.com', tipoAgente: 'FORNITORE', archiviato: false, dataRegistrazione: '2026-01-01' },
  { id: 2, nome: 'Cliente Escluso', email: 'c@example.com', tipoAgente: 'CLIENTE', archiviato: false, dataRegistrazione: '2026-01-01' },
  { id: 3, nome: 'Fornitore Archiviato', email: 'a@example.com', tipoAgente: 'FORNITORE', archiviato: true, dataRegistrazione: '2026-01-01' },
]

function renderizzare() {
  return render(
    <FeedbackProvider>
      <MemoryRouter initialEntries={['/ordini-acquisto/creare']}>
        <Routes>
          <Route path="/ordini-acquisto/creare" element={<CreareOrdineAcquisto />} />
          <Route path="/ordini-acquisto/:ordineId/righe" element={<p>Inserimento righe</p>} />
        </Routes>
      </MemoryRouter>
    </FeedbackProvider>,
  )
}

describe('CreareOrdineAcquisto', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('mostra soltanto i fornitori attivi e apre le righe dopo il salvataggio', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => agenti })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 10, numeroOrdine: 'OA-2026-000010' }),
      })
    vi.stubGlobal('fetch', fetchMock)
    renderizzare()

    const fornitore = await screen.findByRole('combobox', { name: 'Fornitore' })
    expect(screen.getByRole('option', { name: 'Fornitore Attivo' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Cliente Escluso' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Fornitore Archiviato' })).not.toBeInTheDocument()

    await user.selectOptions(fornitore, '1')
    await user.click(screen.getByRole('button', { name: 'Crea ordine' }))

    expect(await screen.findByText('Inserimento righe')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8081/api/ordini-acquisto',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fornitoreId: 1 }),
      },
    )
  })
})
