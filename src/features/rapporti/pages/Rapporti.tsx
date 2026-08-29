import { useEffect, useMemo, useState } from 'react'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableViewIcon from '@mui/icons-material/TableView'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import {
  elencareOpzioniParametro,
  elencareRapporti,
  eseguireRapporto,
} from '../../../services/rapportoService'
import type {
  ColonnaRapporto,
  OpzioneParametro,
  ParametroRapporto,
  Rapporto,
  RisultatoRapporto,
} from '../types/rapporto'
import {
  esportareRapportoExcel,
  esportareRapportoPdf,
  mostraValoreRapporto,
} from '../utils/esportazioneRapporto'

type ValoreParametro = string | boolean

function indiceEtichettaTotali(colonne: ColonnaRapporto[]): number {
  const primaColonnaTotalizzata = colonne.findIndex((colonna) => colonna.totalizzare)
  if (primaColonnaTotalizzata > 0) return primaColonnaTotalizzata - 1
  return colonne.findIndex((colonna) => !colonna.totalizzare)
}

function valoriIniziali(rapporto: Rapporto): Record<string, ValoreParametro> {
  return Object.fromEntries(rapporto.parametri.map((parametro) => [
    parametro.nome,
    parametro.tipo === 'BOOLEANO'
      ? parametro.valorePredefinito?.toLowerCase() === 'true'
      : parametro.valorePredefinito ?? '',
  ]))
}

