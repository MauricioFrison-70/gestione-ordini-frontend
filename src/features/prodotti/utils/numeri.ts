export const MASSIMO_CIFRE_INTERE_DECIMALE = 8
export const MASSIMO_CIFRE_DECIMALI = 2

const formatoDecimaleDuranteInserimento = new RegExp(
  `^\\d{0,${MASSIMO_CIFRE_INTERE_DECIMALE}}(,\\d{0,${MASSIMO_CIFRE_DECIMALI}})?$`,
)
const formatoDecimaleValido = new RegExp(
  `^\\d{1,${MASSIMO_CIFRE_INTERE_DECIMALE}}(,\\d{1,${MASSIMO_CIFRE_DECIMALI}})?$`,
)

export function accettareInputDecimale(valore: string): boolean {
  return formatoDecimaleDuranteInserimento.test(valore)
}

export function decimaleValido(valore: string): boolean {
  return formatoDecimaleValido.test(valore)
}

export function accettareInputIntero(valore: string): boolean {
  return /^\d*$/.test(valore)
}

export function normalizzareInputIntero(valore: string): string {
  return valore.replace(/\D/g, '')
}

export function interoValido(valore: string): boolean {
  return /^\d+$/.test(valore)
}

export function convertireDecimale(valore: string): number {
  return Number(valore.replace(',', '.'))
}

export function formattareDecimale(valore: number): string {
  return String(valore).replace('.', ',')
}
