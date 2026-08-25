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
import { creareOrdineAcquisto } from '../../../services/ordineAcquistoService'
import type { Agente } from '../../agentes/types/agente'

export default function CreareOrdineAcquisto() {
  const navigate = useNavigate()
  const { mostraMessaggio } = useFeedback()
  const [agenti, setAgenti] = useState<Agente[]>([])
  const [fornitoreId, setFornitoreId] = useState('')
  const [caricando, setCaricando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let attivo = true
    void listarAgentes()
      .then((risultato) => { if (attivo) setAgenti(risultato) })
      .catch(() => mostraMessaggio('Errore nel caricamento dei fornitori', 'error'))
      .finally(() => { if (attivo) setCaricando(false) })
    return () => { attivo = false }
  }, [mostraMessaggio])

  const fornitori = useMemo(
    () => agenti.filter((agente) =>
      agente.tipoAgente === 'FORNITORE' && !agente.archiviato),
    [agenti],
  )

  const salvare = async (event: React.FormEvent) => {
    event.preventDefault()
    setSalvando(true)
    try {
      const ordine = await creareOrdineAcquisto({ fornitoreId: Number(fornitoreId) })
      mostraMessaggio('Ordine di acquisto creato con successo!', 'success')
      navigate(`/ordini-acquisto/${ordine.id}/righe`)
    } catch (errore) {
      mostraMessaggio(
        errore instanceof Error ? errore.message : "Errore nella creazione dell'ordine",
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
          <IconButton
            color="primary"
            aria-label="Torna agli ordini di acquisto"
            onClick={() => navigate('/ordini-acquisto')}
            sx={{ mr: 2 }}
          ><ArrowBackIosNewIcon /></IconButton>
          <Typography variant="h4">Nuovo ordine di acquisto</Typography>
        </Box>

        <Box component="form" onSubmit={salvare} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Numero ordine"
              value={`OA-${new Date().getFullYear()}-XXXXXX`}
              helperText="Assegnato automaticamente al salvataggio."
              slotProps={{ htmlInput: { readOnly: true } }}
            />
            <TextField
              label="Data registrazione"
              value="Generata automaticamente"
              helperText="Campo assegnato dal sistema."
              slotProps={{ htmlInput: { readOnly: true } }}
            />
          </Box>

          <FormControl required fullWidth>
            <InputLabel htmlFor="fornitore">Fornitore</InputLabel>
            <Select
              native
              label="Fornitore"
              value={fornitoreId}
              onChange={(event) => setFornitoreId(String(event.target.value))}
              inputProps={{ id: 'fornitore', 'aria-label': 'Fornitore' }}
            >
              <option aria-label="Nessuno" value="" />
              {fornitori.map((fornitore) => (
                <option key={fornitore.id} value={fornitore.id}>{fornitore.nome}</option>
              ))}
            </Select>
            {fornitori.length === 0 && (
              <FormHelperText>Nessun fornitore attivo disponibile.</FormHelperText>
            )}
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/ordini-acquisto')}>Annulla</Button>
            <Button type="submit" variant="contained" disabled={caricando || salvando || !fornitoreId}>
              {salvando ? 'Salvataggio...' : 'Crea ordine'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}
