import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  aggiornareOrdineVendita,
  annullareOrdineVendita,
  cercareOrdineVenditaPerId,
  creareOrdineVendita,
  elencareOrdiniVendita,
  eliminareOrdineVendita,
  rilasciareOrdineVendita,
} from './ordineVenditaService'
import type { OrdineVenditaRequest } from '../features/ordiniVendita/types/ordineVendita'

const URL = 'http://localhost:8081/api/ordini-vendita'
const request: OrdineVenditaRequest = {
  clienteId: 1,
  venditoreId: 2,
  trasportatoreId: 3,
}

describe('ordineVenditaService', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('elenca gli ordini di vendita', async () => {
    const ordini = [{ id: 1, numeroOrdine: 'OV-2026-000001' }]
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ordini })
    vi.stubGlobal('fetch', fetchMock)

    await expect(elencareOrdiniVendita()).resolves.toEqual(ordini)
    expect(fetchMock).toHaveBeenCalledWith(URL)
  })

  it('crea un ordine con gli identificatori degli agenti', async () => {
    const risposta = { id: 1, numeroOrdine: 'OV-2026-000001' }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => risposta })
    vi.stubGlobal('fetch', fetchMock)

    await expect(creareOrdineVendita(request)).resolves.toEqual(risposta)
    expect(fetchMock).toHaveBeenCalledWith(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  })

  it('propaga il messaggio restituito dalla API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ errore: "L'agente selezionato deve essere di tipo CLIENTE" }),
    }))

    await expect(creareOrdineVendita(request)).rejects.toThrow('CLIENTE')
  })

  it('cerca un ordine per identificatore', async () => {
    const ordine = { id: 1, numeroOrdine: 'OV-2026-000001' }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ordine })
    vi.stubGlobal('fetch', fetchMock)
    await expect(cercareOrdineVenditaPerId(1)).resolves.toEqual(ordine)
    expect(fetchMock).toHaveBeenCalledWith(`${URL}/1`)
  })

  it('aggiorna un ordine', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) })
    vi.stubGlobal('fetch', fetchMock)
    await aggiornareOrdineVendita(1, request)
    expect(fetchMock).toHaveBeenCalledWith(`${URL}/1`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
    })
  })

  it('elimina un ordine', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await expect(eliminareOrdineVendita(1)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(`${URL}/1`, { method: 'DELETE' })
  })

  it('rilascia un ordine', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) })
    vi.stubGlobal('fetch', fetchMock)
    await rilasciareOrdineVendita(1)
    expect(fetchMock).toHaveBeenCalledWith(`${URL}/1/rilasciare`, { method: 'POST' })
  })

  it('annulla un ordine', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) })
    vi.stubGlobal('fetch', fetchMock)
    await annullareOrdineVendita(1)
    expect(fetchMock).toHaveBeenCalledWith(`${URL}/1/annullare`, { method: 'POST' })
  })

  it('informa quando um ordine rilasciato non pode ser eliminado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ errore: "L'ordine non può essere eliminato" }),
    }))
    await expect(eliminareOrdineVendita(1)).rejects.toThrow("L'ordine non può essere eliminato")
  })

  it('mostra un messaggio comprensibile quando il server non è raggiungibile', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(eliminareOrdineVendita(1)).rejects.toThrow(
      'Impossibile contattare il server. Verificare che il backend sia avviato e riprovare.',
    )
  })
})
