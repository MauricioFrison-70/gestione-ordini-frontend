import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, EVENTO_DATABASE_IN_RIATTIVAZIONE } from './apiFetch'

describe('apiFetch', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('ripete una GET quando il database Azure è in riattivazione', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ codice: 'DATABASE_IN_RIATTIVAZIONE' }),
        { status: 503, headers: { 'Retry-After': '0' } },
      ))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1 }]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await apiFetch('/api/agenti')

    expect(await response.json()).toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('mostra la riattivazione solo dopo dieci secondi di attesa', async () => {
    vi.useFakeTimers()
    let completareRichiesta!: (response: Response) => void
    const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((resolve) => {
      completareRichiesta = resolve
    }))
    const stati: boolean[] = []
    const listener = (evento: Event) => {
      stati.push((evento as CustomEvent<{ attivo: boolean }>).detail.attivo)
    }
    window.addEventListener(EVENTO_DATABASE_IN_RIATTIVAZIONE, listener)
    vi.stubGlobal('fetch', fetchMock)

    const richiesta = apiFetch('/api/agenti')
    await vi.advanceTimersByTimeAsync(9_999)
    expect(stati).toEqual([])

    await vi.advanceTimersByTimeAsync(1)
    expect(stati).toEqual([true])

    completareRichiesta(new Response(JSON.stringify([]), { status: 200 }))
    await richiesta
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

  it('attende novanta secondi prima di mostrare l errore definitivo', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(
      JSON.stringify({ errore: 'Errore interno del server' }),
      { status: 500, headers: { 'Retry-After': '8' } },
    )))
    vi.stubGlobal('fetch', fetchMock)

    const richiesta = apiFetch('/api/agenti')
    const verifica = expect(richiesta).rejects.toThrow(
      'Il database non è diventato disponibile entro 90 secondi. Riprovare.',
    )

    await vi.advanceTimersByTimeAsync(89_999)
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1)
    await vi.advanceTimersByTimeAsync(1)
    await verifica
  })

  it('rispetta il limite di novanta secondi anche se la richiesta rimane sospesa', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise<Response>(() => undefined)))

    const verifica = expect(apiFetch('/api/agenti')).rejects.toThrow(
      'Il database non è diventato disponibile entro 90 secondi. Riprovare.',
    )

    await vi.advanceTimersByTimeAsync(90_000)
    await verifica
  })

  it('mantiene un messaggio comprensibile per gli errori di rete nelle scritture', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(apiFetch('/api/agenti', { method: 'POST' })).rejects.toThrow(
      'Impossibile contattare il server. Verificare che il backend sia avviato e riprovare.',
    )
  })
})
