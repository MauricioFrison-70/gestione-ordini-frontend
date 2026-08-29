import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../../../components/FeedbackProvider'
import Rapporti from './Rapporti'

const rapporto = {
  id: 1,
  codice: 'ORDINI_VENDITA_PER_PERIODO',
  titolo: 'Ordini di vendita per periodo',
  descrizione: 'Elenca gli ordini registrati nel periodo selezionato.',
  attivo: true,
  parametri: [
    {
      nome: 'DataInizio', etichetta: 'Data iniziale', tipo: 'DATA',
      obbligatorio: true, ordine: 1, valorePredefinito: null, haOpzioni: false,
    },
    {
      nome: 'DataFine', etichetta: 'Data finale', tipo: 'DATA',
      obbligatorio: true, ordine: 2, valorePredefinito: null, haOpzioni: false,
    },
    {
      nome: 'ClienteId', etichetta: 'Cliente', tipo: 'SELEZIONE',
      obbligatorio: false, ordine: 3, valorePredefinito: null, haOpzioni: true,
    },
  ],
}

const risultato = {
  colonne: [
    { nome: 'numeroOrdine', etichetta: 'Numero ordine', tipo: 'TESTO', formato: null, totalizzare: false },
    { nome: 'dataRegistrazione', etichetta: 'Data registrazione', tipo: 'DATA_ORA', formato: 'DATA_ORA', totalizzare: false },
    { nome: 'valoreTotale', etichetta: 'Valore totale', tipo: 'DECIMALE', formato: 'VALUTA', totalizzare: true },
  ],
  righe: [{
    numeroOrdine: 'OV-2026-000001',
    dataRegistrazione: '2026-08-25T14:30:00',
    valoreTotale: 1250.5,
  }],
  totali: { valoreTotale: 1250.5 },
  totaleRighe: 1,
  troncato: false,
}

function renderizzare() {
  return render(<FeedbackProvider><Rapporti /></FeedbackProvider>)
}

describe('Rapporti', () => {
  it('monta i filtri dal catalogo, carica le opzioni ed espone il risultato dinamico', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [rapporto] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ valore: 7, etichetta: 'Cliente Alfa' }],
      })
      .mockResolvedValueOnce({ ok: true, json: async () => risultato })
    vi.stubGlobal('fetch', fetchMock)
    renderizzare()

    expect(await screen.findByText(rapporto.descrizione)).toBeInTheDocument()
    expect(screen.getByLabelText(/Data iniziale/)).toHaveAttribute('type', 'date')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8081/api/rapporti/1/parametri/ClienteId/opzioni',
    ))

    await user.type(screen.getByLabelText(/Data iniziale/), '2026-08-01')
    await user.type(screen.getByLabelText(/Data finale/), '2026-08-31')
    await user.click(screen.getByLabelText('Cliente'))
    await user.click(await screen.findByRole('option', { name: 'Cliente Alfa' }))
    await user.click(screen.getByRole('button', { name: 'Esegui rapporto' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:8081/api/rapporti/1/esegui',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ parametri: {
          DataInizio: '2026-08-01', DataFine: '2026-08-31', ClienteId: '7',
        } }),
      }),
    ))
    expect(await screen.findByText('OV-2026-000001')).toBeInTheDocument()
    expect(screen.getByText('Numero ordine')).toBeInTheDocument()
    expect(screen.getByText('Valore totale').closest('th')).toHaveClass('MuiTableCell-alignRight')
    expect(screen.getAllByText((testo) => testo.includes('1250,50'))[0].closest('td')).toHaveClass(
      'MuiTableCell-alignRight',
    )
    expect(screen.getAllByText((testo) => testo.includes('1250,50'))).toHaveLength(2)
    expect(screen.getByRole('row', { name: 'Totale rapporto' })).toHaveTextContent('Totale')
    expect(screen.getByText('1 righe visualizzate')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Esporta il rapporto in Excel' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Esporta il rapporto in PDF' })).toBeEnabled()
  })

  it('impedisce l’esecuzione quando manca un parametro obbligatorio', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [rapporto] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
    vi.stubGlobal('fetch', fetchMock)
    renderizzare()

    await screen.findByText(rapporto.descrizione)
    await user.click(screen.getByRole('button', { name: 'Esegui rapporto' }))

    expect(await screen.findByText("Il parametro 'Data iniziale' è obbligatorio")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('mostra chiaramente quando il risultato è stato limitato', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{ ...rapporto, parametri: [] }] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...risultato, righe: [], totaleRighe: 500, troncato: true }),
      })
    vi.stubGlobal('fetch', fetchMock)
    renderizzare()

    await user.click(await screen.findByRole('button', { name: 'Esegui rapporto' }))
    const avviso = await screen.findByRole('alert')
    expect(within(avviso).getByText(/limitato alle prime 500 righe/)).toBeInTheDocument()
    expect(screen.getByText('Nessun dato trovato.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Esporta il rapporto in Excel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Esporta il rapporto in PDF' })).toBeDisabled()
  })
})
