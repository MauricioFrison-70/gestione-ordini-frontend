import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  annullareOrdineAcquisto,
  creareOrdineAcquisto,
  eliminareOrdineAcquisto,
  ricevereOrdineAcquisto,
} from './ordineAcquistoService'

const ordine = {
  id: 10,
  numeroOrdine: 'OA-2026-000010',
  fornitore: { id: 2, nome: 'Fornitore' },
  dataRegistrazione: '2026-08-22T10:00:00',
  dataRicevimento: null,
  dataAnnullamento: null,
}

describe('ordineAcquistoService', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('crea e riceve un ordine', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ordine })
    vi.stubGlobal('fetch', fetchMock)

    await creareOrdineAcquisto({ fornitoreId: 2 })
    await ricevereOrdineAcquisto(10)

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:8081/api/ordini-acquisto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fornitoreId: 2 }),
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8081/api/ordini-acquisto/10/ricevere',
      { method: 'POST' },
    )
  })

  it('annulla ed elimina un ordine', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ordine })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await annullareOrdineAcquisto(10)
    await eliminareOrdineAcquisto(10)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8081/api/ordini-acquisto/10/annullare',
      { method: 'POST' },
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8081/api/ordini-acquisto/10',
      { method: 'DELETE' },
    )
  })
})
