import { GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { destinyEntry, Entry, GenderUnion, DestinyClassUnion } from "src/types";
import { SheetResponder } from "./SheetResponder";
import * as levenshtien from 'damerau-levenshtein'
import { destiny } from '../config/query_overrides.json'
import { BaseResponder } from "./BaseResponder";

export class DestinySheetResponder extends SheetResponder {
    entries: Map<string, destinyEntry[]>;

    constructor(){
        super('Destiny', '18-pxaUaUvYxACE5uMveCE9_bewwhfbd93ZaLIyP_rxQ');

        this.entries = new Map([
            ['hunterArmor', []],
            ['titanArmor', []],
            ['warlockArmor', []],
            ['elseItems', []]
        ]);
        this.loadEntries();
    }

    async loadEntries(): Promise<void> {
        this.loading = true // set semaphore
        this.entries = new Map([ // clear entries
            ['hunterArmor', []],
            ['titanArmor', []],
            ['warlockArmor', []],
            ['elseItems', []]
        ]); 

        function createBasicEntry(sheet: GoogleSpreadsheetWorksheet, row: number): destinyEntry {
            return {
                name: sheet.getCell(row, 0).formattedValue.trim(),
                link: sheet.getCell(row, 0).hyperlink,
                aliases: (sheet.getCell(row, 3).formattedValue ? sheet.getCell(row, 3).formattedValue.toLowerCase().split(', ') : []),
            };
        }

        let doc = this.getSheetObject(); // load document object
        await doc.loadInfo()

        doc.sheetsByIndex.forEach(async sheet => {
            await sheet.loadCells()
            switch (sheet.title.toLowerCase().split(' ').shift()) { // switch based on the first word of the sheet title
                case 'hunter':
                    for (let row = 0; row < sheet.rowCount; row++) {
                        if (sheet.getCell(row, 0).effectiveFormat?.textFormat.fontSize as number >= this.headerFontSize) continue; // skip headers
                        if (!sheet.getCell(row, 0).formattedValue) continue; // skip empty rows

                        let entry = createBasicEntry(sheet, row);
                        if (sheet.getCell(row, 2).formattedValue) entry.gender = sheet.getCell(row, 2).formattedValue.toLowerCase();
                        entry.armorClass = 'hunter';

                        (this.entries.get('hunterArmor') as destinyEntry[]).push(entry)
                    }
                    break;

                case 'titan':
                    for (let row = 0; row < sheet.rowCount; row++) {
                        if (sheet.getCell(row, 0).effectiveFormat?.textFormat.fontSize as number >= this.headerFontSize) continue; // skip headers
                        if (!sheet.getCell(row, 0).formattedValue) continue; // skip empty rows

                        let entry = createBasicEntry(sheet, row);
                        if (sheet.getCell(row, 2).formattedValue) entry.gender = sheet.getCell(row, 2).formattedValue.toLowerCase()
                        entry.armorClass = 'titan';

                        (this.entries.get('titanArmor') as destinyEntry[]).push(entry)
                    }
                    break;

                case 'warlock':
                    for (let row = 0; row < sheet.rowCount; row++) {
                        if (sheet.getCell(row, 0).effectiveFormat?.textFormat.fontSize as number >= this.headerFontSize) continue; // skip headers
                        if (!sheet.getCell(row, 0).formattedValue) continue; // skip empty rows

                        let entry = createBasicEntry(sheet, row);
                        if (sheet.getCell(row, 2).formattedValue) entry.gender = sheet.getCell(row, 2).formattedValue.toLowerCase()
                        entry.armorClass = 'warlock';

                        (this.entries.get('warlockArmor') as destinyEntry[]).push(entry)
                    }
                    break;
            
                default:
                    for (let row = 0; row < sheet.rowCount; row++) {
                        if (sheet.getCell(row, 0).effectiveFormat?.textFormat.fontSize as number >= this.headerFontSize) continue; // skip headers
                        if (!sheet.getCell(row, 0).formattedValue) continue; // skip empty rows

                        (this.entries.get('elseItems') as destinyEntry[]).push(createBasicEntry(sheet, row));
                    }
                    break;
            }
        })

        this.loading = false; // clear semaphore
        return Promise.resolve()
    }

    static itemFilter(this: string, item: Entry): boolean {
        return levenshtien(this.toLowerCase(), item.name.toLowerCase()).similarity > 0.7
    }

    search(query: string, options?: { gender?: typeof GenderUnion, armorClass?: typeof DestinyClassUnion }): destinyEntry[] {
        if (this.loading) return [];
        let results: destinyEntry[] = []

        destiny.forEach((overridePair) => {
            if (overridePair.replaces.includes(query)) {
                query = overridePair.replacement;
            }
        });

        if (options?.armorClass) { // search only the specified class
            results = results.concat((this.entries.get(`${options.armorClass}Armor`) as destinyEntry[]).filter(DestinySheetResponder.itemFilter, query));
        } else { // if neither a gender nor class is specified, search all items
            this.entries.forEach((catagory) => {
                results = results.concat(catagory.filter(DestinySheetResponder.itemFilter, query))
            });
        }

        if (options?.gender) { // filter by gender if specified
            results = results.filter((item) => { return !item.gender || item.gender === options.gender });
        }
        
        return results
    }

    generateFullyQualifiedName(entry: destinyEntry): string {
        return `${(entry.gender ? `${BaseResponder.capitalizeWord(entry.gender)} ` : '')}${(entry.armorClass ? `${BaseResponder.capitalizeWord(entry.armorClass)} ` : '')}${entry.name}`
    }

    generateResponse(matchingEntries: destinyEntry[], generateResponseLine: (entry: Entry, name: string) => string): string {
        return super.generateResponse(matchingEntries, generateResponseLine)
    }
}