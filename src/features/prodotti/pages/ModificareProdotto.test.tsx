import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import ModificareProdotto from './ModificareProdotto'

const prodotto = { id: 1, codice: 'SKU001', descrizione: 'Penna blu', valoreAcquisto: 1.5, valoreVendita: 3, quantita: 20, scortaMinima: 5, archiviato: false, dataRegistrazione: '2026-08-01T10:00:00' }

function renderizarTela() {
  return render(
    <FeedbackProvider>
      <MemoryRouter initialEntries={['/prodotti/modificare/1']}>
        <Routes>
          <Route path="/prodotti/modificare/:id" element={<ModificareProdotto />} />
          <Route path="/prodotti" element={<p>Elenco prodotti</p>} />
        </Routes>
      </MemoryRouter>
    </FeedbackProvider>,
  )
}

describe('ModificareProdotto', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mantiene il codice immutabile e invia gli altri dati aggiornati', async () => {
    const utente = userEvent.setup()
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'PUT') return { ok: true, json: async () => prodotto }
      return { ok: true, json: async () => prodotto }
    })
    vi.stubGlobal('fetch', fetchMock)
    renderizarTela()

    const campoCodice = await screen.findByDisplayValue('SKU001')
    expect(campoCodice).toBeDisabled()
    expect(screen.getByDisplayValue('1,5')).toBeInTheDocument()
    const campoDescrizione = screen.getByDisplayValue('Penna blu')
    expect(campoDescrizione).toHaveAttribute('maxlength', '30')
    await utente.clear(campoDescrizione)
    await utente.type(campoDescrizione, 'Penna nera')
    await utente.click(screen.getByRole('button', { name: 'Salva modifiche' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('http://localhost:8081/api/prodotti/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descrizione: 'Penna nera', valoreAcquisto: 1.5, valoreVendita: 3, quantita: 20, scortaMinima: 5, archiviato: false }),
    }))
    expect(await screen.findByText('Prodotto aggiornato con successo!')).toBeInTheDocument()
  })
})
