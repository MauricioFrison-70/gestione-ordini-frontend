import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  atualizarAgente,
  buscarAgentePorId,
  criarAgente,
  excluirAgente,
  listarAgentes,
  listarTiposAgente,
  verificareAgenteUtilizzato,
} from './agenteService'
import type { AgenteRequest } from '../features/agentes/types/agente'

const API_URL = 'http://localhost:8081/api/agenti'

describe('agenteService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista os agentes retornados pela API', async () => {
    const agentes = [{ id: 1, nome: 'Mario Rossi' }]
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(agentes) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(listarAgentes()).resolves.toEqual(agentes)
    expect(fetchMock).toHaveBeenCalledWith(API_URL)
  })

  it('envia os dados do novo agente em formato JSON', async () => {
    const agente: AgenteRequest = {
      nome: 'Mario Rossi',
      email: 'mario.rossi@example.com',
      tipoAgente: 'VENDITORE',
      archiviato: false,
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 1, ...agente }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(criarAgente(agente)).resolves.toEqual({ id: 1, ...agente })
    expect(fetchMock).toHaveBeenCalledWith(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agente),
    })
  })

  it('busca um agente pelo seu identificador', async () => {
    const agente = { id: 1, nome: 'Mario Rossi' }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => agente })
    vi.stubGlobal('fetch', fetchMock)

    await expect(buscarAgentePorId(1)).resolves.toEqual(agente)
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/1`)
  })

  it('lista os tipos de agente disponíveis', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ['VENDITORE'] })
    vi.stubGlobal('fetch', fetchMock)

    await expect(listarTiposAgente()).resolves.toEqual(['VENDITORE'])
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8081/api/tipo-agente')
  })

  it('atualiza um agente com os dados informados', async () => {
    const agente: AgenteRequest = {
      nome: 'Mario Bianchi',
      email: 'mario.bianchi@example.com',
      tipoAgente: 'VENDITORE',
      archiviato: true,
    }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, ...agente }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(atualizarAgente(1, agente)).resolves.toEqual({ id: 1, ...agente })
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agente),
    })
  })

  it('remove um agente pelo seu identificador', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await expect(excluirAgente(1)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/1`, { method: 'DELETE' })
  })

  it('identifica quando o agente è utilizzato in un ordine di vendita', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        codice: 'AGENTE_UTILIZZATO',
        errore: "L'agente è utilizzato in uno o più ordini.",
      }),
    }))

    await expect(excluirAgente(1)).rejects.toMatchObject({
      name: 'AgenteUtilizzatoInOrdineError',
    })
  })

  it('verifica preventivamente se o agente è utilizzato', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ utilizzato: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(verificareAgenteUtilizzato(1)).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/1/utilizzo-ordini`)
  })

  it('informa falha quando a API recusa a criação', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    await expect(criarAgente({
      nome: 'Mario Rossi',
      email: 'mario.rossi@example.com',
      tipoAgente: 'VENDITORE',
      archiviato: false,
    })).rejects.toThrow('Errore nella creazione dell’agente')
  })
})
