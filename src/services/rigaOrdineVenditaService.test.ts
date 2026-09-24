import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  aggiornareRigaOrdineVendita,
  creareRigaOrdineVendita,
  elencareRigheOrdineVendita,
  eliminareRigaOrdineVendita,
} from './rigaOrdineVenditaService'
import type { RigaOrdineVenditaRequest } from '../features/ordiniVendita/types/rigaOrdineVendita'

const URL = 'http://localhost:8081/api/ordini-vendita/10/righe'
const request: RigaOrdineVenditaRequest = {
  codiceProdotto: 'P001',
  quantita: 2,
  valoreUnitario: 10.2,
}
const riga = {
  id: 30,
  ordineVenditaId: 10,
  codiceProdotto: 'P001',
  descrizioneProdotto: 'Penna',
  quantita: 2,
  valoreUnitario: 10.2,
  totaleRiga: 20.4,
}

describe('rigaOrdineVenditaService', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('elenca le righe dell ordine', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [riga] })
    vi.stubGlobal('fetch', fetchMock)

    await expect(elencareRigheOrdineVendita(10)).resolves.toEqual([riga])
    expect(fetchMock).toHaveBeenCalledWith(URL)
  })

  it('crea una riga', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => riga })
    vi.stubGlobal('fetch', fetchMock)

    await expect(creareRigaOrdineVendita(10, request)).resolves.toEqual(riga)
    expect(fetchMock).toHaveBeenCalledWith(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  })

  it('aggiorna una riga', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => riga })
    vi.stubGlobal('fetch', fetchMock)

    await expect(aggiornareRigaOrdineVendita(10, 30, request)).resolves.toEqual(riga)
    expect(fetchMock).toHaveBeenCalledWith(`${URL}/30`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  })

  it('elimina una riga', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await expect(eliminareRigaOrdineVendita(10, 30)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(`${URL}/30`, { method: 'DELETE' })
  })

  it('propaga il messaggio restituito dalla API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ errore: 'Il prodotto è già presente nell ordine' }),
    }))

    await expect(creareRigaOrdineVendita(10, request)).rejects.toThrow(
      'Il prodotto è già presente nell ordine',
    )
  })

  it('mostra un messaggio comprensibile quando il server non è raggiungibile', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const verifica = expect(elencareRigheOrdineVendita(10)).rejects.toThrow(
      'Il database non è diventato disponibile entro 90 secondi. Riprovare.',
    )
    await vi.advanceTimersByTimeAsync(90_000)
    await verifica
  })
})
