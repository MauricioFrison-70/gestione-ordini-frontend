import type { Cell, SheetData } from 'write-excel-file/browser'
import type { ColonnaRapporto, Rapporto, RisultatoRapporto } from '../types/rapporto'

const valuta = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })
const decimale = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 4 })
const data = new Intl.DateTimeFormat('it-IT')
const dataOra = new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' })

function dataLocale(valore: unknown): Date {
  const testo = String(valore)
  if (/^\d{4}-\d{2}-\d{2}$/.test(testo)) {
    const [anno, mese, giorno] = testo.split('-').map(Number)
    return new Date(anno, mese - 1, giorno)
  }
  return new Date(testo)
}

export function mostraValoreRapporto(valore: unknown, colonna: ColonnaRapporto): string {
  if (valore === null || valore === undefined || valore === '') return '—'
  if (colonna.formato === 'VALUTA') return valuta.format(Number(valore))
  if (colonna.formato === 'DATA_ORA' || colonna.tipo === 'DATA_ORA') {
    return dataOra.format(dataLocale(valore))
  }
  if (colonna.formato === 'DATA' || colonna.tipo === 'DATA') {
    return data.format(dataLocale(valore))
  }
  if (colonna.tipo === 'DECIMALE') return decimale.format(Number(valore))
  if (colonna.tipo === 'BOOLEANO') return valore ? 'Sì' : 'No'
  return String(valore)
}

function nomeBaseFile(rapporto: Rapporto): string {
  const nome = rapporto.titolo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
  return nome || `rapporto_${rapporto.id}`
}

function valoreExcel(valore: unknown, colonna: ColonnaRapporto): Cell {
  if (valore === null || valore === undefined || valore === '') return null
  if (colonna.formato === 'VALUTA') {
    return { value: Number(valore), type: Number, format: '€ #,##0.00', align: 'right' }
  }
  if (colonna.formato === 'DATA_ORA' || colonna.tipo === 'DATA_ORA') {
    return { value: dataLocale(valore), type: Date, format: 'dd/mm/yyyy hh:mm' }
  }
  if (colonna.formato === 'DATA' || colonna.tipo === 'DATA') {
    return { value: dataLocale(valore), type: Date, format: 'dd/mm/yyyy' }
  }
  if (colonna.tipo === 'INTERO') {
    return { value: Number(valore), type: Number, format: '#,##0', align: 'right' }
  }
  if (colonna.tipo === 'DECIMALE') {
    return { value: Number(valore), type: Number, format: '#,##0.00##', align: 'right' }
  }
  if (colonna.tipo === 'BOOLEANO') return { value: Boolean(valore), type: Boolean }
  return { value: String(valore), type: String, format: '@', wrap: true }
}

function indiceEtichettaTotali(colonne: ColonnaRapporto[]): number {
  const primaColonnaTotalizzata = colonne.findIndex((colonna) => colonna.totalizzare)
  if (primaColonnaTotalizzata > 0) return primaColonnaTotalizzata - 1
  return colonne.findIndex((colonna) => !colonna.totalizzare)
}

function rigaTotaliTesto(risultato: RisultatoRapporto): string[] | null {
  if (!risultato.colonne.some((colonna) => colonna.totalizzare)) return null
  const indiceEtichetta = indiceEtichettaTotali(risultato.colonne)
  return risultato.colonne.map((colonna, indice) => {
    if (colonna.totalizzare) {
      return mostraValoreRapporto(risultato.totali[colonna.nome] ?? 0, colonna)
    }
    return indice === indiceEtichetta ? 'Totale' : ''
  })
}

function larghezzaColonna(colonna: ColonnaRapporto, risultato: RisultatoRapporto): number {
  const lunghezzaMassima = calcolaLunghezzaMassima(risultato, colonna)
  return Math.min(35, Math.max(12, lunghezzaMassima + 2))
}

function calcolaLunghezzaMassima(risultato: RisultatoRapporto, colonna: ColonnaRapporto): number {
  return risultato.righe.slice(0, 100).reduce(
    (massimo, riga) => Math.max(massimo, mostraValoreRapporto(riga[colonna.nome], colonna).length),
    colonna.etichetta.length,
  )
}

