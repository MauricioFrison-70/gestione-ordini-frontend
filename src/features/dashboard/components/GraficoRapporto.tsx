import { Alert, Box, Typography } from '@mui/material'
import type { ColonnaRapporto, RisultatoRapporto } from '../../rapporti/types/rapporto'
import type { TipoGrafico } from '../types/dashboard'

const COLORI = [
  '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#ef5350', '#26c6da',
  '#d4e157', '#7e57c2', '#ec407a', '#78909c', '#29b6f6', '#9ccc65',
]
const NUMERO_MASSIMO_CATEGORIE = 12

interface DatoGrafico {
  etichetta: string
  valore: number
}

interface SerieGrafico {
  dati: DatoGrafico[]
  colonnaCategoria: ColonnaRapporto
  colonnaValore: ColonnaRapporto
  troncata: boolean
}

function colonnaNumerica(colonna: ColonnaRapporto): boolean {
  return /int|decimal|numeric|money|float|double|real|number/i.test(colonna.tipo)
}

function creareSerieGrafico(risultato: RisultatoRapporto): SerieGrafico | null {
  const colonnaValore = risultato.colonne.find((colonna) => colonna.formato === 'VALUTA')
    ?? risultato.colonne.find((colonna) => colonna.totalizzare)
    ?? risultato.colonne.find(colonnaNumerica)
  if (!colonnaValore) return null

  const colonnaCategoria = risultato.colonne.find((colonna) =>
    colonna.nome !== colonnaValore.nome && !colonnaNumerica(colonna))
    ?? risultato.colonne.find((colonna) => colonna.nome !== colonnaValore.nome)
  if (!colonnaCategoria) return null

  const tuttiDati = risultato.righe
    .map((riga) => ({
      etichetta: String(riga[colonnaCategoria.nome] ?? '—'),
      valore: Number(riga[colonnaValore.nome]),
    }))
    .filter((dato) => Number.isFinite(dato.valore))

  return {
    dati: tuttiDati.slice(0, NUMERO_MASSIMO_CATEGORIE),
    colonnaCategoria,
    colonnaValore,
    troncata: tuttiDati.length > NUMERO_MASSIMO_CATEGORIE,
  }
}

function formattareValore(valore: number, colonna: ColonnaRapporto): string {
  if (colonna.formato === 'VALUTA') {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(valore)
  }
  return new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(valore)
}

