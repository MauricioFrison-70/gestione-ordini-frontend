import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import DettagliOrdineVendita from './DettagliOrdineVendita'

const ordine = {
  id: 1, numeroOrdine: 'OV-2026-000001',
  cliente: { id: 1, nome: 'Alfa SRL' },
  venditore: { id: 2, nome: 'Mario Rossi' },
  trasportatore: { id: 3, nome: 'Trasporti Italia' },
  dataRegistrazione: '2026-08-21T10:30:00', dataRilascio: null,
}

function renderizzare() {
  return render(<FeedbackProvider><MemoryRouter initialEntries={['/ordini-vendita/dettagli/1']}><Routes>
    <Route path="/ordini-vendita/dettagli/:id" element={<DettagliOrdineVendita />} />
    <Route path="/ordini-vendita/modificare/:id" element={<p>Pagina modifica</p>} />
  </Routes></MemoryRouter></FeedbackProvider>)
}

describe('DettagliOrdineVendita', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('mostra tutti i dati e permite acessar a alteração', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ordine }))
    const user = userEvent.setup()
    renderizzare()

    expect(await screen.findByText(/OV-2026-000001/)).toBeInTheDocument()
    expect(screen.getByText(/Alfa SRL/)).toBeInTheDocument()
    expect(screen.getByText(/Trasporti Italia/)).toBeInTheDocument()
    expect(screen.getByText(/Data rilascio:/).parentElement).toHaveTextContent('—')
    await user.click(screen.getByRole('button', { name: 'Modifica' }))
    expect(await screen.findByText('Pagina modifica')).toBeInTheDocument()
  })
})
