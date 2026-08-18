import { createContext } from 'react'
import type { AlertColor } from '@mui/material'

export type SeveritaMessaggio = AlertColor

export interface FeedbackContextValue {
  mostraMessaggio: (messaggio: string, severita?: SeveritaMessaggio) => void
}

export const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined)
