import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useFeedback } from '../../../components/useFeedback'
import { listarAgentes } from '../../../services/agenteService'
import { creareOrdineVendita } from '../../../services/ordineVenditaService'
import type { Agente, TipoAgente } from '../../agentes/types/agente'

function agentiAttiviPerTipo(agenti: Agente[], tipo: TipoAgente) {
  return agenti.filter((agente) => agente.tipoAgente === tipo && !agente.archiviato)
}

interface SelettoreAgenteProps {
  id: string
  etichetta: string
  valore: string
  agenti: Agente[]
  onChange: (valore: string) => void
}

function SelettoreAgente({ id, etichetta, valore, agenti, onChange }: SelettoreAgenteProps) {
  return (
    <FormControl required fullWidth>
      <InputLabel htmlFor={id}>{etichetta}</InputLabel>
      <Select
        native
        label={etichetta}
        value={valore}
        onChange={(event) => onChange(String(event.target.value))}
        inputProps={{ id, 'aria-label': etichetta }}
      >
        <option aria-label="Nessuno" value="" />
        {agenti.map((agente) => <option key={agente.id} value={agente.id}>{agente.nome}</option>)}
      </Select>
      {agenti.length === 0 && <FormHelperText>Nessun agente disponibile per questo ruolo.</FormHelperText>}
    </FormControl>
  )
}

export default function CreareOrdineVendita() {
  const navigate = useNavigate()
  const { mostraMessaggio } = useFeedback()
  const [agenti, setAgenti] = useState<Agente[]>([])
  const [clienteId, setClienteId] = useState('')
  const [venditoreId, setVenditoreId] = useState('')
  const [trasportatoreId, setTrasportatoreId] = useState('')
  const [caricando, setCaricando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let attivo = true
    void listarAgentes()
      .then((risultato) => { if (attivo) setAgenti(risultato) })
      .catch(() => mostraMessaggio('Errore nel caricamento degli agenti', 'error'))
      .finally(() => { if (attivo) setCaricando(false) })
    return () => { attivo = false }
  }, [mostraMessaggio])

  const clienti = useMemo(() => agentiAttiviPerTipo(agenti, 'CLIENTE'), [agenti])
  const venditori = useMemo(() => agentiAttiviPerTipo(agenti, 'VENDITORE'), [agenti])
  const trasportatori = useMemo(() => agentiAttiviPerTipo(agenti, 'TRASPORTATORE'), [agenti])
  const anteprimaNumero = `OV-${new Date().getFullYear()}-XXXXXX`

  const salvare = async (event: React.FormEvent) => {
    event.preventDefault()
    setSalvando(true)
    try {
      const ordineCreato = await creareOrdineVendita({
        clienteId: Number(clienteId),
        venditoreId: Number(venditoreId),
        trasportatoreId: Number(trasportatoreId),
      })
      mostraMessaggio('Ordine di vendita creato con successo!', 'success')
      navigate(`/ordini-vendita/${ordineCreato.id}/righe`)
    } catch (errore) {
      mostraMessaggio(
        errore instanceof Error ? errore.message : "Errore nella creazione dell'ordine di vendita",
        'error',
      )
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Paper elevation={4} sx={{ width: 680, p: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton color="primary" aria-label="Torna agli ordini" onClick={() => navigate('/ordini-vendita')} sx={{ mr: 2 }}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography variant="h4">Nuovo ordine di vendita</Typography>
        </Box>

        <Box component="form" onSubmit={salvare} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Numero ordine"
              value={anteprimaNumero}
              helperText="Il numero definitivo viene assegnato al salvataggio."
              slotProps={{ htmlInput: { readOnly: true } }}
            />
            <TextField
              label="Data registrazione"
              value="Generata automaticamente"
              helperText="Campo assegnato dal sistema."
              slotProps={{ htmlInput: { readOnly: true } }}
            />
          </Box>

          <SelettoreAgente id="cliente" etichetta="Cliente" valore={clienteId} agenti={clienti} onChange={setClienteId} />
          <SelettoreAgente id="venditore" etichetta="Venditore" valore={venditoreId} agenti={venditori} onChange={setVenditoreId} />
          <SelettoreAgente id="trasportatore" etichetta="Trasportatore" valore={trasportatoreId} agenti={trasportatori} onChange={setTrasportatoreId} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
            <Button variant="outlined" onClick={() => navigate('/ordini-vendita')}>Annulla</Button>
            <Button type="submit" variant="contained" disabled={caricando || salvando}>
              {salvando ? 'Salvataggio...' : 'Crea ordine'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}
