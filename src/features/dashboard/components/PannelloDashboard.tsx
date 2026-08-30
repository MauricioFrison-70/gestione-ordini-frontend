import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BarChartIcon from '@mui/icons-material/BarChart'
import DonutLargeIcon from '@mui/icons-material/DonutLarge'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material'
import { elencareOpzioniParametro, eseguireRapporto } from '../../../services/rapportoService'
import CampoParametro from '../../rapporti/components/CampoParametro'
import type { ValoreParametro } from '../../rapporti/components/CampoParametro'
import type { OpzioneParametro, Rapporto, RisultatoRapporto } from '../../rapporti/types/rapporto'
import type {
  ConfigurazionePannello,
  IntervalloAggiornamento,
  TipoGrafico,
} from '../types/dashboard'
import GraficoRapporto from './GraficoRapporto'

function formattareDataLocale(data: Date): string {
  const anno = data.getFullYear()
  const mese = String(data.getMonth() + 1).padStart(2, '0')
  const giorno = String(data.getDate()).padStart(2, '0')
  return `${anno}-${mese}-${giorno}`
}

function valoriIniziali(
  rapporto: Rapporto,
  salvati: Record<string, ValoreParametro> | undefined,
): Record<string, ValoreParametro> {
  const oggi = new Date()
  const inizioPeriodo = new Date(oggi.getFullYear(), oggi.getMonth() - 11, 1)

  return Object.fromEntries(rapporto.parametri.map((parametro) => {
    if (salvati && Object.hasOwn(salvati, parametro.nome)) {
      return [parametro.nome, salvati[parametro.nome]]
    }
    if (parametro.tipo === 'BOOLEANO') {
      return [parametro.nome, parametro.valorePredefinito?.toLowerCase() === 'true']
    }
    if (parametro.valorePredefinito !== null) {
      return [parametro.nome, parametro.valorePredefinito]
    }
    if (parametro.tipo === 'DATA' && /inizio/i.test(parametro.nome)) {
      return [parametro.nome, formattareDataLocale(inizioPeriodo)]
    }
    if (parametro.tipo === 'DATA' && /fine/i.test(parametro.nome)) {
      return [parametro.nome, formattareDataLocale(oggi)]
    }
    return [parametro.nome, '']
  }))
}

function parametriRichiesta(
  rapporto: Rapporto,
  valori: Record<string, ValoreParametro>,
): Record<string, unknown> {
  return Object.fromEntries(rapporto.parametri.map((parametro) => [
    parametro.nome,
    valori[parametro.nome] === '' ? null : valori[parametro.nome],
  ]))
}

function parametroMancante(rapporto: Rapporto, valori: Record<string, ValoreParametro>) {
  return rapporto.parametri.find((parametro) =>
    parametro.obbligatorio
      && (valori[parametro.nome] === '' || valori[parametro.nome] === undefined))
}