export async function esportareRapportoExcel(
  rapporto: Rapporto,
  risultato: RisultatoRapporto,
): Promise<void> {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const numeroColonne = Math.max(1, risultato.colonne.length)
  const titolo: SheetData[number] = [
    {
      value: rapporto.titolo,
      columnSpan: numeroColonne,
      fontSize: 16,
      fontWeight: 'bold',
      textColor: '#FFFFFF',
      backgroundColor: '#1565C0',
      height: 28,
      alignVertical: 'center',
    },
    ...Array.from({ length: numeroColonne - 1 }, () => null),
  ]
  const informazione: SheetData[number] = [
    {
      value: `Generato il ${dataOra.format(new Date())} - ${risultato.totaleRighe} righe`,
      columnSpan: numeroColonne,
      fontStyle: 'italic',
      textColor: '#455A64',
    },
    ...Array.from({ length: numeroColonne - 1 }, () => null),
  ]
  const intestazione: SheetData[number] = risultato.colonne.map((colonna) => ({
    value: colonna.etichetta,
    fontWeight: 'bold',
    textColor: '#FFFFFF',
    backgroundColor: '#1976D2',
    borderColor: '#B0BEC5',
    borderStyle: 'thin',
    align: colonna.formato === 'VALUTA' ? 'right' : 'left',
    wrap: true,
  }))
  const righe: SheetData = risultato.righe.map((riga, indice) =>
    risultato.colonne.map((colonna) => {
      const cella = valoreExcel(riga[colonna.nome], colonna)
      if (cella && typeof cella === 'object' && !(cella instanceof Date)) {
        return {
          ...cella,
          backgroundColor: indice % 2 === 1 ? '#F3F6F8' : '#FFFFFF',
          borderColor: '#CFD8DC',
          borderStyle: 'thin',
          alignVertical: 'top',
        }
      }
      return cella
    }),
  )
  const indiceEtichetta = indiceEtichettaTotali(risultato.colonne)
  const rigaTotali: SheetData[number] | null = risultato.colonne.some(
    (colonna) => colonna.totalizzare,
  )
    ? risultato.colonne.map((colonna, indice) => {
      const cella = colonna.totalizzare
        ? valoreExcel(risultato.totali[colonna.nome] ?? 0, colonna)
        : { value: indice === indiceEtichetta ? 'Totale' : '', type: String }
      return cella === null ? null : {
        ...cella,
        fontWeight: 'bold',
        backgroundColor: '#E3F2FD',
        borderColor: '#90A4AE',
        borderStyle: 'thin',
      }
    })
    : null

  await writeExcelFile([
    titolo,
    informazione,
    [],
    intestazione,
    ...righe,
    ...(rigaTotali ? [rigaTotali] : []),
  ], {
    sheet: 'Rapporto',
    columns: risultato.colonne.map((colonna) => ({ width: larghezzaColonna(colonna, risultato) })),
    stickyRowsCount: 4,
    showGridLines: false,
  }).toFile(`${nomeBaseFile(rapporto)}.xlsx`)
}

export async function esportareRapportoPdf(
  rapporto: Rapporto,
  risultato: RisultatoRapporto,
): Promise<void> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const orientamento = risultato.colonne.length > 5 ? 'landscape' : 'portrait'
  const documento = new jsPDF({ orientation: orientamento, unit: 'mm', format: 'a4' })
  documento.setFont('helvetica', 'bold')
  documento.setFontSize(16)
  documento.text(rapporto.titolo, 14, 17)
  documento.setFont('helvetica', 'normal')
  documento.setFontSize(9)
  documento.setTextColor(90)
  documento.text(
    `Generato il ${dataOra.format(new Date())} - ${risultato.totaleRighe} righe`,
    14,
    24,
  )

  const rigaTotali = rigaTotaliTesto(risultato)

  autoTable(documento, {
    startY: 30,
    head: [risultato.colonne.map((colonna) => colonna.etichetta)],
    body: risultato.righe.map((riga) =>
      risultato.colonne.map((colonna) =>
        mostraValoreRapporto(riga[colonna.nome], colonna).replaceAll('—', '-'))),
    foot: rigaTotali ? [rigaTotali] : undefined,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: risultato.colonne.length > 7 ? 6.5 : 8,
      cellPadding: 2,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [227, 242, 253], textColor: 30, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [243, 246, 248] },
    columnStyles: Object.fromEntries(
      risultato.colonne
        .map((colonna, indice) => ({ colonna, indice }))
        .filter(({ colonna }) => colonna.formato === 'VALUTA' || colonna.totalizzare)
        .map(({ indice }) => [indice, { halign: 'right' as const }]),
    ),
    margin: { top: 30, right: 10, bottom: 15, left: 10 },
    didDrawPage: ({ pageNumber }) => {
      const altezzaPagina = documento.internal.pageSize.getHeight()
      documento.setFontSize(8)
      documento.setTextColor(100)
      documento.text(`Pagina ${pageNumber}`, documento.internal.pageSize.getWidth() - 25, altezzaPagina - 7)
    },
  })

  documento.save(`${nomeBaseFile(rapporto)}.pdf`)
}
