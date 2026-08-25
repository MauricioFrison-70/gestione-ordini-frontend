import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  aggiornareRigaOrdineAcquisto,
  creareRigaOrdineAcquisto,
  elencareRigheOrdineAcquisto,
  eliminareRigaOrdineAcquisto,
} from './rigaOrdineAcquistoService'
import type { RigaOrdineAcquistoRequest } from '../features/ordiniAcquisto/types/rigaOrdineAcquisto'

const URL = 'http://localhost:8081/api/ordini-acquisto/10/righe'
const request: RigaOrdineAcquistoRequest = {
  codiceProdotto: 'P001',
  quantita: 8,
  valoreUnitario: 2.5,
}
const riga = {
  id: 30,
  ordineAcquistoId: 10,
  codiceProdotto: 'P001',
  descrizioneProdotto: 'Prodotto test',
  quantita: 8,
  valoreUnitario: 2.5,
  totaleRiga: 20,
}

describe('rigaOrdineAcquistoService', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('elenca as righe do pedido de compra', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [riga],
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(elencareRigheOrdineAcquisto(10)).resolves.toEqual([riga])
    expect(fetchMock).toHaveBeenCalledWith(URL)
  })

  it('altera uma riga do pedido de compra', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => riga,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(aggiornareRigaOrdineAcquisto(10, 30, request))
      .resolves.toEqual(riga)
    expect(fetchMock).toHaveBeenCalledWith(`${URL}/30`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  })

  it('cria e elimina uma riga', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => riga })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await expect(creareRigaOrdineAcquisto(10, request)).resolves.toEqual(riga)
    await expect(eliminareRigaOrdineAcquisto(10, 30)).resolves.toBeUndefined()
  })
})
