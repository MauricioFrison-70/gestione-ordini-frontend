import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import CreareProdotto from './CreareProdotto'

function renderizarTela() {
  return render(
    <FeedbackProvider>
      <MemoryRouter initialEntries={['/prodotti/creare']}>
        <Routes>
          <Route path="/prodotti/creare" element={<CreareProdotto />} />
          <Route path="/prodotti" element={<p>Elenco prodotti</p>} />
        </Routes>
      </MemoryRouter>
    </FeedbackProvider>,
  )
}

describe('CreareProdotto', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('invia i dati del nuovo prodotto', async () => {
    const utente = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) })
    vi.stubGlobal('fetch', fetchMock)
    renderizarTela()

    await utente.type(screen.getByRole('textbox', { name: 'Codice' }), 'SKU-001')
    await utente.type(screen.getByRole('textbox', { name: 'Descrizione' }), 'Penna blu')
    await utente.type(screen.getByRole('spinbutton', { name: 'Valore di acquisto' }), '1.5')
    await utente.type(screen.getByRole('spinbutton', { name: 'Valore di vendita' }), '3')
    await utente.type(screen.getByRole('spinbutton', { name: 'Quantità' }), '20')
    await utente.type(screen.getByRole('spinbutton', { name: 'Scorta minima' }), '5')
    await utente.click(screen.getByRole('button', { name: 'Crea prodotto' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8081/api/prodotti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codice: 'SKU-001', descrizione: 'Penna blu', valoreAcquisto: 1.5,
          valoreVendita: 3, quantita: 20, scortaMinima: 5, archiviato: false,
        }),
      })
    })
    expect(await screen.findByText('Prodotto creato con successo!')).toBeInTheDocument()
    expect(await screen.findByText('Elenco prodotti')).toBeInTheDocument()
  })
})
