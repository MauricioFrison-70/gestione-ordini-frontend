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
  annullareOrdineVendita,
  cercareOrdineVenditaPerId,
  rilasciareOrdineVendita,
} from '../../../services/ordineVenditaService'
import { elencareProdotti } from '../../../services/prodottoService'
import {
  aggiornareRigaOrdineVendita,
  creareRigaOrdineVendita,
  elencareRigheOrdineVendita,
  eliminareRigaOrdineVendita,
} from '../../../services/rigaOrdineVenditaService'
import type { Prodotto } from '../../prodotti/types/prodotto'
import type { OrdineVendita } from '../types/ordineVendita'
import type { RigaOrdineVendita } from '../types/rigaOrdineVendita'

const formatoValuta = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})
const formatoQuantita = new Intl.NumberFormat('it-IT')

function accettareIntero(valore: string): boolean {
  return /^\d{0,9}$/.test(valore)
}

function interoValido(valore: string): boolean {
  return /^\d{1,9}$/.test(valore) && Number(valore) > 0
}

function accettareDecimale(valore: string, intere: number, decimali: number): boolean {
  return new RegExp(`^\\d{0,${intere}}(,\\d{0,${decimali}})?$`).test(valore)
}

function decimaleValido(
  valore: string,
  intere: number,
  decimali: number,
  maggioreDiZero: boolean,
): boolean {
  if (!new RegExp(`^\\d{1,${intere}}(,\\d{1,${decimali}})?$`).test(valore)) return false
  const numero = Number(valore.replace(',', '.'))
  return Number.isFinite(numero) && (maggioreDiZero ? numero > 0 : numero >= 0)
}

function convertireDecimale(valore: string): number {
  return Number(valore.replace(',', '.'))
}

function formattareInput(valore: number, decimali: number): string {
  return valore.toLocaleString('it-IT', {
    useGrouping: false,
    maximumFractionDigits: decimali,
  })
}

type Conferma = 'RILASCIARE' | 'ANNULLARE' | null

