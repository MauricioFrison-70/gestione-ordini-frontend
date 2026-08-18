import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CriarAgente from './CriarAgente'

const API_URL = 'http://localhost:8081/api'

function renderizarTela() {
  return render(
    <MemoryRouter initialEntries={['/agentes/criar']}>
      <Routes>
        <Route path="/agentes/criar" element={<CriarAgente />} />
        <Route path="/agentes" element={<p>Lista de agentes</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CriarAgente', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('carrega os tipos de agente ao abrir a tela', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(['VENDITORE', 'FORNITORE']),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderizarTela()

    await userEvent.click(screen.getByRole('combobox', { name: 'Tipo de Agente' }))
    expect(await screen.findByRole('option', { name: 'VENDITORE' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/tipo-agente`)
  })

  it('envia o formulário preenchido e retorna para a lista', async () => {
    const usuario = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/tipo-agente')) {
        return { json: async () => ['VENDITORE'] }
      }

      if (init?.method === 'POST') {
        return { ok: true, json: async () => ({ id: 1 }) }
      }

      throw new Error(`Requisição inesperada: ${String(input)}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(window, 'alert').mockImplementation(() => undefined)

    renderizarTela()

    await usuario.type(screen.getByRole('textbox', { name: 'Nome' }), 'Mario Rossi')
    await usuario.type(screen.getByRole('textbox', { name: 'Email' }), 'mario.rossi@example.com')
    await usuario.click(screen.getByRole('combobox', { name: 'Tipo de Agente' }))
    await usuario.click(await screen.findByRole('option', { name: 'VENDITORE' }))
    await usuario.click(screen.getByRole('button', { name: 'Criar Agente' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/agenti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Mario Rossi',
          email: 'mario.rossi@example.com',
          tipoAgente: 'VENDITORE',
          archiviato: false,
        }),
      })
    })
    expect(window.alert).toHaveBeenCalledWith('Agente criado com sucesso!')
    expect(await screen.findByText('Lista de agentes')).toBeInTheDocument()
  })

  it('não envia o formulário se os campos obrigatórios estiverem vazios', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(['VENDITORE']) })
    vi.stubGlobal('fetch', fetchMock)

    renderizarTela()

    await userEvent.click(screen.getByRole('button', { name: 'Criar Agente' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
