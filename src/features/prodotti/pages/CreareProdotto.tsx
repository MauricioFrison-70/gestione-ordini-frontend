import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import { Box, Button, IconButton, Paper, TextField, Typography } from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import { creareProdotto } from '../../../services/prodottoService'

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
    setSalvando(true)

    try {
      await creareProdotto({
        codice,
        descrizione,
        valoreAcquisto: Number(valoreAcquisto),
        valoreVendita: Number(valoreVendita),
        quantita: Number(quantita),
        scortaMinima: Number(scortaMinima),
        archiviato: false,
      })
      mostraMessaggio('Prodotto creato con successo!', 'success')
      navigate('/prodotti')
    } catch {
      mostraMessaggio('Errore nella creazione del prodotto', 'error')
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
          <TextField label="Codice" value={codice} onChange={(event) => setCodice(event.target.value)} required fullWidth />
          <TextField label="Descrizione" value={descrizione} onChange={(event) => setDescrizione(event.target.value)} required fullWidth />
          <TextField label="Valore di acquisto" type="number" slotProps={{ htmlInput: { min: 0, step: '0.01' } }} value={valoreAcquisto} onChange={(event) => setValoreAcquisto(event.target.value)} required fullWidth />
          <TextField label="Valore di vendita" type="number" slotProps={{ htmlInput: { min: 0, step: '0.01' } }} value={valoreVendita} onChange={(event) => setValoreVendita(event.target.value)} required fullWidth />
          <TextField label="Quantità" type="number" slotProps={{ htmlInput: { min: 0, step: 1 } }} value={quantita} onChange={(event) => setQuantita(event.target.value)} required fullWidth />
          <TextField label="Scorta minima" type="number" slotProps={{ htmlInput: { min: 0, step: 1 } }} value={scortaMinima} onChange={(event) => setScortaMinima(event.target.value)} required fullWidth />
          <Button type="submit" variant="contained" disabled={salvando}>{salvando ? 'Salvataggio...' : 'Crea prodotto'}</Button>
        </Box>
      </Paper>
    </Box>
  )
}
