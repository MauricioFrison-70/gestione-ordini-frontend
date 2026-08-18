import { useCallback, useMemo, useState } from 'react'
import { Alert, Snackbar } from '@mui/material'
import type { ReactNode } from 'react'
import { FeedbackContext } from './feedbackContext'
import type { SeveritaMessaggio } from './feedbackContext'

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<{ messaggio: string; severita: SeveritaMessaggio } | null>(null)

  const mostraMessaggio = useCallback((messaggio: string, severita: SeveritaMessaggio = 'info') => {
    setFeedback({ messaggio, severita })
  }, [])

  const value = useMemo(() => ({ mostraMessaggio }), [mostraMessaggio])

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Snackbar
        open={feedback !== null}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') {
            setFeedback(null)
          }
        }}
      >
        <Alert severity={feedback?.severita} variant="filled" onClose={() => setFeedback(null)}>
          {feedback?.messaggio}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  )
}
