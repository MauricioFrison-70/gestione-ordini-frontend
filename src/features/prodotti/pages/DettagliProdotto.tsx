import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, CircularProgress, Divider, Paper, Typography } from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import { cercareProdottoPerId } from '../../../services/prodottoService'
import type { Prodotto } from '../types/prodotto'

const formatoValuta = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

export default function DettagliProdotto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mostraMessaggio } = useFeedback()
  const [prodotto, setProdotto] = useState<Prodotto | null>(null)
  const [caricando, setCaricando] = useState(true)

  useEffect(() => {
    if (!id) return

    void cercareProdottoPerId(Number(id))
      .then(setProdotto)
      .catch(() => mostraMessaggio('Errore nel caricamento dei dettagli del prodotto', 'error'))
      .finally(() => setCaricando(false))
  }, [id, mostraMessaggio])

  if (caricando) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress aria-label="Caricamento prodotto" /></Box>
  }

  if (!prodotto) {
    return <Typography sx={{ mt: 4, textAlign: 'center' }}>Prodotto non disponibile.</Typography>
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
      <Paper elevation={4} sx={{ width: 500, p: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Dettagli del prodotto</Typography>
        <Divider sx={{ mb: 3 }} />
        <Typography sx={{ mb: 1 }}><strong>Codice:</strong> {prodotto.codice}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Descrizione:</strong> {prodotto.descrizione}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Valore di acquisto:</strong> {formatoValuta.format(prodotto.valoreAcquisto)}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Valore di vendita:</strong> {formatoValuta.format(prodotto.valoreVendita)}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Quantità:</strong> {prodotto.quantita}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Scorta minima:</strong> {prodotto.scortaMinima}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Archiviato:</strong> {prodotto.archiviato ? 'Sì' : 'No'}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Registrato il:</strong> {new Date(prodotto.dataRegistrazione).toLocaleString('it-IT')}</Typography>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" onClick={() => navigate('/prodotti')}>Indietro</Button>
          <Button variant="contained" onClick={() => navigate(`/prodotti/modificare/${prodotto.id}`)}>Modifica</Button>
        </Box>
      </Paper>
    </Box>
  )
}
