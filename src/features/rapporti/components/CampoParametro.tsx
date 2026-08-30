import {
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import type { OpzioneParametro, ParametroRapporto } from '../types/rapporto'

export type ValoreParametro = string | boolean

export default function CampoParametro({
  parametro,
  valore,
  opzioni,
  onChange,
  idPrefix = 'rapporto',
  compatto = false,
}: {
  parametro: ParametroRapporto
  valore: ValoreParametro
  opzioni: OpzioneParametro[]
  onChange: (valore: ValoreParametro) => void
  idPrefix?: string
  compatto?: boolean
}) {
  if (parametro.tipo === 'BOOLEANO') {
    return (
      <FormControlLabel
        control={(
          <Checkbox
            checked={Boolean(valore)}
            onChange={(event) => onChange(event.target.checked)}
            size={compatto ? 'small' : 'medium'}
          />
        )}
        label={parametro.etichetta}
      />
    )
  }

  if (parametro.tipo === 'SELEZIONE') {
    const labelId = `${idPrefix}-parametro-${parametro.nome}`
    return (
      <FormControl fullWidth required={parametro.obbligatorio} size={compatto ? 'small' : 'medium'}>
        <InputLabel id={labelId}>{parametro.etichetta}</InputLabel>
        <Select
          labelId={labelId}
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
      size={compatto ? 'small' : 'medium'}
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
