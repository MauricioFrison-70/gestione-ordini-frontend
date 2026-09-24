import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import DatabaseWakeupAlert from './DatabaseWakeupAlert'
import { EVENTO_DATABASE_IN_RIATTIVAZIONE } from '../services/apiFetch'

describe('DatabaseWakeupAlert', () => {
  it('mostra e nasconde lo stato di riattivazione', () => {
    render(<DatabaseWakeupAlert />)

    fireEvent(window, new CustomEvent(EVENTO_DATABASE_IN_RIATTIVAZIONE, {
      detail: { attivo: true },
    }))
    expect(screen.getByText(/Il database Azure si sta riattivando/)).toBeInTheDocument()
    expect(screen.getByText(/fino a 90 secondi/)).toBeInTheDocument()

    fireEvent(window, new CustomEvent(EVENTO_DATABASE_IN_RIATTIVAZIONE, {
      detail: { attivo: false },
    }))
    expect(screen.queryByText(/Il database Azure si sta riattivando/)).not.toBeInTheDocument()
  })
})
