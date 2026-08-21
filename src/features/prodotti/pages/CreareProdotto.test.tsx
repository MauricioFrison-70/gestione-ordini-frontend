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

    await utente.type(screen.getByRole('textbox', { name: 'Codice' }), 'SKU001')
    await utente.type(screen.getByRole('textbox', { name: 'Descrizione' }), 'Penna blu')
    await utente.type(screen.getByRole('textbox', { name: 'Valore di acquisto' }), '1,50')
    await utente.type(screen.getByRole('textbox', { name: 'Valore di vendita' }), '3,00')
    await utente.type(screen.getByRole('textbox', { name: 'Quantità' }), '20')
    await utente.type(screen.getByRole('textbox', { name: 'Scorta minima' }), '5')
    await utente.click(screen.getByRole('button', { name: 'Crea prodotto' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8081/api/prodotti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codice: 'SKU001', descrizione: 'Penna blu', valoreAcquisto: 1.5,
          valoreVendita: 3, quantita: 20, scortaMinima: 5, archiviato: false,
        }),
      })
    })
    expect(await screen.findByText('Prodotto creato con successo!')).toBeInTheDocument()
    expect(await screen.findByText('Elenco prodotti')).toBeInTheDocument()
  }, 10_000)

  it('mantiene soltanto cifre intere nei campi di quantità', async () => {
    const utente = userEvent.setup()
    renderizarTela()

    const quantita = screen.getByRole('textbox', { name: 'Quantità' })
    const scortaMinima = screen.getByRole('textbox', { name: 'Scorta minima' })
    await utente.type(quantita, '12,5')
    await utente.type(scortaMinima, '3.5')

    expect(quantita).toHaveValue('125')
    expect(scortaMinima).toHaveValue('35')
  })

  it('limita codice e descrizione alle dimensioni definite dal backend', async () => {
    const utente = userEvent.setup()
    renderizarTela()

    const codice = screen.getByRole('textbox', { name: 'Codice' })
    const descrizione = screen.getByRole('textbox', { name: 'Descrizione' })
    await utente.type(codice, 'ABC1234')
    await utente.type(descrizione, 'D'.repeat(31))

    expect(codice).toHaveValue('ABC123')
    expect(descrizione).toHaveValue('D'.repeat(30))
  })
})