export default function RigheOrdineVendita() {
  const { ordineId: ordineIdParam } = useParams()
  const ordineId = Number(ordineIdParam)
  const ordineIdValido = Number.isInteger(ordineId) && ordineId > 0
  const navigate = useNavigate()
  const { mostraMessaggio } = useFeedback()
  const [ordine, setOrdine] = useState<OrdineVendita | null>(null)
  const [righe, setRighe] = useState<RigaOrdineVendita[]>([])
  const [prodotti, setProdotti] = useState<Prodotto[]>([])
  const [codiceProdotto, setCodiceProdotto] = useState('')
  const [quantita, setQuantita] = useState('')
  const [valoreUnitario, setValoreUnitario] = useState('')
  const [rigaInModifica, setRigaInModifica] = useState<RigaOrdineVendita | null>(null)
  const [rigaDaEliminare, setRigaDaEliminare] = useState<RigaOrdineVendita | null>(null)
  const [caricando, setCaricando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [conferma, setConferma] = useState<Conferma>(null)

  useEffect(() => {
    if (!ordineIdValido) return
    void Promise.all([
      cercareOrdineVenditaPerId(ordineId),
      elencareRigheOrdineVendita(ordineId),
      elencareProdotti(),
    ])
      .then(([ordineCaricato, righeCaricate, prodottiCaricati]) => {
        setOrdine(ordineCaricato)
        setRighe(righeCaricate)
        setProdotti(prodottiCaricati)
      })
      .catch((errore) => mostraMessaggio(
        errore instanceof Error ? errore.message : "Errore nel caricamento delle righe dell'ordine",
        'error',
      ))
      .finally(() => setCaricando(false))
  }, [ordineId, ordineIdValido, mostraMessaggio])

  const ordineBloccato = Boolean(ordine?.dataRilascio || ordine?.dataAnnullamento)
  const codiciGiaUsati = useMemo(
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
  const totaleOrdine = useMemo(
    () => righe.reduce((totale, riga) => totale + riga.totaleRiga, 0),
    [righe],
  )

  const pulireModulo = () => {
    setCodiceProdotto('')
    setQuantita('')
    setValoreUnitario('')
    setRigaInModifica(null)
  }

  const selezionareProdotto = (codice: string) => {
    setCodiceProdotto(codice)
    const prodotto = prodotti.find((corrente) => corrente.codice === codice)
    if (prodotto) setValoreUnitario(formattareInput(prodotto.valoreVendita, 2))
  }

  const modificare = (riga: RigaOrdineVendita) => {
    setRigaInModifica(riga)
    setCodiceProdotto(riga.codiceProdotto)
    setQuantita(String(riga.quantita))
    setValoreUnitario(formattareInput(riga.valoreUnitario, 2))
  }

  const salvare = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!codiceProdotto
      || !interoValido(quantita)
      || !decimaleValido(valoreUnitario, 13, 2, false)) {
      mostraMessaggio(
        'Selezionare un prodotto e inserire una quantità intera e un valore unitario validi.',
        'warning',
      )
      return
    }
    const request = {
      codiceProdotto,
      quantita: Number(quantita),
      valoreUnitario: convertireDecimale(valoreUnitario),
    }
    setSalvando(true)
    try {
      if (rigaInModifica) {
        const aggiornata = await aggiornareRigaOrdineVendita(
          ordineId, rigaInModifica.id, request,
        )
        setRighe((correnti) => correnti.map((riga) =>
          riga.id === aggiornata.id ? aggiornata : riga))
        mostraMessaggio('Riga aggiornata con successo!', 'success')
      } else {
        const creata = await creareRigaOrdineVendita(ordineId, request)
        setRighe((correnti) => [...correnti, creata])
        mostraMessaggio('Riga aggiunta con successo!', 'success')
      }
      pulireModulo()
    } catch (errore) {
      mostraMessaggio(
        errore instanceof Error ? errore.message : "Errore nel salvataggio della riga dell'ordine",
        'error',
      )
    } finally {
      setSalvando(false)
    }
  }

  const confermareEliminazione = async () => {
    if (!rigaDaEliminare) return
    try {
      await eliminareRigaOrdineVendita(ordineId, rigaDaEliminare.id)
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
      const aggiornato = conferma === 'RILASCIARE'
        ? await rilasciareOrdineVendita(ordineId)
        : await annullareOrdineVendita(ordineId)
      setOrdine(aggiornato)
      mostraMessaggio(
        conferma === 'RILASCIARE'
          ? 'Ordine di vendita rilasciato con successo!'
          : 'Ordine di vendita annullato con successo!',
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

  if (!ordineIdValido) {
    return <Typography sx={{ textAlign: 'center', mt: 5 }}>Ordine di vendita non disponibile.</Typography>
  }
  if (caricando) {
    return <Box sx={{ textAlign: 'center', mt: 5 }}><CircularProgress aria-label="Caricamento righe" /></Box>
  }
  if (!ordine) {
    return <Typography sx={{ textAlign: 'center', mt: 5 }}>Ordine di vendita non disponibile.</Typography>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="primary"
            aria-label="Torna agli ordini di vendita"
            onClick={() => navigate('/ordini-vendita')}
            sx={{ mr: 2 }}
          ><ArrowBackIosNewIcon /></IconButton>
          <Box>
            <Typography variant="h4">Righe ordine di vendita</Typography>
            <Typography color="text.secondary">
              {ordine.numeroOrdine} · {ordine.cliente.nome}
            </Typography>
          </Box>
        </Box>
        {!ordineBloccato && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button color="error" variant="outlined" onClick={() => setConferma('ANNULLARE')}>
              Annulla ordine
            </Button>
            <Button
              color="success"
              variant="contained"
              disabled={righe.length === 0 || salvando}
              onClick={() => setConferma('RILASCIARE')}
            >
              Rilascia ordine
            </Button>
          </Box>
        )}
      </Box>

      {ordineBloccato && (
        <Alert severity="info" sx={{ mb: 3 }}>
          L&apos;ordine è {ordine.dataRilascio ? 'già stato rilasciato' : 'già stato annullato'}.
          Le righe sono disponibili in sola lettura.
        </Alert>
      )}

      {!ordineBloccato && (
        <Paper component="form" onSubmit={salvare} variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {rigaInModifica ? 'Modifica riga' : 'Nuova riga'}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 2, alignItems: 'start' }}>
            <FormControl required fullWidth>
              <InputLabel htmlFor="codice-prodotto">Prodotto</InputLabel>
              <Select
                native
                label="Prodotto"
                value={codiceProdotto}
                onChange={(event) => selezionareProdotto(String(event.target.value))}
                inputProps={{ id: 'codice-prodotto', 'aria-label': 'Prodotto' }}
              >
                <option aria-label="Nessuno" value="" />
                {prodottiDisponibili.map((prodotto) => (
                  <option
                    key={prodotto.id}
                    value={prodotto.codice}
                    disabled={codiciGiaUsati.has(prodotto.codice)}
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
              type="number"
              label="Quantità"
              value={quantita}
              onChange={(event) => {
                if (accettareIntero(event.target.value)) setQuantita(event.target.value)
              }}
              slotProps={{ htmlInput: { inputMode: 'numeric', min: 1, max: 999999999, step: 1 } }}
              helperText="Numero intero maggiore di zero"
            />
            <TextField
              required
              label="Valore unitario"
              value={valoreUnitario}
              onChange={(event) => {
                if (accettareDecimale(event.target.value, 13, 2)) setValoreUnitario(event.target.value)
              }}
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
              {rigaInModifica && <Button type="button" onClick={pulireModulo}>Annulla</Button>}
            </Box>
          </Box>
        </Paper>
      )}

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Codice prodotto</TableCell>
            <TableCell>Descrizione</TableCell>
            <TableCell align="right">Quantità</TableCell>
            <TableCell align="right">Valore unitario</TableCell>
            <TableCell align="right">Totale riga</TableCell>
            {!ordineBloccato && <TableCell align="center">Azioni</TableCell>}
          </TableRow></TableHead>
          <TableBody>
            {righe.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell>{riga.codiceProdotto}</TableCell>
                <TableCell>{riga.descrizioneProdotto}</TableCell>
                <TableCell align="right">{formatoQuantita.format(riga.quantita)}</TableCell>
                <TableCell align="right">{formatoValuta.format(riga.valoreUnitario)}</TableCell>
                <TableCell align="right">{formatoValuta.format(riga.totaleRiga)}</TableCell>
                {!ordineBloccato && <TableCell align="center">
                  <IconButton
                    color="primary"
                    aria-label={`Modifica ${riga.codiceProdotto}`}
                    onClick={() => modificare(riga)}
                  ><EditIcon /></IconButton>
                  <IconButton
                    color="error"
                    aria-label={`Elimina ${riga.codiceProdotto}`}
                    onClick={() => setRigaDaEliminare(riga)}
                  ><DeleteIcon /></IconButton>
                </TableCell>}
              </TableRow>
            ))}
            {righe.length === 0 && (
              <TableRow><TableCell colSpan={ordineBloccato ? 5 : 6} align="center">
                Nessuna riga presente nell&apos;ordine.
              </TableCell></TableRow>
            )}
            {righe.length > 0 && (
              <TableRow>
                <TableCell colSpan={4} align="right"><strong>Totale ordine</strong></TableCell>
                <TableCell align="right"><strong>{formatoValuta.format(totaleOrdine)}</strong></TableCell>
                {!ordineBloccato && <TableCell />}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={conferma !== null} onClose={() => setConferma(null)}>
        <DialogTitle>
          {conferma === 'RILASCIARE' ? 'Conferma rilascio' : 'Conferma annullamento'}
        </DialogTitle>
        <DialogContent><DialogContentText>
          {conferma === 'RILASCIARE'
            ? "Confermi il rilascio dell'ordine di vendita? Il sistema verificherà la disponibilità di tutti i prodotti e scalerà le quantità dalla giacenza."
            : "Confermi l’annullamento dell’ordine di vendita?"}
        </DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConferma(null)}>Indietro</Button>
          <Button
            variant="contained"
            color={conferma === 'RILASCIARE' ? 'success' : 'error'}
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
          <Button color="error" variant="contained" onClick={confermareEliminazione}>Elimina</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
