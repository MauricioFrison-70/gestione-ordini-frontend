import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import {
  annullareOrdineAcquisto,
  cercareOrdineAcquistoPerId,
  ricevereOrdineAcquisto,
} from '../../../services/ordineAcquistoService'
import { elencareProdotti } from '../../../services/prodottoService'
import {
  aggiornareRigaOrdineAcquisto,
  creareRigaOrdineAcquisto,
  elencareRigheOrdineAcquisto,
  eliminareRigaOrdineAcquisto,
} from '../../../services/rigaOrdineAcquistoService'
import type { Prodotto } from '../../prodotti/types/prodotto'
import type { OrdineAcquisto } from '../types/ordineAcquisto'
import type { RigaOrdineAcquisto } from '../types/rigaOrdineAcquisto'

const formatoValuta = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })
const formatoQuantita = new Intl.NumberFormat('it-IT')

function interoInput(valore: string): boolean {
  return /^\d{0,9}$/.test(valore)
}

function interoValido(valore: string): boolean {
  return /^\d{1,9}$/.test(valore) && Number(valore) > 0
}

function decimaleInput(valore: string): boolean {
  return /^\d{0,13}(,\d{0,2})?$/.test(valore)
}

function decimaleValido(valore: string): boolean {
  return /^\d{1,13}(,\d{1,2})?$/.test(valore)
}

function numero(valore: string): number {
  return Number(valore.replace(',', '.'))
}

function inputValuta(valore: number): string {
  return valore.toLocaleString('it-IT', { useGrouping: false, maximumFractionDigits: 2 })
}

type Conferma = 'RICEVERE' | 'ANNULLARE' | null

