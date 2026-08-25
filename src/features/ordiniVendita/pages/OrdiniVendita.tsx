import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
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
import { elencareOrdiniVendita, eliminareOrdineVendita } from '../../../services/ordineVenditaService'
import type { OrdineVendita } from '../types/ordineVendita'

const formatoData = new Intl.DateTimeFormat('it-IT')
type FiltroStatoOrdine = 'TUTTI' | 'NON_RILASCIATI' | 'RILASCIATI' | 'ANNULLATI'

function mostraData(data: string | null): string {
  if (!data) return '—'
  const [anno, mese, giorno] = data.substring(0, 10).split('-').map(Number)
  return formatoData.format(new Date(anno, mese - 1, giorno))
}

export default function OrdiniVendita() {
  const [ordini, setOrdini] = useState<OrdineVendita[]>([])
  const [ricerca, setRicerca] = useState('')
  const [filtroStato, setFiltroStato] = useState<FiltroStatoOrdine>('TUTTI')
  const [caricando, setCaricando] = useState(true)
  const [ordineDaEliminare, setOrdineDaEliminare] = useState<OrdineVendita | null>(null)
  const navigate = useNavigate()
  const { mostraMessaggio } = useFeedback()

  useEffect(() => {
    let attivo = true
    void elencareOrdiniVendita()
      .then((risultato) => { if (attivo) setOrdini(risultato) })
      .catch(() => mostraMessaggio('Errore nel caricamento degli ordini di vendita', 'error'))
      .finally(() => { if (attivo) setCaricando(false) })
    return () => { attivo = false }
  }, [mostraMessaggio])

  const richiedereEliminazione = (ordine: OrdineVendita) => {
    if (ordine.dataRilascio) {
      mostraMessaggio(
        `L'ordine di vendita ${ordine.numeroOrdine} non può essere eliminato perché è già stato rilasciato il ${mostraData(ordine.dataRilascio)}.`,
        'warning',
      )
      return
    }
    if (ordine.dataAnnullamento) {
      mostraMessaggio(
        `L'ordine di vendita ${ordine.numeroOrdine} non può essere eliminato perché è già stato annullato il ${mostraData(ordine.dataAnnullamento)}.`,
        'warning',
      )
      return
    }
    setOrdineDaEliminare(ordine)
  }

  const confermareEliminazione = async () => {
    if (!ordineDaEliminare) return
    try {
      await eliminareOrdineVendita(ordineDaEliminare.id)
      setOrdini((correnti) => correnti.filter((ordine) => ordine.id !== ordineDaEliminare.id))
      mostraMessaggio('Ordine di vendita eliminato con successo!', 'success')
    } catch (errore) {
      mostraMessaggio(
        errore instanceof Error ? errore.message : "Errore nell'eliminazione dell'ordine di vendita",
        'error',
      )
    } finally {
      setOrdineDaEliminare(null)
    }
  }

  const ordiniVisibili = useMemo(() => {
    const testo = ricerca.trim().toLowerCase()
    return ordini
      .filter((ordine) => {
        const corrispondeRicerca = ordine.numeroOrdine.toLowerCase().includes(testo)
          || ordine.cliente.nome.toLowerCase().includes(testo)
        const corrispondeStato = filtroStato === 'TUTTI'
          || (filtroStato === 'NON_RILASCIATI' && !ordine.dataRilascio && !ordine.dataAnnullamento)
          || (filtroStato === 'RILASCIATI' && Boolean(ordine.dataRilascio) && !ordine.dataAnnullamento)
          || (filtroStato === 'ANNULLATI' && Boolean(ordine.dataAnnullamento))
        return corrispondeRicerca && corrispondeStato
      })
      .sort((primo, secondo) =>
        Date.parse(secondo.dataRegistrazione) - Date.parse(primo.dataRegistrazione))
  }, [filtroStato, ordini, ricerca])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Ordini di vendita</Typography>
        <IconButton color="success" onClick={() => navigate('/ordini-vendita/creare')} aria-label="Crea ordine di vendita">
          <AddCircleIcon sx={{ fontSize: 40 }} />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          label="Cerca per numero o cliente"
          value={ricerca}
          onChange={(event) => setRicerca(event.target.value)}
          sx={{ width: 340 }}
        />
        <ToggleButtonGroup
          value={filtroStato}
          exclusive
          onChange={(_, nuovoFiltro: FiltroStatoOrdine | null) => {
            if (nuovoFiltro) setFiltroStato(nuovoFiltro)
          }}
          aria-label="Filtro stato ordine"
          size="small"
        >
          <ToggleButton value="TUTTI">Tutti</ToggleButton>
          <ToggleButton value="NON_RILASCIATI">Non rilasciati</ToggleButton>
          <ToggleButton value="RILASCIATI">Rilasciati</ToggleButton>
          <ToggleButton value="ANNULLATI">Annullati</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TableContainer component={Paper} elevation={4}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Numero ordine</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Venditore</TableCell>
            <TableCell>Trasportatore</TableCell>
            <TableCell>Data registrazione</TableCell>
            <TableCell>Data rilascio</TableCell>
            <TableCell>Data annullamento</TableCell>
            <TableCell>Azioni</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {caricando && <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={28} /></TableCell></TableRow>}
            {!caricando && ordiniVisibili.map((ordine) => (
              <TableRow key={ordine.id}>
                <TableCell>{ordine.numeroOrdine}</TableCell>
                <TableCell>{ordine.cliente.nome}</TableCell>
                <TableCell>{ordine.venditore.nome}</TableCell>
                <TableCell>{ordine.trasportatore.nome}</TableCell>
                <TableCell>{mostraData(ordine.dataRegistrazione)}</TableCell>
                <TableCell>{mostraData(ordine.dataRilascio)}</TableCell>
                <TableCell>{mostraData(ordine.dataAnnullamento)}</TableCell>
                <TableCell>
                  <IconButton
                    color="secondary"
                    title="Righe ordine"
                    aria-label={`Righe ${ordine.numeroOrdine}`}
                    onClick={() => navigate(`/ordini-vendita/${ordine.id}/righe`)}
                  ><FormatListBulletedIcon /></IconButton>
                  <IconButton color="info" title="Dettagli" onClick={() => navigate(`/ordini-vendita/dettagli/${ordine.id}`)}><InfoOutlinedIcon /></IconButton>
                  <IconButton color="primary" title="Modifica" onClick={() => navigate(`/ordini-vendita/modificare/${ordine.id}`)}><EditIcon /></IconButton>
                  <IconButton
                    color="error"
                    title="Elimina"
                    aria-label={`Elimina ${ordine.numeroOrdine}`}
                    onClick={() => richiedereEliminazione(ordine)}
                  ><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!caricando && ordiniVisibili.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center">Nessun ordine di vendita trovato.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={ordineDaEliminare !== null} onClose={() => setOrdineDaEliminare(null)}>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent><DialogContentText>
          Vuoi eliminare l&apos;ordine di vendita {ordineDaEliminare?.numeroOrdine}?
        </DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setOrdineDaEliminare(null)}>Annulla</Button>
          <Button color="error" variant="contained" onClick={confermareEliminazione}>Elimina</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
