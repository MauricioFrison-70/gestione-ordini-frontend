import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import CreareOrdineVendita from './CreareOrdineVendita'

const agenti = [
  { id: 1, nome: 'Cliente Uno', email: 'cliente@example.com', tipoAgente: 'CLIENTE', archiviato: false, dataRegistrazione: '2026-01-01' },
  { id: 2, nome: 'Venditore Uno', email: 'venditore@example.com', tipoAgente: 'VENDITORE', archiviato: false, dataRegistrazione: '2026-01-01' },
  { id: 3, nome: 'Trasportatore Uno', email: 'trasportatore@example.com', tipoAgente: 'TRASPORTATORE', archiviato: false, dataRegistrazione: '2026-01-01' },
  { id: 4, nome: 'Fornitore Escluso', email: 'fornitore@example.com', tipoAgente: 'FORNITORE', archiviato: false, dataRegistrazione: '2026-01-01' },
  { id: 5, nome: 'Cliente Archiviato', email: 'archiviato@example.com', tipoAgente: 'CLIENTE', archiviato: true, dataRegistrazione: '2026-01-01' },
]

function renderizzare() {
  return render(
    <FeedbackProvider>
      <MemoryRouter initialEntries={['/ordini-vendita/creare']}>
        <Routes>
          <Route path="/ordini-vendita/creare" element={<CreareOrdineVendita />} />
          <Route path="/ordini-vendita" element={<p>Elenco ordini</p>} />
          <Route path="/ordini-vendita/:ordineId/righe" element={<p>Inclusione righe ordine</p>} />
        </Routes>
      </MemoryRouter>
    </FeedbackProvider>,
  )
}

describe('CreareOrdineVendita', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('mostra i campi automatici in sola lettura e filtra gli agenti per ruolo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => agenti }))
    renderizzare()

    expect(screen.getByRole('textbox', { name: 'Numero ordine' })).toHaveAttribute('readonly')
    expect(screen.getByRole('textbox', { name: 'Data registrazione' })).toHaveAttribute('readonly')
    expect(screen.queryByLabelText('Data rilascio')).not.toBeInTheDocument()

    const cliente = await screen.findByRole('combobox', { name: 'Cliente' })
    const venditore = screen.getByRole('combobox', { name: 'Venditore' })
    const trasportatore = screen.getByRole('combobox', { name: 'Trasportatore' })

    expect(within(cliente).getByRole('option', { name: 'Cliente Uno' })).toBeInTheDocument()
    expect(within(cliente).queryByRole('option', { name: 'Fornitore Escluso' })).not.toBeInTheDocument()
    expect(within(cliente).queryByRole('option', { name: 'Cliente Archiviato' })).not.toBeInTheDocument()
    expect(within(venditore).getByRole('option', { name: 'Venditore Uno' })).toBeInTheDocument()
    expect(within(trasportatore).getByRole('option', { name: 'Trasportatore Uno' })).toBeInTheDocument()
  })

  it('crea un ordine e apre direttamente la pagina di inserimento delle righe', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => agenti })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 10, numeroOrdine: 'OV-2026-000010' }) })
    vi.stubGlobal('fetch', fetchMock)
    renderizzare()

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Cliente' }), '1')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Venditore' }), '2')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Trasportatore' }), '3')
    await user.click(screen.getByRole('button', { name: 'Crea ordine' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8081/api/ordini-vendita',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: 1,
          venditoreId: 2,
          trasportatoreId: 3,
        }),
      },
    ))
    expect(await screen.findByText('Ordine di vendita creato con successo!')).toBeInTheDocument()
    expect(await screen.findByText('Inclusione righe ordine')).toBeInTheDocument()
  })
})
