import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import { listarAgentes } from '../../../services/agenteService'
import { aggiornareOrdineVendita, cercareOrdineVenditaPerId } from '../../../services/ordineVenditaService'
import type { Agente, TipoAgente } from '../../agentes/types/agente'
import type { OrdineVendita } from '../types/ordineVendita'

interface SelettoreProps {
  id: string
  etichetta: string
  valore: string
  agenti: Agente[]
  onChange: (valore: string) => void
}

function Selettore({ id, etichetta, valore, agenti, onChange }: SelettoreProps) {
  return (
    <FormControl required fullWidth>
      <InputLabel htmlFor={id}>{etichetta}</InputLabel>
      <Select native label={etichetta} value={valore}
        onChange={(event) => onChange(String(event.target.value))}
        inputProps={{ id, 'aria-label': etichetta }}>
        <option aria-label="Nessuno" value="" />
        {agenti.map((agente) => <option key={agente.id} value={agente.id}>{agente.nome}</option>)}
      </Select>
    </FormControl>
  )
}

function filtrarAgenti(agenti: Agente[], tipo: TipoAgente, idAtual: number | undefined) {
  return agenti.filter((agente) =>
    agente.tipoAgente === tipo && (!agente.archiviato || agente.id === idAtual),
  )
}

export default function ModificareOrdineVendita() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mostraMessaggio } = useFeedback()
  const [ordine, setOrdine] = useState<OrdineVendita | null>(null)
  const [agenti, setAgenti] = useState<Agente[]>([])
  const [clienteId, setClienteId] = useState('')
  const [venditoreId, setVenditoreId] = useState('')
  const [trasportatoreId, setTrasportatoreId] = useState('')
  const [caricando, setCaricando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!id) return
    void Promise.all([cercareOrdineVenditaPerId(Number(id)), listarAgentes()])
      .then(([ordineCaricato, agentiCaricati]) => {
        setOrdine(ordineCaricato)
        setAgenti(agentiCaricati)
        setClienteId(String(ordineCaricato.cliente.id))
        setVenditoreId(String(ordineCaricato.venditore.id))
        setTrasportatoreId(String(ordineCaricato.trasportatore.id))
      })
      .catch(() => mostraMessaggio('Ordine di vendita non trovato', 'error'))
      .finally(() => setCaricando(false))
  }, [id, mostraMessaggio])

  const clienti = useMemo(() => filtrarAgenti(agenti, 'CLIENTE', ordine?.cliente.id), [agenti, ordine])
  const venditori = useMemo(() => filtrarAgenti(agenti, 'VENDITORE', ordine?.venditore.id), [agenti, ordine])
  const trasportatori = useMemo(() => filtrarAgenti(agenti, 'TRASPORTATORE', ordine?.trasportatore.id), [agenti, ordine])
  const ordineBloccato = Boolean(ordine?.dataRilascio || ordine?.dataAnnullamento)

  const salvare = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!id || !ordine) return
    setSalvando(true)
    try {
      await aggiornareOrdineVendita(Number(id), {
        clienteId: Number(clienteId),
        venditoreId: Number(venditoreId),
        trasportatoreId: Number(trasportatoreId),
      })
      mostraMessaggio('Ordine di vendita aggiornato con successo!', 'success')
      navigate('/ordini-vendita')
    } catch (errore) {
      mostraMessaggio(errore instanceof Error ? errore.message : "Errore nell'aggiornamento dell'ordine", 'error')
    } finally {
      setSalvando(false)
    }
  }

  if (caricando) return <Box sx={{ textAlign: 'center', mt: 5 }}><CircularProgress aria-label="Caricamento ordine" /></Box>
  if (!ordine) return <Typography sx={{ textAlign: 'center', mt: 5 }}>Ordine di vendita non disponibile.</Typography>

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Paper elevation={4} sx={{ width: 680, p: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton color="primary" aria-label="Torna agli ordini" onClick={() => navigate('/ordini-vendita')} sx={{ mr: 2 }}><ArrowBackIosNewIcon /></IconButton>
          <Typography variant="h4">Modifica ordine di vendita</Typography>
        </Box>
        <Box component="form" onSubmit={salvare} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Paper component="section" variant="outlined" aria-labelledby="dati-non-modificabili" sx={{ p: 3 }}>
            <Typography id="dati-non-modificabili" variant="h6" sx={{ mb: 2.5 }}>
              Dati non modificabili
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="Numero ordine" value={ordine.numeroOrdine} disabled />
              <TextField label="Data registrazione" value={new Date(ordine.dataRegistrazione).toLocaleString('it-IT')} disabled />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
              <TextField label="Data rilascio" type="date" value={ordine.dataRilascio || ''}
                slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }} />
              <TextField label="Data annullamento" type="date" value={ordine.dataAnnullamento || ''}
                slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }} />
            </Box>
          </Paper>

          {ordineBloccato ? (
            <Alert severity="info">
              L&apos;ordine è {ordine.dataRilascio ? 'già stato rilasciato' : 'già stato annullato'}
              e non può più essere modificato.
            </Alert>
          ) : (
            <>
              <Paper component="section" variant="outlined" aria-labelledby="dati-modificabili" sx={{ p: 3 }}>
                <Typography id="dati-modificabili" variant="h6" sx={{ mb: 2.5 }}>
                  Dati modificabili
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Selettore id="cliente" etichetta="Cliente" valore={clienteId} agenti={clienti} onChange={setClienteId} />
                  <Selettore id="venditore" etichetta="Venditore" valore={venditoreId} agenti={venditori} onChange={setVenditoreId} />
                  <Selettore id="trasportatore" etichetta="Trasportatore" valore={trasportatoreId} agenti={trasportatori} onChange={setTrasportatoreId} />
                </Box>
              </Paper>
              <Button type="submit" variant="contained" disabled={salvando}>
                {salvando ? 'Salvataggio...' : 'Salva modifiche'}
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
