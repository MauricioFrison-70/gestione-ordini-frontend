import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, Button, Checkbox, CircularProgress, FormControlLabel, IconButton, InputAdornment, Paper, TextField, Typography } from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import { aggiornareProdotto, cercareProdottoPerId } from '../../../services/prodottoService'
import {
  accettareInputDecimale,
  convertireDecimale,
  decimaleValido,
  formattareDecimale,
  interoValido,
  normalizzareInputIntero,
} from '../utils/numeri'

const messaggioFormatoNonValido = 'Inserisci importi con la virgola e al massimo due cifre decimali. La scorta minima deve essere un numero intero.'

export default function ModificareProdotto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mostraMessaggio } = useFeedback()
  const [codice, setCodice] = useState('')
  const [descrizione, setDescrizione] = useState('')
  const [valoreAcquisto, setValoreAcquisto] = useState('')
  const [valoreVendita, setValoreVendita] = useState('')
  const [quantita, setQuantita] = useState('')
  const [scortaMinima, setScortaMinima] = useState('')
  const [archiviato, setArchiviato] = useState(false)
  const [caricando, setCaricando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!id) return

    void cercareProdottoPerId(Number(id))
      .then((prodotto) => {
        setCodice(prodotto.codice)
        setDescrizione(prodotto.descrizione)
        setValoreAcquisto(formattareDecimale(prodotto.valoreAcquisto))
        setValoreVendita(formattareDecimale(prodotto.valoreVendita))
        setQuantita(String(prodotto.quantita))
        setScortaMinima(String(prodotto.scortaMinima))
        setArchiviato(prodotto.archiviato)
      })
      .catch(() => mostraMessaggio('Prodotto non trovato', 'error'))
      .finally(() => setCaricando(false))
  }, [id, mostraMessaggio])

  const salvare = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!id) return

    if (!decimaleValido(valoreAcquisto) || !decimaleValido(valoreVendita) || !interoValido(scortaMinima)) {
      mostraMessaggio(messaggioFormatoNonValido, 'error')
      return
    }

    setSalvando(true)
    try {
      await aggiornareProdotto(Number(id), {
        descrizione,
        valoreAcquisto: convertireDecimale(valoreAcquisto),
        valoreVendita: convertireDecimale(valoreVendita),
        scortaMinima: Number(scortaMinima),
        archiviato,
      })
      mostraMessaggio('Prodotto aggiornato con successo!', 'success')
      navigate('/prodotti')
    } catch {
      mostraMessaggio('Errore nell’aggiornamento del prodotto', 'error')
    } finally {
      setSalvando(false)
    }
  }

  if (caricando) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress aria-label="Caricamento prodotto" /></Box>
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Paper elevation={4} sx={{ width: 500, p: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton color="primary" aria-label="Torna all'elenco" onClick={() => navigate('/prodotti')} sx={{ mr: 2 }}><ArrowBackIosNewIcon /></IconButton>
          <Typography variant="h4">Modifica prodotto</Typography>
        </Box>
        <Box component="form" onSubmit={salvare} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Codice"
            value={codice}
            disabled
            fullWidth
            helperText="Il codice non può essere modificato."
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <LockOutlinedIcon color="primary" fontSize="small" titleAccess="Campo non modificabile" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': { bgcolor: 'rgba(25, 118, 210, 0.07)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.light' },
              '& .MuiInputLabel-root': { color: 'primary.main' },
            }}
          />
          <TextField
            label="Descrizione"
            value={descrizione}
            onChange={(event) => setDescrizione(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 30 } }}
            helperText="Massimo 30 caratteri."
            required
            fullWidth
          />
          <TextField
            label="Valore di acquisto"
            value={valoreAcquisto}
            onChange={(event) => accettareInputDecimale(event.target.value) && setValoreAcquisto(event.target.value)}
            slotProps={{ htmlInput: { inputMode: 'decimal', maxLength: 11 } }}
            helperText="Usa la virgola; massimo 2 decimali."
            required
            fullWidth
          />
          <TextField
            label="Valore di vendita"
            value={valoreVendita}
            onChange={(event) => accettareInputDecimale(event.target.value) && setValoreVendita(event.target.value)}
            slotProps={{ htmlInput: { inputMode: 'decimal', maxLength: 11 } }}
            helperText="Usa la virgola; massimo 2 decimali."
            required
            fullWidth
          />
          <TextField
            label="Quantità"
            value={quantita}
            slotProps={{
              htmlInput: { readOnly: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <LockOutlinedIcon color="primary" fontSize="small" titleAccess="Campo non modificabile" />
                  </InputAdornment>
                ),
              },
            }}
            helperText="La giacenza viene aggiornata automaticamente dagli ordini di acquisto e di vendita."
            sx={{
              '& .MuiOutlinedInput-root': { bgcolor: 'rgba(25, 118, 210, 0.07)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.light' },
              '& .MuiInputLabel-root': { color: 'primary.main' },
            }}
            required
            fullWidth
          />
          <TextField
            label="Scorta minima"
            value={scortaMinima}
            onChange={(event) => setScortaMinima(normalizzareInputIntero(event.target.value))}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            helperText="Sono ammessi solo numeri interi."
            required
            fullWidth
          />
          <FormControlLabel control={<Checkbox checked={archiviato} onChange={(event) => setArchiviato(event.target.checked)} />} label="Archiviato" />
          <Button type="submit" variant="contained" disabled={salvando}>{salvando ? 'Salvataggio...' : 'Salva modifiche'}</Button>
        </Box>
      </Paper>
    </Box>
  )
}
