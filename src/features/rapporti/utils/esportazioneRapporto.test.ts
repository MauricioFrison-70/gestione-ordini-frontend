import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SheetData } from 'write-excel-file/browser'
import type { Rapporto, RisultatoRapporto } from '../types/rapporto'
import {
  esportareRapportoExcel,
  esportareRapportoPdf,
  mostraValoreRapporto,
} from './esportazioneRapporto'

const dipendenze = vi.hoisted(() => {
  const toFile = vi.fn().mockResolvedValue(undefined)
  const writeExcelFile = vi.fn((_dati: unknown, _opzioni?: unknown) => ({ toFile }))
  const documento = {
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
    internal: {
      pageSize: {
        getHeight: vi.fn(() => 210),
        getWidth: vi.fn(() => 297),
      },
    },
  }
  const jsPDF = vi.fn(function () { return documento })
  const autoTable = vi.fn()
  return { toFile, writeExcelFile, documento, jsPDF, autoTable }
})

vi.mock('write-excel-file/browser', () => ({ default: dipendenze.writeExcelFile }))
vi.mock('jspdf', () => ({ jsPDF: dipendenze.jsPDF }))
vi.mock('jspdf-autotable', () => ({ autoTable: dipendenze.autoTable }))

const rapporto: Rapporto = {
  id: 1,
  codice: 'VENDITE',
  titolo: 'Vendite per periodo',
  descrizione: null,
  attivo: true,
  parametri: [],
}

const risultato: RisultatoRapporto = {
  colonne: [
    { nome: 'numero', etichetta: 'Numero', tipo: 'TESTO', formato: null, totalizzare: false },
    { nome: 'data', etichetta: 'Data', tipo: 'DATA', formato: 'DATA', totalizzare: false },
    { nome: 'totale', etichetta: 'Totale', tipo: 'DECIMALE', formato: 'VALUTA', totalizzare: true },
  ],
  righe: [{ numero: 'OV-1', data: '2026-08-26', totale: 1234.5 }],
  totali: { totale: 1234.5 },
  totaleRighe: 1,
  troncato: false,
}

describe('esportazioneRapporto', () => {
  beforeEach(() => vi.clearAllMocks())

  it('formatta i valori in base ai metadati del rapporto', () => {
    expect(mostraValoreRapporto(1234.5, risultato.colonne[2])).toContain('1234,50')
    expect(mostraValoreRapporto('2026-08-26', risultato.colonne[1])).toBe('26/08/2026')
    expect(mostraValoreRapporto(null, risultato.colonne[0])).toBe('—')
  })

  it('genera un file Excel con titolo, intestazioni e valori tipizzati', async () => {
    await esportareRapportoExcel(rapporto, risultato)

    expect(dipendenze.writeExcelFile).toHaveBeenCalledOnce()
    const dati = dipendenze.writeExcelFile.mock.calls[0][0] as SheetData
    expect(dati[0][0]).toEqual(expect.objectContaining({ value: 'Vendite per periodo' }))
    expect(dati[3].map((cella) =>
      cella && typeof cella === 'object' && 'value' in cella ? cella.value : cella,
    )).toEqual(['Numero', 'Data', 'Totale'])
    expect(dati[3][2]).toEqual(expect.objectContaining({ align: 'right' }))
    expect(dati[4][1]).toEqual(expect.objectContaining({ type: Date, format: 'dd/mm/yyyy' }))
    expect(dati[4][2]).toEqual(expect.objectContaining({ type: Number, format: '€ #,##0.00' }))
    expect(dati[5][1]).toEqual(expect.objectContaining({ value: 'Totale', fontWeight: 'bold' }))
    expect(dati[5][2]).toEqual(expect.objectContaining({ value: 1234.5, fontWeight: 'bold' }))
    expect(dipendenze.toFile).toHaveBeenCalledWith('vendite_per_periodo.xlsx')
  })

  it('genera un PDF con la tabella e salva il file', async () => {
    await esportareRapportoPdf(rapporto, risultato)

    expect(dipendenze.jsPDF).toHaveBeenCalledWith({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    expect(dipendenze.autoTable).toHaveBeenCalledWith(
      dipendenze.documento,
      expect.objectContaining({
        head: [['Numero', 'Data', 'Totale']],
        body: [['OV-1', '26/08/2026', expect.stringContaining('1234,50')]],
        foot: [['', 'Totale', expect.stringContaining('1234,50')]],
        columnStyles: { 2: { halign: 'right' } },
      }),
    )
    expect(dipendenze.documento.save).toHaveBeenCalledWith('vendite_per_periodo.pdf')
  })
})
