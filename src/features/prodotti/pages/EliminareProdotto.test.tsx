import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import EliminareProdotto from './EliminareProdotto'

const prodotto = { id: 1, codice: 'SKU-001', descrizione: 'Penna blu', valoreAcquisto: 1.5, valoreVendita: 3, quantita: 20, scortaMinima: 5, archiviato: false, dataRegistrazione: '2026-08-01T10:00:00' }

describe('EliminareProdotto', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('cerca il prodotto e lo elimina dopo la conferma', async () => {
    const utente = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => prodotto })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    render(<FeedbackProvider><EliminareProdotto /></FeedbackProvider>)

    await utente.type(screen.getByRole('spinbutton', { name: 'ID del prodotto' }), '1')
    await utente.click(screen.getByRole('button', { name: 'Cerca' }))
    expect(await screen.findByText('SKU-001')).toBeInTheDocument()

    await utente.click(screen.getByRole('button', { name: 'Elimina' }))
    await utente.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Elimina' }))

    expect(await screen.findByText('Prodotto eliminato con successo!')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith('http://localhost:8081/api/prodotti/1', { method: 'DELETE' })
  })
})
