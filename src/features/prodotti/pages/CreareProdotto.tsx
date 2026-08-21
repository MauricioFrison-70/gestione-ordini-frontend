import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import { Box, Button, IconButton, Paper, TextField, Typography } from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import { creareProdotto } from '../../../services/prodottoService'
import {
  accettareInputDecimale,
  accettareInputIntero,
  convertireDecimale,
  decimaleValido,
  interoValido,
} from '../utils/numeri'

const messaggioFormatoNonValido = 'Inserisci importi con la virgola e al massimo due cifre decimali. Quantità e scorta minima devono essere numeri interi.'

export default function CreareProdotto() {
  const navigate = useNavigate()
  const { mostraMessaggio } = useFeedback()
  const [codice, setCodice] = useState('')
  const [descrizione, setDescrizione] = useState('')
  const [valoreAcquisto, setValoreAcquisto] = useState('')
  const [valoreVendita, setValoreVendita] = useState('')
  const [quantita, setQuantita] = useState('')
  const [scortaMinima, setScortaMinima] = useState('')
  const [salvando, setSalvando] = useState(false)

  const salvare = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!decimaleValido(valoreAcquisto) || !decimaleValido(valoreVendita) || !interoValido(quantita) || !interoValido(scortaMinima)) {
      mostraMessaggio(messaggioFormatoNonValido, 'error')
      return
    }

    setSalvando(true)
    try {
      await creareProdotto({
        codice,
        descrizione,
        valoreAcquisto: convertireDecimale(valoreAcquisto),
        valoreVendita: convertireDecimale(valoreVendita),
        quantita: Number(quantita),
        scortaMinima: Number(scortaMinima),
        archiviato: false,
      })
      mostraMessaggio('Prodotto creato con successo!', 'success')
      navigate('/prodotti')
    } catch (errore) {
      const messaggio = errore instanceof Error ? errore.message : 'Errore nella creazione del prodotto'
      mostraMessaggio(messaggio, 'error')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Paper elevation={4} sx={{ width: 500, p: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton color="primary" aria-label="Torna all'elenco" onClick={() => navigate('/prodotti')} sx={{ mr: 2 }}><ArrowBackIosNewIcon /></IconButton>
          <Typography variant="h4">Crea nuovo prodotto</Typography>
        </Box>
        <Box component="form" onSubmit={salvare} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Codice"
            value={codice}
            onChange={(event) => setCodice(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 6 } }}
            helperText="Massimo 6 caratteri."
            required
            fullWidth
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
            onChange={(event) => accettareInputIntero(event.target.value) && setQuantita(event.target.value)}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            helperText="Sono ammessi solo numeri interi."
            required
            fullWidth
          />
          <TextField
            label="Scorta minima"
            value={scortaMinima}
            onChange={(event) => accettareInputIntero(event.target.value) && setScortaMinima(event.target.value)}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            helperText="Sono ammessi solo numeri interi."
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={salvando}>{salvando ? 'Salvataggio...' : 'Crea prodotto'}</Button>
        </Box>
      </Paper>
    </Box>
  )
}
