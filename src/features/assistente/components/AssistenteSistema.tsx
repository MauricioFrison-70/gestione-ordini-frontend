import { useEffect, useRef, useState } from 'react'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { chiedereAllAssistente } from '../../../services/assistenteService'
import type { MessaggioAssistente } from '../types/assistente'

const MESSAGGIO_INIZIALE: MessaggioAssistente = {
  id: 0,
  ruolo: 'ASSISTENTE',
  contenuto: 'Ciao! Posso aiutarti con l’utilizzo e le regole del sistema Gestione Ordini.',
}

export default function AssistenteSistema() {
  const [messaggi, setMessaggi] = useState<MessaggioAssistente[]>([MESSAGGIO_INIZIALE])
  const [domanda, setDomanda] = useState('')
  const [inviando, setInviando] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const fineConversazioneRef = useRef<HTMLDivElement | null>(null)
  const prossimoIdRef = useRef(1)

  useEffect(() => {
    const fineConversazione = fineConversazioneRef.current
    if (typeof fineConversazione?.scrollIntoView === 'function') {
      fineConversazione.scrollIntoView({ block: 'nearest' })
    }
  }, [messaggi, inviando])

  const inviare = async () => {
    const testo = domanda.trim()
    if (!testo || inviando) return

    const messaggioUtente: MessaggioAssistente = {
      id: prossimoIdRef.current++,
      ruolo: 'UTENTE',
      contenuto: testo,
    }
    const cronologia = messaggi
      .filter((messaggio) => messaggio.id !== MESSAGGIO_INIZIALE.id)
      .slice(-8)
      .map(({ ruolo, contenuto }) => ({ ruolo, contenuto }))

    setMessaggi((correnti) => [...correnti, messaggioUtente])
    setDomanda('')
    setErrore(null)
    setInviando(true)
    try {
      const risposta = await chiedereAllAssistente({ domanda: testo, cronologia })
      setMessaggi((correnti) => [...correnti, {
        id: prossimoIdRef.current++,
        ruolo: 'ASSISTENTE',
        contenuto: risposta.risposta,
      }])
    } catch (causa) {
      setErrore(causa instanceof Error ? causa.message : 'Errore imprevisto dell’assistente IA')
    } finally {
      setInviando(false)
    }
  }

  return (
    <Paper
      variant="outlined"
      data-testid="assistente-sistema"
      sx={{
        gridColumn: { lg: '1 / -1' },
        minHeight: { xs: 320, lg: 230 },
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderColor: 'primary.main',
        borderWidth: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
        <SmartToyOutlinedIcon color="primary" fontSize="small" />
        <Box>
          <Typography component="h2" variant="h6" sx={{ fontSize: '1rem', lineHeight: 1.15 }}>
            Assistente Gestione Ordini
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Risponde esclusivamente a domande sul sistema.
          </Typography>
        </Box>
      </Box>

      <Box
        aria-live="polite"
        aria-label="Conversazione con l’assistente"
        sx={{
          flex: 1,
          minHeight: 56,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          pr: 0.5,
          mb: 0.75,
        }}
      >
        {messaggi.map((messaggio) => (
          <Box
            key={messaggio.id}
            sx={{
              alignSelf: messaggio.ruolo === 'UTENTE' ? 'flex-end' : 'flex-start',
              maxWidth: { xs: '92%', md: '78%' },
              px: 1.1,
              py: 0.5,
              borderRadius: 2,
              bgcolor: messaggio.ruolo === 'UTENTE' ? 'primary.main' : 'action.hover',
              color: messaggio.ruolo === 'UTENTE' ? 'primary.contrastText' : 'text.primary',
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {messaggio.contenuto}
            </Typography>
          </Box>
        ))}
        {inviando && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <CircularProgress size={16} />
            <Typography variant="caption">Sto preparando la risposta…</Typography>
          </Box>
        )}
        <div ref={fineConversazioneRef} />
      </Box>

      {errore && <Alert severity="error" sx={{ mb: 1, py: 0 }}>{errore}</Alert>}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          size="small"
          label="Scrivi una domanda sul sistema"
          value={domanda}
          disabled={inviando}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          onChange={(evento) => setDomanda(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter' && !evento.shiftKey) {
              evento.preventDefault()
              void inviare()
            }
          }}
        />
        <Tooltip title="Invia domanda">
          <span>
            <IconButton
              color="primary"
              aria-label="Invia domanda"
              disabled={inviando || domanda.trim().length === 0}
              onClick={() => { void inviare() }}
              sx={{ mb: 0.25 }}
            >
              <SendRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Paper>
  )
}
