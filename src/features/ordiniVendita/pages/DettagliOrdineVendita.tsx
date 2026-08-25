import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, CircularProgress, Divider, Paper, Typography } from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import { cercareOrdineVenditaPerId } from '../../../services/ordineVenditaService'
import type { OrdineVendita } from '../types/ordineVendita'

function formattareData(data: string | null, conOra = false) {
  if (!data) return '—'
  return conOra
    ? new Date(data).toLocaleString('it-IT')
    : new Date(`${data.substring(0, 10)}T00:00:00`).toLocaleDateString('it-IT')
}

export default function DettagliOrdineVendita() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mostraMessaggio } = useFeedback()
  const [ordine, setOrdine] = useState<OrdineVendita | null>(null)
  const [caricando, setCaricando] = useState(true)

  useEffect(() => {
    if (!id) return
    void cercareOrdineVenditaPerId(Number(id))
      .then(setOrdine)
      .catch(() => mostraMessaggio("Errore nel caricamento dei dettagli dell'ordine", 'error'))
      .finally(() => setCaricando(false))
  }, [id, mostraMessaggio])

  if (caricando) return <Box sx={{ textAlign: 'center', mt: 5 }}><CircularProgress aria-label="Caricamento ordine" /></Box>
  if (!ordine) return <Typography sx={{ textAlign: 'center', mt: 5 }}>Ordine di vendita non disponibile.</Typography>

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
      <Paper elevation={4} sx={{ width: 620, p: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Dettagli ordine di vendita</Typography>
        <Divider sx={{ mb: 3 }} />
        <Typography sx={{ mb: 1 }}><strong>Numero ordine:</strong> {ordine.numeroOrdine}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Cliente:</strong> {ordine.cliente.nome}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Venditore:</strong> {ordine.venditore.nome}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Trasportatore:</strong> {ordine.trasportatore.nome}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Data registrazione:</strong> {formattareData(ordine.dataRegistrazione, true)}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Data rilascio:</strong> {formattareData(ordine.dataRilascio)}</Typography>
        <Typography sx={{ mb: 1 }}><strong>Data annullamento:</strong> {formattareData(ordine.dataAnnullamento)}</Typography>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/ordini-vendita')}>Indietro</Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate(`/ordini-vendita/${ordine.id}/righe`)}>Righe ordine</Button>
            <Button variant="contained" onClick={() => navigate(`/ordini-vendita/modificare/${ordine.id}`)}>Modifica</Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}
