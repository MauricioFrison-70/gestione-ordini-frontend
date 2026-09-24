import { useEffect, useState } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import { EVENTO_DATABASE_IN_RIATTIVAZIONE } from '../services/apiFetch'

interface DettaglioRiattivazione {
  attivo: boolean
}

export default function DatabaseWakeupAlert() {
  const [attivo, setAttivo] = useState(false)

  useEffect(() => {
    const gestireEvento = (evento: Event) => {
      const dettaglio = (evento as CustomEvent<DettaglioRiattivazione>).detail
      setAttivo(Boolean(dettaglio?.attivo))
    }

    window.addEventListener(EVENTO_DATABASE_IN_RIATTIVAZIONE, gestireEvento)
    return () => window.removeEventListener(EVENTO_DATABASE_IN_RIATTIVAZIONE, gestireEvento)
  }, [])

  if (!attivo) return null

  return (
    <Alert
      severity="info"
      icon={<CircularProgress color="inherit" size={20} />}
      sx={{ mb: 2 }}
    >
      Il database Azure si sta riattivando. Attendere: il caricamento riprenderà
      automaticamente e può richiedere fino a 90 secondi.
    </Alert>
  )
}