function GraficoBarre({ serie }: { serie: SerieGrafico }) {
  const larghezza = 560
  const altezza = 300
  const margine = { sopra: 18, destra: 64, sotto: 90, sinistra: 64 }
  const larghezzaUtile = larghezza - margine.sinistra - margine.destra
  const altezzaUtile = altezza - margine.sopra - margine.sotto
  const massimo = Math.max(...serie.dati.map((dato) => dato.valore), 0)
  const passo = larghezzaUtile / Math.max(serie.dati.length, 1)
  const larghezzaBarra = Math.min(38, passo * 0.62)

  return (
    <svg
      role="img"
      aria-label={`Grafico a barre: ${serie.colonnaValore.etichetta} per ${serie.colonnaCategoria.etichetta}`}
      viewBox={`0 0 ${larghezza} ${altezza}`}
      width="100%"
      style={{ display: 'block', minHeight: 220 }}
    >
      {[0, 0.5, 1].map((percentuale) => {
        const y = margine.sopra + altezzaUtile * (1 - percentuale)
        return (
          <g key={percentuale}>
            <line x1={margine.sinistra} x2={larghezza - margine.destra} y1={y} y2={y}
              stroke="rgba(255,255,255,0.12)" />
            <text x={margine.sinistra - 8} y={y + 4} textAnchor="end" fill="#b0bec5" fontSize="11">
              {formattareValore(massimo * percentuale, serie.colonnaValore)}
            </text>
          </g>
        )
      })}
      {serie.dati.map((dato, indice) => {
        const altezzaBarra = massimo === 0 ? 0 : (dato.valore / massimo) * altezzaUtile
        const x = margine.sinistra + indice * passo + (passo - larghezzaBarra) / 2
        const y = margine.sopra + altezzaUtile - altezzaBarra
        return (
          <g key={`${dato.etichetta}-${indice}`}>
            <rect x={x} y={y} width={larghezzaBarra} height={altezzaBarra} rx="5"
              fill={COLORI[indice % COLORI.length]}>
              <title>{`${dato.etichetta}: ${formattareValore(dato.valore, serie.colonnaValore)}`}</title>
            </rect>
            <text
              x={x + larghezzaBarra / 2}
              y={altezza - 18}
              textAnchor="start"
              transform={`rotate(-58 ${x + larghezzaBarra / 2} ${altezza - 18})`}
              fill="#cfd8dc"
              fontSize="10"
            >
              {dato.etichetta}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function puntoPolare(cx: number, cy: number, raggio: number, angolo: number) {
  const radianti = ((angolo - 90) * Math.PI) / 180
  return { x: cx + raggio * Math.cos(radianti), y: cy + raggio * Math.sin(radianti) }
}

function arco(cx: number, cy: number, raggio: number, inizio: number, fine: number): string {
  const puntoIniziale = puntoPolare(cx, cy, raggio, fine)
  const puntoFinale = puntoPolare(cx, cy, raggio, inizio)
  const grande = fine - inizio <= 180 ? 0 : 1
  return `M ${cx} ${cy} L ${puntoIniziale.x} ${puntoIniziale.y} A ${raggio} ${raggio} 0 ${grande} 0 ${puntoFinale.x} ${puntoFinale.y} Z`
}

function GraficoTorta({ serie }: { serie: SerieGrafico }) {
  const datiPositivi = serie.dati.filter((dato) => dato.valore > 0)
  const totale = datiPositivi.reduce((somma, dato) => somma + dato.valore, 0)
  let angolo = 0

  if (totale === 0) return <Alert severity="info">Nessun valore positivo da rappresentare.</Alert>

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(180px, 0.8fr) 1.2fr' }, gap: 2, alignItems: 'center' }}>
      <svg
        role="img"
        aria-label={`Grafico a torta: ${serie.colonnaValore.etichetta} per ${serie.colonnaCategoria.etichetta}`}
        viewBox="0 0 240 240"
        width="100%"
        style={{ display: 'block', maxHeight: 230 }}
      >
        {datiPositivi.length === 1
          ? <circle cx="120" cy="120" r="100" fill={COLORI[0]} />
          : datiPositivi.map((dato, indice) => {
              const inizio = angolo
              const fine = angolo + (dato.valore / totale) * 360
              angolo = fine
              return (
                <path key={`${dato.etichetta}-${indice}`} d={arco(120, 120, 100, inizio, fine)}
                  fill={COLORI[indice % COLORI.length]} stroke="#1e1e1e" strokeWidth="2">
                  <title>{`${dato.etichetta}: ${formattareValore(dato.valore, serie.colonnaValore)}`}</title>
                </path>
              )
            })}
        <circle cx="120" cy="120" r="49" fill="#1e1e1e" />
        <text x="120" y="116" textAnchor="middle" fill="#b0bec5" fontSize="12">Totale</text>
        <text x="120" y="137" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">
          {formattareValore(totale, serie.colonnaValore)}
        </text>
      </svg>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 0.75 }}>
        {datiPositivi.map((dato, indice) => (
          <Box key={`${dato.etichetta}-${indice}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', flex: '0 0 auto', bgcolor: COLORI[indice % COLORI.length] }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" noWrap sx={{ display: 'block' }}>{dato.etichetta}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {formattareValore(dato.valore, serie.colonnaValore)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default function GraficoRapporto({ risultato, tipo }: {
  risultato: RisultatoRapporto
  tipo: TipoGrafico
}) {
  const serie = creareSerieGrafico(risultato)
  if (!serie || serie.dati.length === 0) {
    return <Alert severity="info">Il rapporto non contiene dati adatti a un grafico.</Alert>
  }

  return (
    <Box sx={{ minHeight: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {serie.colonnaValore.etichetta} per {serie.colonnaCategoria.etichetta}
      </Typography>
      {tipo === 'BARRE' ? <GraficoBarre serie={serie} /> : <GraficoTorta serie={serie} />}
      {serie.troncata && (
        <Typography variant="caption" color="warning.main">
          Il grafico mostra le prime {NUMERO_MASSIMO_CATEGORIE} categorie del rapporto.
        </Typography>
      )}
    </Box>
  )
}
