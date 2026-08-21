import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import Prodotti from './Prodotti'

const prodotti = [
  { id: 1, codice: 'SKU001', descrizione: 'Penna blu', valoreAcquisto: 1.5, valoreVendita: 3, quantita: 20, scortaMinima: 5, archiviato: false, dataRegistrazione: '2026-08-01T10:00:00' },
  { id: 2, codice: 'SKU002', descrizione: 'Quaderno', valoreAcquisto: 2, valoreVendita: 4, quantita: 8, scortaMinima: 3, archiviato: true, dataRegistrazione: '2026-08-01T10:00:00' },
]

function renderizarTela() {
  return render(<FeedbackProvider><MemoryRouter><Prodotti /></MemoryRouter></FeedbackProvider>)
}

describe('Prodotti', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('elenca e filtra i prodotti per codice o descrizione', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => prodotti }))
    const utente = userEvent.setup()
    renderizarTela()

    expect(await screen.findByText('Penna blu')).toBeInTheDocument()
    await utente.type(screen.getByRole('textbox', { name: 'Cerca per codice o descrizione' }), 'quaderno')

    expect(screen.queryByText('Penna blu')).not.toBeInTheDocument()
    expect(screen.getByText('Quaderno')).toBeInTheDocument()
  })

  it('richiede conferma e ricarica l’elenco dopo l’eliminazione', async () => {
    const utente = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => prodotti })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: async () => prodotti.slice(1) })
    vi.stubGlobal('fetch', fetchMock)
    renderizarTela()

    const penna = await screen.findByText('Penna blu')
    const riga = penna.closest('tr')
    expect(riga).not.toBeNull()
    await utente.click(within(riga!).getByTitle('Elimina'))
    await utente.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Elimina' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('http://localhost:8081/api/prodotti/1', { method: 'DELETE' }))
    expect(await screen.findByText('Prodotto eliminato con successo!')).toBeInTheDocument()
  })
})
