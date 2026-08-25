import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import {
  elencareOrdiniAcquisto,
  eliminareOrdineAcquisto,
} from '../../../services/ordineAcquistoService'
import type { OrdineAcquisto } from '../types/ordineAcquisto'

type Filtro = 'TUTTI' | 'PENDENTI' | 'RICEVUTI' | 'ANNULLATI'
const formatoData = new Intl.DateTimeFormat('it-IT')

function data(dataIso: string | null): string {
  if (!dataIso) return '—'
  const [anno, mese, giorno] = dataIso.substring(0, 10).split('-').map(Number)
  return formatoData.format(new Date(anno, mese - 1, giorno))
}

function stato(ordine: OrdineAcquisto): string {
  if (ordine.dataRicevimento) return 'Ricevuto'
  if (ordine.dataAnnullamento) return 'Annullato'
  return 'Pendente'
}

export default function OrdiniAcquisto() {
  const navigate = useNavigate()
  const { mostraMessaggio } = useFeedback()
  const [ordini, setOrdini] = useState<OrdineAcquisto[]>([])
  const [ricerca, setRicerca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('TUTTI')
  const [caricando, setCaricando] = useState(true)
  const [daEliminare, setDaEliminare] = useState<OrdineAcquisto | null>(null)

  useEffect(() => {
    void elencareOrdiniAcquisto()
      .then(setOrdini)
      .catch((errore) => mostraMessaggio(
        errore instanceof Error ? errore.message : 'Errore nel caricamento degli ordini',
        'error',
      ))
      .finally(() => setCaricando(false))
  }, [mostraMessaggio])

  const visibili = useMemo(() => {
    const testo = ricerca.trim().toLowerCase()
    return ordini
      .filter((ordine) => {
        const corrispondeTesto = ordine.numeroOrdine.toLowerCase().includes(testo)
          || ordine.fornitore.nome.toLowerCase().includes(testo)
        const corrispondeFiltro = filtro === 'TUTTI'
          || (filtro === 'PENDENTI' && !ordine.dataRicevimento && !ordine.dataAnnullamento)
          || (filtro === 'RICEVUTI' && Boolean(ordine.dataRicevimento))
          || (filtro === 'ANNULLATI' && Boolean(ordine.dataAnnullamento))
        return corrispondeTesto && corrispondeFiltro
      })
      .sort((a, b) => Date.parse(b.dataRegistrazione) - Date.parse(a.dataRegistrazione))
  }, [filtro, ordini, ricerca])

  const eliminare = async () => {
    if (!daEliminare) return
    try {
      await eliminareOrdineAcquisto(daEliminare.id)
      setOrdini((correnti) => correnti.filter((ordine) => ordine.id !== daEliminare.id))
      mostraMessaggio('Ordine di acquisto eliminato con successo!', 'success')
    } catch (errore) {
      mostraMessaggio(
        errore instanceof Error ? errore.message : "Errore nell'eliminazione dell'ordine",
        'error',
      )
    } finally {
      setDaEliminare(null)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Ordini di acquisto</Typography>
        <IconButton
          color="success"
          aria-label="Crea ordine di acquisto"
          onClick={() => navigate('/ordini-acquisto/creare')}
        ><AddCircleIcon sx={{ fontSize: 40 }} /></IconButton>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          label="Cerca per numero o fornitore"
          value={ricerca}
          onChange={(event) => setRicerca(event.target.value)}
          sx={{ width: 340 }}
        />
        <ToggleButtonGroup
          value={filtro}
          exclusive
          size="small"
          aria-label="Filtro stato ordine di acquisto"
          onChange={(_, nuovo: Filtro | null) => { if (nuovo) setFiltro(nuovo) }}
        >
          <ToggleButton value="TUTTI">Tutti</ToggleButton>
          <ToggleButton value="PENDENTI">Pendenti</ToggleButton>
          <ToggleButton value="RICEVUTI">Ricevuti</ToggleButton>
          <ToggleButton value="ANNULLATI">Annullati</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TableContainer component={Paper} elevation={4}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Numero ordine</TableCell>
            <TableCell>Fornitore</TableCell>
            <TableCell>Data registrazione</TableCell>
            <TableCell>Data ricevimento</TableCell>
            <TableCell>Data annullamento</TableCell>
            <TableCell>Stato</TableCell>
            <TableCell>Azioni</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {caricando && (
              <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={28} /></TableCell></TableRow>
            )}
            {!caricando && visibili.map((ordine) => (
              <TableRow key={ordine.id}>
                <TableCell>{ordine.numeroOrdine}</TableCell>
                <TableCell>{ordine.fornitore.nome}</TableCell>
                <TableCell>{data(ordine.dataRegistrazione)}</TableCell>
                <TableCell>{data(ordine.dataRicevimento)}</TableCell>
                <TableCell>{data(ordine.dataAnnullamento)}</TableCell>
                <TableCell>{stato(ordine)}</TableCell>
                <TableCell>
                  <IconButton
                    color="secondary"
                    title="Righe ordine"
                    aria-label={`Righe ${ordine.numeroOrdine}`}
                    onClick={() => navigate(`/ordini-acquisto/${ordine.id}/righe`)}
                  ><FormatListBulletedIcon /></IconButton>
                  <IconButton
                    color="error"
                    title="Elimina"
                    aria-label={`Elimina ${ordine.numeroOrdine}`}
                    disabled={Boolean(ordine.dataRicevimento || ordine.dataAnnullamento)}
                    onClick={() => setDaEliminare(ordine)}
                  ><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!caricando && visibili.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">Nessun ordine di acquisto trovato.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={daEliminare !== null} onClose={() => setDaEliminare(null)}>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent><DialogContentText>
          Vuoi eliminare l&apos;ordine di acquisto {daEliminare?.numeroOrdine}?
        </DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDaEliminare(null)}>Annulla</Button>
          <Button color="error" variant="contained" onClick={eliminare}>Elimina</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