export default function PannelloDashboard({
  indice,
  rapporti,
  configurazione,
  onChange,
}: {
  indice: number
  rapporti: Rapporto[]
  configurazione: ConfigurazionePannello
  onChange: (configurazione: ConfigurazionePannello) => void
}) {
  const [valori, setValori] = useState<Record<string, ValoreParametro>>({})
  const [opzioni, setOpzioni] = useState<Record<string, OpzioneParametro[]>>({})
  const [risultato, setRisultato] = useState<RisultatoRapporto | null>(null)
  const [eseguendo, setEseguendo] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [ultimoAggiornamento, setUltimoAggiornamento] = useState<Date | null>(null)
  const esecuzioneInCorso = useRef(false)
  const componenteMontato = useRef(true)

  const rapporto = useMemo(
    () => rapporti.find((corrente) => corrente.codice === configurazione.rapportoCodice) ?? null,
    [configurazione.rapportoCodice, rapporti],
  )

  useEffect(() => {
    componenteMontato.current = true
    return () => { componenteMontato.current = false }
  }, [])

  const eseguireConValori = useCallback(async (
    rapportoDaEseguire: Rapporto,
    valoriDaEseguire: Record<string, ValoreParametro>,
  ) => {
    if (esecuzioneInCorso.current) return
    esecuzioneInCorso.current = true
    setEseguendo(true)
    setErrore(null)
    try {
      const esecuzione = await eseguireRapporto(
        rapportoDaEseguire.id,
        parametriRichiesta(rapportoDaEseguire, valoriDaEseguire),
      )
      if (componenteMontato.current) {
        setRisultato(esecuzione)
        setUltimoAggiornamento(new Date())
      }
    } catch (causa) {
      if (componenteMontato.current) {
        setErrore(causa instanceof Error ? causa.message : "Errore nell'esecuzione del rapporto")
      }
    } finally {
      esecuzioneInCorso.current = false
      if (componenteMontato.current) setEseguendo(false)
    }
  }, [])

  useEffect(() => {
    if (!rapporto) return
    let attivo = true
    const iniziali = valoriIniziali(
      rapporto,
      configurazione.parametriPerRapporto[rapporto.codice],
    )

    const inizializzare = async () => {
      try {
        await Promise.resolve()
        if (!attivo) return
        setValori(iniziali)
        setOpzioni({})
        setRisultato(null)
        setErrore(null)
        setUltimoAggiornamento(null)

        const parametriConOpzioni = rapporto.parametri.filter((parametro) => parametro.haOpzioni)
        const elenchi = await Promise.all(parametriConOpzioni.map(async (parametro) => ({
          nome: parametro.nome,
          valori: await elencareOpzioniParametro(rapporto.id, parametro.nome),
        })))
        if (!attivo) return
        setOpzioni(Object.fromEntries(elenchi.map((elenco) => [elenco.nome, elenco.valori])))

        if (!parametroMancante(rapporto, iniziali)) {
          await eseguireConValori(rapporto, iniziali)
        }
      } catch (causa) {
        if (attivo) {
          setErrore(causa instanceof Error ? causa.message : "Errore nell'esecuzione del rapporto")
        }
      } finally { /* lo stato di esecuzione è gestito da eseguireConValori */ }
    }

    void inizializzare()
    return () => { attivo = false }
    // La configurazione dei parametri viene letta soltanto quando cambia rapporto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eseguireConValori, rapporto])

  useEffect(() => {
    if (!rapporto || configurazione.intervalloAggiornamento === 0) return

    const aggiornareSeVisibile = () => {
      if (document.visibilityState === 'visible' && !parametroMancante(rapporto, valori)) {
        void eseguireConValori(rapporto, valori)
      }
    }
    const timer = window.setInterval(
      aggiornareSeVisibile,
      configurazione.intervalloAggiornamento * 1000,
    )
    const gestireVisibilita = () => {
      if (document.visibilityState === 'visible') aggiornareSeVisibile()
    }
    document.addEventListener('visibilitychange', gestireVisibilita)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', gestireVisibilita)
    }
  }, [configurazione.intervalloAggiornamento, eseguireConValori, rapporto, valori])

  const modificareParametro = (nome: string, valore: ValoreParametro) => {
    if (!rapporto) return
    const nuoviValori = { ...valori, [nome]: valore }
    setValori(nuoviValori)
    onChange({
      ...configurazione,
      parametriPerRapporto: {
        ...configurazione.parametriPerRapporto,
        [rapporto.codice]: nuoviValori,
      },
    })
  }

  const eseguire = () => {
    if (!rapporto) return
    const mancante = parametroMancante(rapporto, valori)
    if (mancante) {
      setErrore(`Il parametro '${mancante.etichetta}' è obbligatorio`)
      return
    }

    void eseguireConValori(rapporto, valori)
  }

  const cambiareTipoGrafico = (tipoGrafico: TipoGrafico) => {
    onChange({ ...configurazione, tipoGrafico })
  }

  const cambiareIntervallo = (intervalloAggiornamento: IntervalloAggiornamento) => {
    onChange({ ...configurazione, intervalloAggiornamento })
  }

  return (
    <Paper
      data-testid={`dashboard-panel-${indice}`}
      elevation={4}
      sx={{
        height: '100%',
        minHeight: { xs: 420, lg: 0 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        overflow: 'auto',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {configurazione.tipoGrafico === 'BARRE'
          ? <BarChartIcon color="primary" />
          : <DonutLargeIcon color="primary" />}
        <Typography variant="h2" sx={{ fontSize: '1.15rem', mb: 0 }}>
          Dashboard {indice}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.4fr 0.8fr 0.8fr' }, gap: 1.5 }}>
        <FormControl fullWidth size="small">
          <InputLabel id={`dashboard-${indice}-rapporto-label`}>Rapporto</InputLabel>
          <Select
            labelId={`dashboard-${indice}-rapporto-label`}
            label="Rapporto"
            value={configurazione.rapportoCodice}
            onChange={(event) => onChange({
              ...configurazione,
              rapportoCodice: String(event.target.value),
            })}
          >
            {rapporti.map((corrente) => (
              <MenuItem key={corrente.codice} value={corrente.codice}>{corrente.titolo}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel id={`dashboard-${indice}-grafico-label`}>Tipo di grafico</InputLabel>
          <Select
            labelId={`dashboard-${indice}-grafico-label`}
            label="Tipo di grafico"
            value={configurazione.tipoGrafico}
            onChange={(event) => cambiareTipoGrafico(event.target.value as TipoGrafico)}
          >
            <MenuItem value="BARRE">Grafico a barre</MenuItem>
            <MenuItem value="TORTA">Grafico a torta</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel id={`dashboard-${indice}-aggiornamento-label`}>Aggiornamento</InputLabel>
          <Select
            labelId={`dashboard-${indice}-aggiornamento-label`}
            label="Aggiornamento"
            value={configurazione.intervalloAggiornamento}
            onChange={(event) => cambiareIntervallo(
              Number(event.target.value) as IntervalloAggiornamento,
            )}
          >
            <MenuItem value={0}>Disattivato</MenuItem>
            <MenuItem value={30}>30 secondi</MenuItem>
            <MenuItem value={60}>1 minuto</MenuItem>
            <MenuItem value={300}>5 minuti</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {rapporto && rapporto.parametri.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 1 }}>
          {rapporto.parametri.map((parametro) => (
            <CampoParametro
              key={parametro.nome}
              parametro={parametro}
              valore={valori[parametro.nome] ?? ''}
              opzioni={opzioni[parametro.nome] ?? []}
              idPrefix={`dashboard-${indice}`}
              compatto
              onChange={(valore) => modificareParametro(parametro.nome, valore)}
            />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={eseguendo ? <CircularProgress color="inherit" size={16} /> : <PlayArrowIcon />}
          disabled={eseguendo || !rapporto}
          onClick={eseguire}
          sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Aggiorna grafico
        </Button>
        <Box sx={{ minWidth: 0 }}>
          {rapporto?.descrizione && (
            <Typography variant="caption" color="text.secondary" noWrap title={rapporto.descrizione} sx={{ display: 'block' }}>
              {rapporto.descrizione}
            </Typography>
          )}
          {ultimoAggiornamento && (
            <Typography variant="caption" color="success.light" sx={{ display: 'block' }}>
              Ultimo aggiornamento: {ultimoAggiornamento.toLocaleTimeString('it-IT')}
            </Typography>
          )}
        </Box>
      </Box>

      {errore && <Alert severity="error" onClose={() => setErrore(null)}>{errore}</Alert>}
      <Box sx={{ flex: 1, minHeight: 220, display: 'grid', alignItems: 'center' }}>
        {eseguendo && !risultato && <Box sx={{ textAlign: 'center' }}><CircularProgress /></Box>}
        {!eseguendo && !risultato && !errore && (
          <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
            Seleziona il rapporto e aggiorna il grafico.
          </Typography>
        )}
        {risultato && <GraficoRapporto risultato={risultato} tipo={configurazione.tipoGrafico} />}
      </Box>
    </Paper>
  )
}
