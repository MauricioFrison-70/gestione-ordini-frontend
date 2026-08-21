import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  aggiornareProdotto,
  cercareProdottoPerId,
  creareProdotto,
  eliminareProdotto,
  elencareProdotti,
} from './prodottoService'
import type { ProdottoRequest, ProdottoUpdateRequest } from '../features/prodotti/types/prodotto'

const API_URL = 'http://localhost:8081/api/prodotti'

const nuovoProdotto: ProdottoRequest = {
  codice: 'SKU001',
  descrizione: 'Penna blu',
  valoreAcquisto: 1.5,
  valoreVendita: 3,
  quantita: 20,
  scortaMinima: 5,
  archiviato: false,
}

describe('prodottoService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('elenca i prodotti ricevuti dalla API', async () => {
    const prodotti = [{ id: 1, ...nuovoProdotto }]
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => prodotti })
    vi.stubGlobal('fetch', fetchMock)

    await expect(elencareProdotti()).resolves.toEqual(prodotti)
    expect(fetchMock).toHaveBeenCalledWith(API_URL)
  })

  it('cerca un prodotto per identificatore', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, ...nuovoProdotto }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(cercareProdottoPerId(1)).resolves.toEqual({ id: 1, ...nuovoProdotto })
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/1`)
  })

  it('crea un prodotto inviando tutti i dati richiesti', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, ...nuovoProdotto }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(creareProdotto(nuovoProdotto)).resolves.toEqual({ id: 1, ...nuovoProdotto })
    expect(fetchMock).toHaveBeenCalledWith(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuovoProdotto),
    })
  })

  it('aggiorna il prodotto senza inviare il codice immutabile', async () => {
    const aggiornamento: ProdottoUpdateRequest = {
      descrizione: 'Penna nera',
      valoreAcquisto: 1.6,
      valoreVendita: 3.2,
      quantita: 18,
      scortaMinima: 4,
      archiviato: false,
    }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, codice: 'SKU001', ...aggiornamento }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(aggiornareProdotto(1, aggiornamento)).resolves.toEqual({ id: 1, codice: 'SKU001', ...aggiornamento })
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aggiornamento),
    })
  })

  it('elimina il prodotto per identificatore', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await expect(eliminareProdotto(1)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/1`, { method: 'DELETE' })
  })

  it('propaga errore quando la API recusa la creazione', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    await expect(creareProdotto(nuovoProdotto)).rejects.toThrow('Errore nella creazione del prodotto')
  })

  it('propaga il messaggio della API quando il codice è duplicato', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ errore: "Esiste già un prodotto con il codice 'SKU001'." }),
    }))

    await expect(creareProdotto(nuovoProdotto)).rejects.toThrow("Esiste già un prodotto con il codice 'SKU001'.")
  })
})