export default function RigheOrdineAcquisto() {
  const { ordineId: parametro } = useParams()
  const ordineId = Number(parametro)
  const idValido = Number.isInteger(ordineId) && ordineId > 0
  const navigate = useNavigate()
  const { mostraMessaggio } = useFeedback()
  const [ordine, setOrdine] = useState<OrdineAcquisto | null>(null)
  const [righe, setRighe] = useState<RigaOrdineAcquisto[]>([])
  const [prodotti, setProdotti] = useState<Prodotto[]>([])
  const [codiceProdotto, setCodiceProdotto] = useState('')
  const [quantita, setQuantita] = useState('')
  const [valoreUnitario, setValoreUnitario] = useState('')
  const [caricando, setCaricando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [conferma, setConferma] = useState<Conferma>(null)
  const [rigaInModifica, setRigaInModifica] = useState<RigaOrdineAcquisto | null>(null)
  const [rigaDaEliminare, setRigaDaEliminare] = useState<RigaOrdineAcquisto | null>(null)

  useEffect(() => {
    if (!idValido) return
    void Promise.all([
      cercareOrdineAcquistoPerId(ordineId),
      elencareRigheOrdineAcquisto(ordineId),
      elencareProdotti(),
    ])
      .then(([ordineCaricato, righeCaricate, prodottiCaricati]) => {
        setOrdine(ordineCaricato)
        setRighe(righeCaricate)
        setProdotti(prodottiCaricati)
      })
      .catch((errore) => mostraMessaggio(
        errore instanceof Error ? errore.message : "Errore nel caricamento dell'ordine",
        'error',
      ))
      .finally(() => setCaricando(false))
  }, [idValido, mostraMessaggio, ordineId])

  const bloccato = Boolean(ordine?.dataRicevimento || ordine?.dataAnnullamento)
  const codiciUsati = useMemo(
    () => new Set(righe
      .filter((riga) => riga.id !== rigaInModifica?.id)
      .map((riga) => riga.codiceProdotto)),
    [righe, rigaInModifica],
  )
  const prodottiDisponibili = useMemo(
    () => prodotti.filter((prodotto) => !prodotto.archiviato
      || prodotto.codice === rigaInModifica?.codiceProdotto),
    [prodotti, rigaInModifica],
  )
  const totale = useMemo(
    () => righe.reduce((somma, riga) => somma + riga.totaleRiga, 0),
    [righe],
  )

  const selezionareProdotto = (codice: string) => {
    setCodiceProdotto(codice)
    const prodotto = prodotti.find((corrente) => corrente.codice === codice)
    if (prodotto) setValoreUnitario(inputValuta(prodotto.valoreAcquisto))
  }

  const pulireModulo = () => {
    setCodiceProdotto('')
    setQuantita('')
    setValoreUnitario('')
    setRigaInModifica(null)
  }

  const modificareRiga = (riga: RigaOrdineAcquisto) => {
    setRigaInModifica(riga)
    setCodiceProdotto(riga.codiceProdotto)
    setQuantita(String(riga.quantita))
    setValoreUnitario(inputValuta(riga.valoreUnitario))
  }

  const salvareRiga = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!codiceProdotto || !interoValido(quantita) || !decimaleValido(valoreUnitario)) {
      mostraMessaggio('Selezionare un prodotto e inserire quantità e valore validi.', 'warning')
      return
    }
    setSalvando(true)
    try {
      const request = {
        codiceProdotto,
        quantita: Number(quantita),
        valoreUnitario: numero(valoreUnitario),
      }
      if (rigaInModifica) {
        const aggiornata = await aggiornareRigaOrdineAcquisto(
          ordineId, rigaInModifica.id, request,
        )
        setRighe((correnti) => correnti.map((riga) =>
          riga.id === aggiornata.id ? aggiornata : riga))
        mostraMessaggio('Riga aggiornata con successo!', 'success')
      } else {
        const creata = await creareRigaOrdineAcquisto(ordineId, request)
        setRighe((correnti) => [...correnti, creata])
        mostraMessaggio('Riga aggiunta con successo!', 'success')
      }
      pulireModulo()
    } catch (errore) {
      mostraMessaggio(
        errore instanceof Error ? errore.message : "Errore nell'inserimento della riga",
        'error',
      )
    } finally {
      setSalvando(false)
    }
  }

  const eliminareRiga = async () => {
    if (!rigaDaEliminare) return
    try {
      await eliminareRigaOrdineAcquisto(ordineId, rigaDaEliminare.id)
      setRighe((correnti) => correnti.filter((riga) => riga.id !== rigaDaEliminare.id))
      if (rigaInModifica?.id === rigaDaEliminare.id) pulireModulo()
      mostraMessaggio('Riga eliminata con successo!', 'success')
    } catch (errore) {
      mostraMessaggio(
        errore instanceof Error ? errore.message : "Errore nell'eliminazione della riga",
        'error',
      )
    } finally {
      setRigaDaEliminare(null)
    }
  }

  const confermareOperazione = async () => {
    if (!conferma) return
    setSalvando(true)
    try {
      const aggiornato = conferma === 'RICEVERE'
        ? await ricevereOrdineAcquisto(ordineId)
        : await annullareOrdineAcquisto(ordineId)
      setOrdine(aggiornato)
      mostraMessaggio(
        conferma === 'RICEVERE'
          ? 'Merce ricevuta e giacenza aggiornata con successo!'
          : 'Ordine di acquisto annullato con successo!',
        'success',
      )
    } catch (errore) {
      mostraMessaggio(
        errore instanceof Error ? errore.message : "Errore nell'operazione richiesta",
        'error',
      )
    } finally {
      setConferma(null)
      setSalvando(false)
    }
  }

  if (!idValido) return <Typography sx={{ textAlign: 'center', mt: 5 }}>Ordine non disponibile.</Typography>
  if (caricando) return <Box sx={{ textAlign: 'center', mt: 5 }}><CircularProgress /></Box>
  if (!ordine) return <Typography sx={{ textAlign: 'center', mt: 5 }}>Ordine non disponibile.</Typography>

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="primary"
            aria-label="Torna agli ordini di acquisto"
            onClick={() => navigate('/ordini-acquisto')}
            sx={{ mr: 2 }}
          ><ArrowBackIosNewIcon /></IconButton>
          <Box>
            <Typography variant="h4">Righe ordine di acquisto</Typography>
            <Typography color="text.secondary">
              {ordine.numeroOrdine} · {ordine.fornitore.nome}
            </Typography>
          </Box>
        </Box>
        {!bloccato && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button color="error" variant="outlined" onClick={() => setConferma('ANNULLARE')}>
              Annulla ordine
            </Button>
            <Button
              color="success"
              variant="contained"
              disabled={righe.length === 0 || salvando}
              onClick={() => setConferma('RICEVERE')}
            >
              Ricevi merce
            </Button>
          </Box>
        )}
      </Box>

      {bloccato && (
        <Alert severity={ordine.dataRicevimento ? 'success' : 'info'} sx={{ mb: 3 }}>
          L&apos;ordine è {ordine.dataRicevimento ? 'stato ricevuto' : 'stato annullato'}.
          Le righe sono disponibili in sola lettura.
        </Alert>
      )}

      {!bloccato && (
        <Paper component="form" onSubmit={salvareRiga} variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {rigaInModifica ? 'Modifica riga' : 'Nuova riga'}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 2, alignItems: 'start' }}>
            <FormControl required fullWidth>
              <InputLabel htmlFor="prodotto-acquisto">Prodotto</InputLabel>
              <Select
                native
                label="Prodotto"
                value={codiceProdotto}
                onChange={(event) => selezionareProdotto(String(event.target.value))}
                inputProps={{ id: 'prodotto-acquisto', 'aria-label': 'Prodotto' }}
              >
                <option aria-label="Nessuno" value="" />
                {prodottiDisponibili.map((prodotto) => (
                  <option
                    key={prodotto.id}
                    value={prodotto.codice}
                    disabled={codiciUsati.has(prodotto.codice)}
                  >
                    {prodotto.codice} — {prodotto.descrizione}
                  </option>
                ))}
              </Select>
              {prodottiDisponibili.length === 0 && (
                <FormHelperText>Nessun prodotto attivo disponibile.</FormHelperText>
              )}
            </FormControl>
            <TextField
              required
              label="Quantità"
              value={quantita}
              onChange={(event) => { if (interoInput(event.target.value)) setQuantita(event.target.value) }}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 9 } }}
              helperText="Numero intero maggiore di zero"
            />
            <TextField
              required
              label="Valore unitario"
              value={valoreUnitario}
              onChange={(event) => { if (decimaleInput(event.target.value)) setValoreUnitario(event.target.value) }}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              helperText="EUR"
            />
            <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={!rigaInModifica ? <AddIcon /> : undefined}
                disabled={salvando}
              >
                {rigaInModifica ? 'Salva' : 'Aggiungi'}
              </Button>
              {rigaInModifica && (
                <Button type="button" onClick={pulireModulo}>Annulla</Button>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Prodotto</TableCell>
            <TableCell align="right">Quantità</TableCell>
            <TableCell align="right">Valore unitario</TableCell>
            <TableCell align="right">Totale</TableCell>
            <TableCell>Azioni</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {righe.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell>{riga.codiceProdotto} — {riga.descrizioneProdotto}</TableCell>
                <TableCell align="right">{formatoQuantita.format(riga.quantita)}</TableCell>
                <TableCell align="right">{formatoValuta.format(riga.valoreUnitario)}</TableCell>
                <TableCell align="right">{formatoValuta.format(riga.totaleRiga)}</TableCell>
                <TableCell>
                  {!bloccato && (
                    <>
                      <IconButton
                        color="primary"
                        aria-label={`Modifica ${riga.codiceProdotto}`}
                        onClick={() => modificareRiga(riga)}
                      ><EditIcon /></IconButton>
                      <IconButton
                        color="error"
                        aria-label={`Elimina ${riga.codiceProdotto}`}
                        onClick={() => setRigaDaEliminare(riga)}
                      ><DeleteIcon /></IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {righe.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">Nessuna riga inserita.</TableCell></TableRow>
            )}
            <TableRow>
              <TableCell colSpan={3} align="right"><strong>Totale ordine</strong></TableCell>
              <TableCell align="right"><strong>{formatoValuta.format(totale)}</strong></TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={conferma !== null} onClose={() => setConferma(null)}>
        <DialogTitle>{conferma === 'RICEVERE' ? 'Conferma ricevimento' : 'Conferma annullamento'}</DialogTitle>
        <DialogContent><DialogContentText>
          {conferma === 'RICEVERE'
            ? 'Confermi il ricevimento? La quantità dei prodotti verrà aggiunta alla giacenza.'
            : 'Confermi l’annullamento dell’ordine di acquisto?'}
        </DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConferma(null)}>Indietro</Button>
          <Button
            variant="contained"
            color={conferma === 'RICEVERE' ? 'success' : 'error'}
            onClick={confermareOperazione}
          >Conferma</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rigaDaEliminare !== null} onClose={() => setRigaDaEliminare(null)}>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent><DialogContentText>
          Vuoi eliminare la riga del prodotto {rigaDaEliminare?.codiceProdotto}?
        </DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setRigaDaEliminare(null)}>Annulla</Button>
          <Button color="error" variant="contained" onClick={eliminareRiga}>Elimina</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
