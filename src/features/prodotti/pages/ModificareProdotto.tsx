import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import { Box, Button, Checkbox, CircularProgress, FormControlLabel, IconButton, Paper, TextField, Typography } from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import { aggiornareProdotto, cercareProdottoPerId } from '../../../services/prodottoService'

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
        setValoreAcquisto(String(prodotto.valoreAcquisto))
        setValoreVendita(String(prodotto.valoreVendita))
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

    setSalvando(true)
    try {
      await aggiornareProdotto(Number(id), {
        descrizione,
        valoreAcquisto: Number(valoreAcquisto),
        valoreVendita: Number(valoreVendita),
        quantita: Number(quantita),
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
          <TextField label="Codice" value={codice} disabled fullWidth helperText="Il codice non può essere modificato." />
          <TextField label="Descrizione" value={descrizione} onChange={(event) => setDescrizione(event.target.value)} required fullWidth />
          <TextField label="Valore di acquisto" type="number" slotProps={{ htmlInput: { min: 0, step: '0.01' } }} value={valoreAcquisto} onChange={(event) => setValoreAcquisto(event.target.value)} required fullWidth />
          <TextField label="Valore di vendita" type="number" slotProps={{ htmlInput: { min: 0, step: '0.01' } }} value={valoreVendita} onChange={(event) => setValoreVendita(event.target.value)} required fullWidth />
          <TextField label="Quantità" type="number" slotProps={{ htmlInput: { min: 0, step: 1 } }} value={quantita} onChange={(event) => setQuantita(event.target.value)} required fullWidth />
          <TextField label="Scorta minima" type="number" slotProps={{ htmlInput: { min: 0, step: 1 } }} value={scortaMinima} onChange={(event) => setScortaMinima(event.target.value)} required fullWidth />
          <FormControlLabel control={<Checkbox checked={archiviato} onChange={(event) => setArchiviato(event.target.checked)} />} label="Archiviato" />
          <Button type="submit" variant="contained" disabled={salvando}>{salvando ? 'Salvataggio...' : 'Salva modifiche'}</Button>
        </Box>
      </Paper>
    </Box>
  )
}
