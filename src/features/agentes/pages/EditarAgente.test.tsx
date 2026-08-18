import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import EditarAgente from './EditarAgente'

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
      <MemoryRouter initialEntries={['/agentes/editar/1']}>
        <Routes>
          <Route path="/agentes/editar/:id" element={<EditarAgente />} />
          <Route path="/agentes" element={<p>Elenco agenti</p>} />
        </Routes>
      </MemoryRouter>
    </FeedbackProvider>,
  )
}

describe('EditarAgente', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('carrega os dados e envia a alteração para a API', async () => {
    const usuario = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/tipo-agente')) {
        return { ok: true, json: async () => ['VENDITORE', 'FORNITORE'] }
      }

      if (init?.method === 'PUT') {
        return { ok: true, json: async () => agente }
      }

      return { ok: true, json: async () => agente }
    })
    vi.stubGlobal('fetch', fetchMock)

    renderizarTela()

    const campoNome = await screen.findByDisplayValue('Mario Rossi')
    await usuario.clear(campoNome)
    await usuario.type(campoNome, 'Mario Bianchi')
    await usuario.click(screen.getByRole('button', { name: /salva modifiche/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8081/api/agenti/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Mario Bianchi',
          email: 'mario.rossi@example.com',
          tipoAgente: 'VENDITORE',
          archiviato: false,
        }),
      })
    })
    expect(await screen.findByText('Agente aggiornato con successo!')).toBeInTheDocument()
    expect(await screen.findByText('Elenco agenti')).toBeInTheDocument()
  })

  it('informa erro quando o agente não é encontrado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    renderizarTela()

    expect(await screen.findByText('Agente non trovato')).toBeInTheDocument()
  })
})
