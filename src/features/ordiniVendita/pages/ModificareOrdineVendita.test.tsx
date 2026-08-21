import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import ModificareOrdineVendita from './ModificareOrdineVendita'

const ordine = {
  id: 1, numeroOrdine: 'OV-2026-000001',
  cliente: { id: 1, nome: 'Alfa SRL' }, venditore: { id: 2, nome: 'Mario Rossi' },
  trasportatore: { id: 3, nome: 'Trasporti Italia' },
  dataRegistrazione: '2026-08-21T10:30:00', dataRilascio: null,
}
const agenti = [
  { id: 1, nome: 'Alfa SRL', email: 'a@a.it', tipoAgente: 'CLIENTE', archiviato: false, dataRegistrazione: '' },
  { id: 2, nome: 'Mario Rossi', email: 'm@m.it', tipoAgente: 'VENDITORE', archiviato: false, dataRegistrazione: '' },
  { id: 3, nome: 'Trasporti Italia', email: 't@t.it', tipoAgente: 'TRASPORTATORE', archiviato: false, dataRegistrazione: '' },
  { id: 4, nome: 'Beta SPA', email: 'b@b.it', tipoAgente: 'CLIENTE', archiviato: false, dataRegistrazione: '' },
]

function renderizzare() {
  return render(<FeedbackProvider><MemoryRouter initialEntries={['/ordini-vendita/modificare/1']}><Routes>
    <Route path="/ordini-vendita/modificare/:id" element={<ModificareOrdineVendita />} />
    <Route path="/ordini-vendita" element={<p>Elenco ordini</p>} />
  </Routes></MemoryRouter></FeedbackProvider>)
}

describe('ModificareOrdineVendita', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('carica, modifica e salva l\'ordine mantenendo la data di rilascio in sola lettura', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ordine })
      .mockResolvedValueOnce({ ok: true, json: async () => agenti })
      .mockResolvedValueOnce({ ok: true, json: async () => ordine })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderizzare()

    await screen.findByDisplayValue('OV-2026-000001')
    expect(screen.getByLabelText('Data rilascio')).toHaveAttribute('readonly')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Cliente' }), '4')
    await user.click(screen.getByRole('button', { name: 'Salva modifiche' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8081/api/ordini-vendita/1',
      {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: 4, venditoreId: 2, trasportatoreId: 3, dataRilascio: null }),
      },
    ))
    expect(await screen.findByText('Ordine di vendita aggiornato con successo!')).toBeInTheDocument()
    expect(await screen.findByText('Elenco ordini')).toBeInTheDocument()
  })
})
