import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) })
    vi.stubGlobal('fetch', fetchMock)
    renderizarTela()

    fireEvent.change(screen.getByRole('textbox', { name: 'Codice' }), { target: { value: 'SKU001' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Descrizione' }), { target: { value: 'Penna blu' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Valore di acquisto' }), { target: { value: '1,50' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Valore di vendita' }), { target: { value: '3,00' } })
    const quantita = screen.getByRole('textbox', { name: 'Quantità' })
    expect(quantita).toHaveAttribute('readonly')
    expect(quantita).toHaveValue('0')
    expect(screen.getByText('La giacenza viene aggiornata automaticamente dagli ordini di acquisto e di vendita.')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Scorta minima' }), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crea prodotto' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8081/api/prodotti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codice: 'SKU001', descrizione: 'Penna blu', valoreAcquisto: 1.5,
          valoreVendita: 3, scortaMinima: 5, archiviato: false,
        }),
      })
    })
    expect(await screen.findByText('Prodotto creato con successo!')).toBeInTheDocument()
    expect(await screen.findByText('Elenco prodotti')).toBeInTheDocument()
  }, 10_000)

  it('mantiene la quantità in sola lettura e normalizza la scorta minima', async () => {
    renderizarTela()

    const quantita = screen.getByRole('textbox', { name: 'Quantità' })
    const scortaMinima = screen.getByRole('textbox', { name: 'Scorta minima' })
    fireEvent.change(scortaMinima, { target: { value: '3.5' } })

    expect(quantita).toHaveAttribute('readonly')
    expect(quantita).toHaveValue('0')
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
  }, 10_000)
})
