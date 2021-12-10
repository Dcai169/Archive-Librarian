import { SheetResponder } from './SheetResponder'
import { Entry, warframeEntry } from '../types'
import * as levenshtien from 'damerau-levenshtein'

export class WarframeSheetResponder extends SheetResponder {
  entries: warframeEntry[]

  constructor() {
    super('Warframe', '12GEPZuEBhQozCZjTTYMAQzK9iqAHuOC6zzr_cn5mi8o')

    this.entries = []
    this.loadEntries()
  }

  async loadEntries(): Promise<void> {
    this.entries = [] // clear entries
    this.loading = true // set semaphore

    let doc = this.getSheetObject() // load document object
    await doc.loadInfo()

    let sheet = doc.sheetsByIndex[0]; // load sheet object
    await sheet.loadCells('A1:G77')

    for (let row = 1; row < 77; row++) {
      this.entries.push({
        name: sheet.getCell(row, 0).formattedValue as string,
        link: sheet.getCell(row, 3).hyperlink,
        sfm1: sheet.getCell(row, 4).hyperlink,
        sfm2: sheet.getCell(row, 5).hyperlink,
        sfm3: sheet.getCell(row, 6).hyperlink
      })
    }

    this.loading = false; // clear semaphore
    return Promise.resolve()
  }

  // filter items by Levenshtein distance
  static itemFilter(this: string, item: Entry): boolean {
    return levenshtien(this.toLowerCase(), item.name.toLowerCase()).similarity > 0.7
  }
  
  search(query: string): Entry[] {
    if (this.loading) return []
    return this.entries.filter(WarframeSheetResponder.itemFilter, query)
  }

  generateFullyQualifiedName(entry: Entry): string {
    return `${entry.name}`.trim()
  }

  generateResponse(matchingEntries: Entry[], generateResponseLine: (entry: Entry, name: string) => string): string {
    return super.generateResponse(matchingEntries, generateResponseLine)
  }
}