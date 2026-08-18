import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Agentes from './Agentes'

const API_URL = 'http://localhost:8081/api/agenti'

const agentes = [
  { id: 1, nome: 'Mario Rossi', email: 'mario.rossi@example.com', tipoAgente: 'VENDITORE', archiviato: false },
  { id: 2, nome: 'Giulia Bianchi', email: 'giulia.bianchi@example.com', tipoAgente: 'FORNITORE', archiviato: true },
]

function renderizarTela() {
  return render(
    <MemoryRouter>
      <Agentes />
    </MemoryRouter>,
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

    await usuario.type(screen.getByRole('textbox', { name: 'Buscar por nome' }), 'giulia')

    expect(screen.queryByText('Mario Rossi')).not.toBeInTheDocument()
    expect(screen.getByText('Giulia Bianchi')).toBeInTheDocument()
  })

  it('exclui o agente após a confirmação do usuário', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => agentes })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: async () => agentes.filter((agente) => agente.id !== 1) })
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderizarTela()

    const nomeDoMario = await screen.findByText('Mario Rossi')
    const linhaDoMario = nomeDoMario.closest('tr')
    expect(linhaDoMario).not.toBeNull()
    await userEvent.click(within(linhaDoMario!).getByTitle('Elimina'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/1`, { method: 'DELETE' })
    })
  })
})
