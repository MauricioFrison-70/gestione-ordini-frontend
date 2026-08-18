import { afterEach, describe, expect, it, vi } from 'vitest'
import { criarAgente, listarAgentes } from './agenteService'
import type { AgenteRequest } from '../features/agentes/types/agente'

const API_URL = 'http://localhost:8081/api/agenti'

describe('agenteService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lista os agentes retornados pela API', async () => {
    const agentes = [{ id: 1, nome: 'Mario Rossi' }]
    const fetchMock = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(agentes) })
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

  it('informa falha quando a API recusa a criação', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    await expect(criarAgente({
      nome: 'Mario Rossi',
      email: 'mario.rossi@example.com',
      tipoAgente: 'VENDITORE',
      archiviato: false,
    })).rejects.toThrow('Erro ao salvar agente')
  })
})
