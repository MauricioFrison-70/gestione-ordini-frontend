import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import ExcluirAgente from './ExcluirAgente'

const agente = {
  id: 1,
  nome: 'Mario Rossi',
  email: 'mario.rossi@example.com',
  tipoAgente: 'VENDITORE',
  archiviato: false,
  dataRegistrazione: '2026-08-01T10:00:00',
}

function renderizarTela() {
  return render(
    <FeedbackProvider>
      <ExcluirAgente />
    </FeedbackProvider>,
  )
}

describe('ExcluirAgente', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('busca o agente e solicita confirmação antes de excluí-lo', async () => {
    const usuario = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => agente })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    renderizarTela()

    await usuario.type(screen.getByRole('textbox'), '1')
    await usuario.click(screen.getByRole('button', { name: 'Cerca' }))
    expect(await screen.findByText('Mario Rossi')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Elimina' }))
    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText(/Vuoi eliminare l'agente Mario Rossi/i)).toBeInTheDocument()
    await usuario.click(within(dialogo).getByRole('button', { name: 'Elimina' }))

    expect(await screen.findByText('Agente eliminato con successo!')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith('http://localhost:8081/api/agenti/1', { method: 'DELETE' })
  })
})
