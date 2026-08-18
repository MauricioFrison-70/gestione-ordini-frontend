import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import DettagliAgente from './DettagliAgente'

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
      <MemoryRouter initialEntries={['/agentes/detalhes/1']}>
        <Routes>
          <Route path="/agentes/detalhes/:id" element={<DettagliAgente />} />
        </Routes>
      </MemoryRouter>
    </FeedbackProvider>,
  )
}

describe('DettagliAgente', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exibe o estado de carregamento e os detalhes recebidos da API', async () => {
    let concluirRequisicao: ((value: unknown) => void) | undefined
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise((resolve) => {
      concluirRequisicao = resolve
    })))

    renderizarTela()

    expect(screen.getByText('Caricamento dettagli...')).toBeInTheDocument()
    concluirRequisicao?.({ ok: true, json: async () => agente })

    expect(await screen.findByText('Mario Rossi')).toBeInTheDocument()
    expect(screen.getByText('mario.rossi@example.com')).toBeInTheDocument()
  })

  it('mostra uma mensagem quando a API não retorna os detalhes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    renderizarTela()

    expect(await screen.findByText('Errore nel caricamento dei dettagli dell’agente')).toBeInTheDocument()
  })
})
