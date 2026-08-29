import { describe, expect, it, vi } from 'vitest'
import {
  elencareOpzioniParametro,
  elencareRapporti,
  eseguireRapporto,
} from './rapportoService'

const URL = 'http://localhost:8081/api/rapporti'

describe('rapportoService', () => {
  it('carica il catalogo dei rapporti', async () => {
    const rapporti = [{ id: 1, codice: 'VENDITE', titolo: 'Vendite' }]
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => rapporti })
    vi.stubGlobal('fetch', fetchMock)

    await expect(elencareRapporti()).resolves.toEqual(rapporti)
    expect(fetchMock).toHaveBeenCalledWith(URL)
  })

  it('carica le opzioni configurate per un parametro', async () => {
    const opzioni = [{ valore: 10, etichetta: 'Cliente Alfa' }]
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => opzioni })
    vi.stubGlobal('fetch', fetchMock)

    await expect(elencareOpzioniParametro(2, 'Cliente Id')).resolves.toEqual(opzioni)
    expect(fetchMock).toHaveBeenCalledWith(`${URL}/2/parametri/Cliente%20Id/opzioni`)
  })

  it('esegue un rapporto con i parametri informati', async () => {
    const risultato = { colonne: [], righe: [], totali: {}, totaleRighe: 0, troncato: false }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => risultato })
    vi.stubGlobal('fetch', fetchMock)

    await expect(eseguireRapporto(3, { DataInizio: '2026-01-01' })).resolves.toEqual(risultato)
    expect(fetchMock).toHaveBeenCalledWith(`${URL}/3/esegui`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parametri: { DataInizio: '2026-01-01' } }),
    })
  })

  it('propaga il messaggio di errore restituito dalla API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ errore: 'Configurazione non sincronizzata' }),
    }))

    await expect(eseguireRapporto(1, {})).rejects.toThrow('Configurazione non sincronizzata')
  })
})
