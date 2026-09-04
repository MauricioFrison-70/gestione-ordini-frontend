import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import { elencareRapporti } from '../../../services/rapportoService'
import AssistenteSistema from '../../assistente/components/AssistenteSistema'
import type { Rapporto } from '../../rapporti/types/rapporto'
import PannelloDashboard from '../components/PannelloDashboard'
import type { ConfigurazionePannello, PreferenzeDashboard } from '../types/dashboard'
import {
  leggerePreferenzeDashboard,
  salvarePreferenzeDashboard,
} from '../utils/preferenzeDashboard'

export default function Dashboard() {
  const [rapporti, setRapporti] = useState<Rapporto[]>([])
  const [preferenze, setPreferenze] = useState<PreferenzeDashboard>(leggerePreferenzeDashboard)
  const [caricando, setCaricando] = useState(true)
  const [errore, setErrore] = useState<string | null>(null)

  useEffect(() => {
    let attivo = true
    void elencareRapporti()
      .then((elenco) => {
        if (!attivo) return
        setRapporti(elenco)
        setPreferenze((correnti) => ({
          ...correnti,
          pannelli: correnti.pannelli.map((pannello, indice) => ({
            ...pannello,
            rapportoCodice: elenco.some((rapporto) => rapporto.codice === pannello.rapportoCodice)
              ? pannello.rapportoCodice
              : elenco[indice % Math.max(elenco.length, 1)]?.codice ?? '',
          })) as [ConfigurazionePannello, ConfigurazionePannello],
        }))
      })
      .catch((causa) => {
        if (attivo) {
          setErrore(causa instanceof Error ? causa.message : 'Errore nel caricamento dei rapporti')
        }
      })
      .finally(() => { if (attivo) setCaricando(false) })
    return () => { attivo = false }
  }, [])

  useEffect(() => {
    salvarePreferenzeDashboard(preferenze)
  }, [preferenze])

  const modificarePannello = useCallback((indice: number, configurazione: ConfigurazionePannello) => {
    setPreferenze((correnti) => {
      const pannelli = [...correnti.pannelli] as [ConfigurazionePannello, ConfigurazionePannello]
      pannelli[indice] = configurazione
      return { ...correnti, pannelli }
    })
  }, [])

  if (caricando) {
    return <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
  }

  if (errore) return <Alert severity="error">{errore}</Alert>
  if (rapporti.length === 0) return <Alert severity="info">Nessun rapporto disponibile per la dashboard.</Alert>

  return (
    <Box
      aria-label="Dashboard principale"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
        gridTemplateRows: { lg: 'minmax(360px, 13fr) minmax(230px, 7fr)' },
        gridAutoRows: 'minmax(420px, 1fr)',
        gap: 2,
        height: { lg: 'calc(100vh - 112px)' },
        minHeight: { lg: 680 },
        alignItems: 'stretch',
      }}
    >
      <PannelloDashboard
        indice={1}
        rapporti={rapporti}
        configurazione={preferenze.pannelli[0]}
        onChange={(configurazione) => modificarePannello(0, configurazione)}
      />
      <PannelloDashboard
        indice={2}
        rapporti={rapporti}
        configurazione={preferenze.pannelli[1]}
        onChange={(configurazione) => modificarePannello(1, configurazione)}
      />
      <AssistenteSistema />
    </Box>
  )
}
