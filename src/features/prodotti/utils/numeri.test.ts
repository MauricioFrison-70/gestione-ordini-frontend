import { describe, expect, it } from 'vitest'
import {
  accettareInputDecimale,
  accettareInputIntero,
  convertireDecimale,
  decimaleValido,
  formattareDecimale,
  interoValido,
} from './numeri'

describe('numeri', () => {
  it('accetta valori decimali con virgola e al massimo due case decimali', () => {
    expect(accettareInputDecimale('12345678,99')).toBe(true)
    expect(decimaleValido('1,50')).toBe(true)
    expect(decimaleValido('0')).toBe(true)
  })

  it('rifiuta punto, più di due decimali e più di otto cifre intere', () => {
    expect(accettareInputDecimale('1.50')).toBe(false)
    expect(accettareInputDecimale('1,500')).toBe(false)
    expect(accettareInputDecimale('123456789')).toBe(false)
    expect(decimaleValido('1,')).toBe(false)
  })

  it('accetta soltanto numeri interi non negativi per quantità e scorta', () => {
    expect(accettareInputIntero('250')).toBe(true)
    expect(interoValido('0')).toBe(true)
    expect(accettareInputIntero('2,5')).toBe(false)
    expect(accettareInputIntero('2.5')).toBe(false)
    expect(interoValido('')).toBe(false)
  })

  it('converte il separatore decimale per la API e lo formatta per la UI', () => {
    expect(convertireDecimale('1,50')).toBe(1.5)
    expect(formattareDecimale(3.25)).toBe('3,25')
  })
})