function CampoParametro({
  parametro,
  valore,
  opzioni,
  onChange,
}: {
  parametro: ParametroRapporto
  valore: ValoreParametro
  opzioni: OpzioneParametro[]
  onChange: (valore: ValoreParametro) => void
}) {
  if (parametro.tipo === 'BOOLEANO') {
    return (
      <FormControlLabel
        control={<Checkbox checked={Boolean(valore)} onChange={(event) => onChange(event.target.checked)} />}
        label={parametro.etichetta}
      />
    )
  }

  if (parametro.tipo === 'SELEZIONE') {
    return (
      <FormControl fullWidth required={parametro.obbligatorio}>
        <InputLabel id={`parametro-${parametro.nome}`}>{parametro.etichetta}</InputLabel>
        <Select
          labelId={`parametro-${parametro.nome}`}
          label={parametro.etichetta}
          value={valore}
          onChange={(event) => onChange(String(event.target.value))}
        >
          {!parametro.obbligatorio && <MenuItem value="">Tutti</MenuItem>}
          {opzioni.map((opzione) => (
            <MenuItem key={String(opzione.valore)} value={String(opzione.valore)}>
              {opzione.etichetta}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  }

  const tipoInput = parametro.tipo === 'DATA'
    ? 'date'
    : parametro.tipo === 'INTERO' || parametro.tipo === 'DECIMALE' ? 'number' : 'text'
  return (
    <TextField
      fullWidth
      required={parametro.obbligatorio}
      label={parametro.etichetta}
      type={tipoInput}
      value={valore}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        inputLabel: tipoInput === 'date' ? { shrink: true } : undefined,
        htmlInput: parametro.tipo === 'INTERO'
          ? { step: 1 }
          : parametro.tipo === 'DECIMALE' ? { step: 'any' } : undefined,
      }}
      sx={{ mb: 0 }}
    />
  )
}

export default function Rapporti() {
  const [rapporti, setRapporti] = useState<Rapporto[]>([])
  const [rapportoId, setRapportoId] = useState<number | ''>('')
  const [valori, setValori] = useState<Record<string, ValoreParametro>>({})
  const [opzioni, setOpzioni] = useState<Record<string, OpzioneParametro[]>>({})
  const [risultato, setRisultato] = useState<RisultatoRapporto | null>(null)
  const [caricando, setCaricando] = useState(true)
  const [eseguendo, setEseguendo] = useState(false)
  const { mostraMessaggio } = useFeedback()

  const rapporto = useMemo(
    () => rapporti.find((corrente) => corrente.id === rapportoId) ?? null,
    [rapporti, rapportoId],
  )

  useEffect(() => {
    let attivo = true
    void elencareRapporti()
      .then((elenco) => {
        if (!attivo) return
        setRapporti(elenco)
        if (elenco.length > 0) setRapportoId(elenco[0].id)
      })
      .catch((errore) => mostraMessaggio(
        errore instanceof Error ? errore.message : 'Errore nel caricamento dei rapporti',
        'error',
      ))
      .finally(() => { if (attivo) setCaricando(false) })
    return () => { attivo = false }
  }, [mostraMessaggio])

  useEffect(() => {
    if (!rapporto) return
    let attivo = true
    setValori(valoriIniziali(rapporto))
    setRisultato(null)
    setOpzioni({})
    const parametriConOpzioni = rapporto.parametri.filter((parametro) => parametro.haOpzioni)
    void Promise.all(parametriConOpzioni.map(async (parametro) => ({
      nome: parametro.nome,
      valori: await elencareOpzioniParametro(rapporto.id, parametro.nome),
    })))
      .then((elenchi) => {
        if (attivo) setOpzioni(Object.fromEntries(elenchi.map((elenco) => [elenco.nome, elenco.valori])))
      })
      .catch((errore) => mostraMessaggio(
        errore instanceof Error ? errore.message : 'Errore nel caricamento delle opzioni',
        'error',
      ))
    return () => { attivo = false }
  }, [mostraMessaggio, rapporto])

  const eseguire = async () => {
    if (!rapporto) return
    const mancante = rapporto.parametri.find((parametro) =>
      parametro.obbligatorio && (valori[parametro.nome] === '' || valori[parametro.nome] === undefined))
    if (mancante) {
      mostraMessaggio(`Il parametro '${mancante.etichetta}' è obbligatorio`, 'warning')
      return
    }

    setEseguendo(true)
    try {
      const parametri = Object.fromEntries(rapporto.parametri.map((parametro) => [
        parametro.nome,
        valori[parametro.nome] === '' ? null : valori[parametro.nome],
      ]))
      setRisultato(await eseguireRapporto(rapporto.id, parametri))
    } catch (errore) {
      mostraMessaggio(
        errore instanceof Error ? errore.message : "Errore nell'esecuzione del rapporto",
        'error',
      )
    } finally {
      setEseguendo(false)
    }
  }

  const esportareExcel = async () => {
    if (!rapporto || !risultato || risultato.righe.length === 0) return
    try {
      await esportareRapportoExcel(rapporto, risultato)
      mostraMessaggio('Rapporto Excel generato con successo!', 'success')
    } catch {
      mostraMessaggio('Errore nella generazione del rapporto Excel', 'error')
    }
  }

  const esportarePdf = async () => {
    if (!rapporto || !risultato || risultato.righe.length === 0) return
    try {
      await esportareRapportoPdf(rapporto, risultato)
      mostraMessaggio('Rapporto PDF generato con successo!', 'success')
    } catch {
      mostraMessaggio('Errore nella generazione del rapporto PDF', 'error')
    }
  }

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 3 }}>Rapporti</Typography>

      {caricando && <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>}
      {!caricando && rapporti.length === 0 && <Alert severity="info">Nessun rapporto disponibile.</Alert>}

      {!caricando && rapporti.length > 0 && (
        <>
          <Paper elevation={4} sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="rapporto-label">Rapporto</InputLabel>
              <Select
                labelId="rapporto-label"
                label="Rapporto"
                value={rapportoId}
                onChange={(event) => setRapportoId(Number(event.target.value))}
              >
                {rapporti.map((corrente) => (
                  <MenuItem key={corrente.id} value={corrente.id}>{corrente.titolo}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {rapporto?.descrizione && (
              <Typography color="text.secondary" sx={{ mb: 3 }}>{rapporto.descrizione}</Typography>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 2 }}>
              {rapporto?.parametri.map((parametro) => (
                <CampoParametro
                  key={parametro.nome}
                  parametro={parametro}
                  valore={valori[parametro.nome] ?? ''}
                  opzioni={opzioni[parametro.nome] ?? []}
                  onChange={(valore) => setValori((correnti) => ({ ...correnti, [parametro.nome]: valore }))}
                />
              ))}
            </Box>

            <Button
              variant="contained"
              startIcon={eseguendo ? <CircularProgress color="inherit" size={18} /> : <PlayArrowIcon />}
              disabled={eseguendo}
              onClick={eseguire}
              sx={{ mt: 3 }}
            >
              Esegui rapporto
            </Button>
          </Paper>

          {risultato && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h2">Risultato</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Esporta in Excel">
                    <span>
                      <IconButton
                        color="success"
                        aria-label="Esporta il rapporto in Excel"
                        disabled={risultato.righe.length === 0}
                        onClick={() => { void esportareExcel() }}
                      >
                        <TableViewIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Esporta in PDF">
                    <span>
                      <IconButton
                        color="error"
                        aria-label="Esporta il rapporto in PDF"
                        disabled={risultato.righe.length === 0}
                        onClick={() => { void esportarePdf() }}
                      >
                        <PictureAsPdfIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
              {risultato.troncato && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Il risultato è stato limitato alle prime {risultato.totaleRighe} righe.
                </Alert>
              )}
              <TableContainer component={Paper} elevation={4}>
                <Table>
                  <TableHead><TableRow>
                    {risultato.colonne.map((colonna) => (
                        <TableCell
                          key={colonna.nome}
                          align={colonna.formato === 'VALUTA' || colonna.totalizzare ? 'right' : 'left'}
                      >
                        {colonna.etichetta}
                      </TableCell>
                    ))}
                  </TableRow></TableHead>
                  <TableBody>
                    {risultato.righe.map((riga, indice) => (
                      <TableRow key={indice}>
                        {risultato.colonne.map((colonna) => (
                          <TableCell
                            key={colonna.nome}
                            align={colonna.formato === 'VALUTA' || colonna.totalizzare ? 'right' : 'left'}
                          >
                            {mostraValoreRapporto(riga[colonna.nome], colonna)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {risultato.righe.length > 0
                      && risultato.colonne.some((colonna) => colonna.totalizzare) && (
                      <TableRow
                        aria-label="Totale rapporto"
                        sx={{
                          '& td': {
                            fontWeight: 700,
                            borderTop: 2,
                            borderColor: 'divider',
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        {risultato.colonne.map((colonna, indice) => (
                          <TableCell
                            key={colonna.nome}
                            align={colonna.formato === 'VALUTA' || colonna.totalizzare ? 'right' : 'left'}
                          >
                            {colonna.totalizzare
                              ? mostraValoreRapporto(risultato.totali[colonna.nome] ?? 0, colonna)
                              : indice === indiceEtichettaTotali(risultato.colonne) ? 'Totale' : ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    )}
                    {risultato.righe.length === 0 && (
                      <TableRow><TableCell colSpan={Math.max(1, risultato.colonne.length)} align="center">
                        Nessun dato trovato.
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {risultato.totaleRighe} righe visualizzate
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
