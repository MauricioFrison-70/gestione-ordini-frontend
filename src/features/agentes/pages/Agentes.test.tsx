import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import Agentes from './Agentes'

const API_URL = 'http://localhost:8081/api/agenti'

const agentes = [
  { id: 1, nome: 'Mario Rossi', email: 'mario.rossi@example.com', tipoAgente: 'VENDITORE', archiviato: false },
  { id: 2, nome: 'Giulia Bianchi', email: 'giulia.bianchi@example.com', tipoAgente: 'FORNITORE', archiviato: true },
]

function renderizarTela() {
  return render(
    <FeedbackProvider>
      <MemoryRouter>
        <Agentes />
      </MemoryRouter>
    </FeedbackProvider>,
  )
}

describe('Agentes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista os agentes recebidos da API e permite filtrar por nome', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => agentes }))
    const usuario = userEvent.setup()

    renderizarTela()

    expect(await screen.findByText('Mario Rossi')).toBeInTheDocument()
    expect(screen.getByText('Giulia Bianchi')).toBeInTheDocument()

    await usuario.type(screen.getByRole('textbox', { name: 'Cerca per nome' }), 'giulia')

    expect(screen.queryByText('Mario Rossi')).not.toBeInTheDocument()
    expect(screen.getByText('Giulia Bianchi')).toBeInTheDocument()
  })

  it('exibe carregamento e informa erro quando a listagem falha', async () => {
    let concluirRequisicao: ((value: unknown) => void) | undefined
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise((resolve) => {
      concluirRequisicao = resolve
    })))

    renderizarTela()

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    concluirRequisicao?.({ ok: false })

    expect(await screen.findByText('Errore nel caricamento degli agenti')).toBeInTheDocument()
  })

  it('exclui o agente após a confirmação do usuário', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => agentes })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: async () => agentes.filter((agente) => agente.id !== 1) })
    vi.stubGlobal('fetch', fetchMock)
    renderizarTela()

    const nomeDoMario = await screen.findByText('Mario Rossi')
    const linhaDoMario = nomeDoMario.closest('tr')
    expect(linhaDoMario).not.toBeNull()
    await userEvent.click(within(linhaDoMario!).getByTitle('Elimina'))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Elimina' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/1`, { method: 'DELETE' })
    })
  })
})
