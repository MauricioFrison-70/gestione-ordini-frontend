import { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, TextField, Typography } from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import { cercareProdottoPerId, eliminareProdotto } from '../../../services/prodottoService'
import type { Prodotto } from '../types/prodotto'

export default function EliminareProdotto() {
  const { mostraMessaggio } = useFeedback()
  const [id, setId] = useState('')
  const [prodotto, setProdotto] = useState<Prodotto | null>(null)
  const [confermaAperta, setConfermaAperta] = useState(false)

  const cercare = async () => {
    try {
      setProdotto(await cercareProdottoPerId(Number(id)))
    } catch {
      setProdotto(null)
      mostraMessaggio('Prodotto non trovato', 'error')
    }
  }

  const confermareEliminazione = async () => {
    if (!prodotto) return

    try {
      await eliminareProdotto(prodotto.id)
      mostraMessaggio('Prodotto eliminato con successo!', 'success')
      setId('')
      setProdotto(null)
    } catch {
      mostraMessaggio('Errore nell’eliminazione del prodotto', 'error')
    } finally {
      setConfermaAperta(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Paper elevation={4} sx={{ width: 420, p: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Elimina prodotto</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="ID del prodotto" type="number" value={id} onChange={(event) => setId(event.target.value)} fullWidth />
          <Button variant="outlined" onClick={cercare}>Cerca</Button>
        </Box>

        {prodotto && (
          <Box sx={{ mt: 3 }}>
            <Typography><strong>Codice:</strong> {prodotto.codice}</Typography>
            <Typography><strong>Descrizione:</strong> {prodotto.descrizione}</Typography>
            <Button color="error" variant="contained" sx={{ mt: 2 }} onClick={() => setConfermaAperta(true)}>Elimina</Button>
          </Box>
        )}
      </Paper>

      <Dialog open={confermaAperta} onClose={() => setConfermaAperta(false)}>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent><DialogContentText>Vuoi eliminare il prodotto {prodotto?.codice}?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfermaAperta(false)}>Annulla</Button>
          <Button color="error" variant="contained" onClick={confermareEliminazione}>Elimina</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
