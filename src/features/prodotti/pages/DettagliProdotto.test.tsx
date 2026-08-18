import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import DettagliProdotto from './DettagliProdotto'

const prodotto = { id: 1, codice: 'SKU-001', descrizione: 'Penna blu', valoreAcquisto: 1.5, valoreVendita: 3, quantita: 20, scortaMinima: 5, archiviato: false, dataRegistrazione: '2026-08-01T10:00:00' }

describe('DettagliProdotto', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mostra i dettagli restituiti dalla API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => prodotto }))

    render(
      <FeedbackProvider>
        <MemoryRouter initialEntries={['/prodotti/dettagli/1']}>
          <Routes><Route path="/prodotti/dettagli/:id" element={<DettagliProdotto />} /></Routes>
        </MemoryRouter>
      </FeedbackProvider>,
    )

    expect(await screen.findByText('Penna blu')).toBeInTheDocument()
    expect(screen.getByText('SKU-001')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
  })
})
