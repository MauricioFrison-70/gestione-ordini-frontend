import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, EVENTO_DATABASE_IN_RIATTIVAZIONE } from './apiFetch'

describe('apiFetch', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('ripete una GET quando il database Azure è in riattivazione', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ codice: 'DATABASE_IN_RIATTIVAZIONE' }),
        { status: 503, headers: { 'Retry-After': '0' } },
      ))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1 }]), { status: 200 }))
    const stati: boolean[] = []
    const listener = (evento: Event) => {
      stati.push((evento as CustomEvent<{ attivo: boolean }>).detail.attivo)
    }
    window.addEventListener(EVENTO_DATABASE_IN_RIATTIVAZIONE, listener)
    vi.stubGlobal('fetch', fetchMock)

    const response = await apiFetch('/api/agenti')

    expect(await response.json()).toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(stati).toEqual([true, false])
    window.removeEventListener(EVENTO_DATABASE_IN_RIATTIVAZIONE, listener)
  })

  it('non ripete una scrittura', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ codice: 'DATABASE_IN_RIATTIVAZIONE' }),
      { status: 503 },
    ))
    vi.stubGlobal('fetch', fetchMock)

    const response = await apiFetch('/api/prodotti', { method: 'POST' })

    expect(response.status).toBe(503)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('mantiene un messaggio comprensibile per gli errori di rete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(apiFetch('/api/agenti')).rejects.toThrow(
      'Impossibile contattare il server. Verificare che il backend sia avviato e riprovare.',
    )
  })
})
