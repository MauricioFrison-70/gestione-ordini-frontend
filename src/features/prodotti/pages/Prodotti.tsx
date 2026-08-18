import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
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
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import { eliminareProdotto, elencareProdotti } from '../../../services/prodottoService'
import type { Prodotto } from '../types/prodotto'

type ColonnaOrdinamento = keyof Pick<Prodotto, 'codice' | 'descrizione' | 'valoreVendita' | 'quantita' | 'archiviato'>

const formatoValuta = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

export default function Prodotti() {
  const [prodotti, setProdotti] = useState<Prodotto[]>([])
  const [ricerca, setRicerca] = useState('')
  const [colonna, setColonna] = useState<ColonnaOrdinamento>('codice')
  const [ordine, setOrdine] = useState<'asc' | 'desc'>('asc')
  const [caricando, setCaricando] = useState(true)
  const [prodottoDaEliminare, setProdottoDaEliminare] = useState<Prodotto | null>(null)
  const navigate = useNavigate()
  const { mostraMessaggio } = useFeedback()

  const ricaricareProdotti = async () => {
    setCaricando(true)
    try {
      setProdotti(await elencareProdotti())
    } catch {
      mostraMessaggio('Errore nel caricamento dei prodotti', 'error')
    } finally {
      setCaricando(false)
    }
  }

  useEffect(() => {
    let componenteAtivo = true

    void elencareProdotti()
      .then((prodottiCaricati) => {
        if (componenteAtivo) setProdotti(prodottiCaricati)
      })
      .catch(() => mostraMessaggio('Errore nel caricamento dei prodotti', 'error'))
      .finally(() => {
        if (componenteAtivo) setCaricando(false)
      })

    return () => {
      componenteAtivo = false
    }
  }, [mostraMessaggio])

  const confermareEliminazione = async () => {
    if (!prodottoDaEliminare) return

    try {
      await eliminareProdotto(prodottoDaEliminare.id)
      await ricaricareProdotti()
      mostraMessaggio('Prodotto eliminato con successo!', 'success')
    } catch {
      mostraMessaggio('Errore nell’eliminazione del prodotto', 'error')
    } finally {
      setProdottoDaEliminare(null)
    }
  }

  const prodottiVisibili = useMemo(() => {
    const testo = ricerca.toLowerCase()
    const filtrati = prodotti.filter((prodotto) =>
      prodotto.codice.toLowerCase().includes(testo) || prodotto.descrizione.toLowerCase().includes(testo),
    )

    return [...filtrati].sort((a, b) => {
      const valoreA = a[colonna].toString().toLowerCase()
      const valoreB = b[colonna].toString().toLowerCase()
      return ordine === 'asc' ? (valoreA > valoreB ? 1 : -1) : (valoreA < valoreB ? 1 : -1)
    })
  }, [colonna, ordine, prodotti, ricerca])

  const ordinare = (nuovaColonna: ColonnaOrdinamento) => {
    setOrdine(colonna === nuovaColonna && ordine === 'asc' ? 'desc' : 'asc')
    setColonna(nuovaColonna)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Elenco Prodotti</Typography>
        <IconButton color="success" onClick={() => navigate('/prodotti/creare')} aria-label="Crea prodotto">
          <AddCircleIcon sx={{ fontSize: 40 }} />
        </IconButton>
      </Box>

      <TextField
        label="Cerca per codice o descrizione"
        value={ricerca}
        onChange={(event) => setRicerca(event.target.value)}
        sx={{ width: 320, mb: 3 }}
      />

      <TableContainer component={Paper} elevation={4}>
        <Table>
          <TableHead>
            <TableRow>
              {([
                ['codice', 'Codice'],
                ['descrizione', 'Descrizione'],
                ['valoreVendita', 'Prezzo di vendita'],
                ['quantita', 'Quantità'],
                ['archiviato', 'Attivo'],
              ] as const).map(([chiave, etichetta]) => (
                <TableCell key={chiave}>
                  <TableSortLabel active={colonna === chiave} direction={colonna === chiave ? ordine : 'asc'} onClick={() => ordinare(chiave)}>
                    {etichetta}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {caricando && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress size={28} /></TableCell></TableRow>}
            {!caricando && prodottiVisibili.map((prodotto) => (
              <TableRow key={prodotto.id}>
                <TableCell>{prodotto.codice}</TableCell>
                <TableCell>{prodotto.descrizione}</TableCell>
                <TableCell>{formatoValuta.format(prodotto.valoreVendita)}</TableCell>
                <TableCell>{prodotto.quantita}</TableCell>
                <TableCell>{prodotto.archiviato ? <CancelIcon color="error" /> : <CheckCircleIcon color="success" />}</TableCell>
                <TableCell>
                  <IconButton color="info" title="Dettagli" onClick={() => navigate(`/prodotti/dettagli/${prodotto.id}`)}><InfoOutlinedIcon /></IconButton>
                  <IconButton color="primary" title="Modifica" onClick={() => navigate(`/prodotti/modificare/${prodotto.id}`)}><EditIcon /></IconButton>
                  <IconButton color="error" title="Elimina" onClick={() => setProdottoDaEliminare(prodotto)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!caricando && prodottiVisibili.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Nessun prodotto trovato.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={prodottoDaEliminare !== null} onClose={() => setProdottoDaEliminare(null)}>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent><DialogContentText>Vuoi eliminare il prodotto {prodottoDaEliminare?.codice}?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setProdottoDaEliminare(null)}>Annulla</Button>
          <Button color="error" variant="contained" onClick={confermareEliminazione}>Elimina</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
