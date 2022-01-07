import * as levenshtien from 'damerau-levenshtein';
import { haloEntry } from "src/types";
import { SheetResponder } from "./SheetResponder";
import { halo } from "./../config/query_overrides.json"

export class HaloSheetResponder extends SheetResponder {
    entries: Map<string, haloEntry[]>;
    rowsToLoad: number = 150;

    constructor() {
        super('Halo', '11FSNqnAicEaHAXNmzJE7iA9zPPZILwOvK9iBDGuCNHo', 18);

        this.entries = new Map<string, haloEntry[]>();
        this.loadEntries();
    }

    async loadEntries(): Promise<void> {
        this.loading = true;
        this.entries = new Map<string, haloEntry[]>();

        let doc = this.getSheetObject(); // get spreadsheet document
        await doc.loadInfo(); // load document info

        doc.sheetsByIndex.forEach(async sheet => { // for each sheet
            await sheet.loadCells(`A1:F${this.rowsToLoad}`); // load cells

            if (!this.entries.has(sheet.title)) { // if sheet is not already in map
                this.entries.set(sheet.title, []); // add sheet to map
            }

            for (let row = 0; row < this.rowsToLoad; row++) {
                if (sheet.getCell(row, 0).effectiveFormat?.textFormat?.fontSize as number >= this.headerFontSize) continue; // skip headers
                if (!sheet.getCell(row, 0).formattedValue) continue; // skip empty rows

                let entry: haloEntry = {
                    name: sheet.getCell(row, 0).formattedValue,
                    link: sheet.getCell(row, 0).hyperlink,
                    game: sheet.title,
                }

                this.entries.get(sheet.title)?.push(entry);
            }
        })

        this.loading = false;
        return Promise.resolve();
    }

    static normalizeName(name: string): string {
        return name.replace('w/ permutations', '').trim();
    }

    static itemFilter(this: string, item: haloEntry): boolean {
        return levenshtien(this.toLowerCase(), HaloSheetResponder.normalizeName(item.name.toLowerCase())).similarity > 0.7
    }

    search(query: string, options?: { game?: string; }): haloEntry[] {
        if (this.loading) return []; // If the loading semaphore is set, return no results
        let results: haloEntry[] = [];

        halo.forEach((overridePair) => {
            if (overridePair.replaces.includes(query)) {
                query = overridePair.replacement;
            }
        });

        if (options?.game) {
            results = (this.entries.get(options.game) as haloEntry[]).filter(HaloSheetResponder.itemFilter, query);
        } else {
            this.entries.forEach((game) => {
                results = results.concat(game.filter(HaloSheetResponder.itemFilter, query));
            });
        }

        return results;
    }

    generateFullyQualifiedName(entry: haloEntry): string {
        return `${entry.game} ${entry.name}`;
    }
}