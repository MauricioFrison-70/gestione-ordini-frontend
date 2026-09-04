import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AssistenteSistema from './AssistenteSistema'

describe('AssistenteSistema', () => {
  it('mostra la presentazione e disabilita l’invio senza una domanda', () => {
    render(<AssistenteSistema />)

    expect(screen.getByText('Assistente Gestione Ordini')).toBeInTheDocument()
    expect(screen.getByText(/Posso aiutarti con l’utilizzo/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Invia domanda' })).toBeDisabled()
  })

  it('invia la domanda con Enter e mostra la risposta', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(
      JSON.stringify({ risposta: 'La giacenza viene aggiornata dagli ordini.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))
    vi.stubGlobal('fetch', fetchMock)
    render(<AssistenteSistema />)

    const campo = screen.getByLabelText('Scrivi una domanda sul sistema')
    await user.type(campo, 'Come viene aggiornata la giacenza?{enter}')

    expect(await screen.findByText('La giacenza viene aggiornata dagli ordini.')).toBeInTheDocument()
    const corpo = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as {
      domanda: string
      cronologia: unknown[]
    }
    expect(corpo.domanda).toBe('Come viene aggiornata la giacenza?')
    expect(corpo.cronologia).toEqual([])
  })

  it('mostra un errore sicuro e permette di riprovare', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      json: async () => ({ errore: 'L’assistente IA non è temporaneamente disponibile.' }),
    })))
    render(<AssistenteSistema />)

    await user.type(screen.getByLabelText('Scrivi una domanda sul sistema'), 'Aiutami')
    await user.click(screen.getByRole('button', { name: 'Invia domanda' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'L’assistente IA non è temporaneamente disponibile.',
    )
    await waitFor(() => expect(screen.getByLabelText('Scrivi una domanda sul sistema')).toBeEnabled())
  })
})
