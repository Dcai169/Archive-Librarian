import * as levenshtien from 'damerau-levenshtein';
import { DestinyClassUnion, destinyEntry, Entry, GenderUnion } from "src/types";
import { destiny } from '../config/query_overrides.json';
import { BaseResponder } from "./BaseResponder";
import { drive, DriveResponder } from "./DriveResponder";

export class DestinyDriveResponder extends DriveResponder {
    entries: Map<string, destinyEntry[]>;

    constructor() {
        super('Destiny', '14Ry-piQtH3j6MlfoVLfFfu98c4pcTJUb');

        this.entries = new Map<string, destinyEntry[]>();
        this.loadEntries(this.rootFolderId, '')
    }

    static reduceName(name: string): string {
        return name.replace(/\.((7z)|(rar)|(zip))/, '') // Remove file extension
            .replace('_', ' ') // Replace underscores with spaces
            .replace('Copy of ', '') // Remove the words 'Copy of'
            .replace(/\(\d*\)/i, '') // Remove parentheses containing numbers
            .replace(/(fe)?male/i, '') // Remove the words 'female' and 'male' 
            .replace(/(titan)|(hunter)|(warlock)/i, '') // Remove the words 'titan', 'hunter', and 'warlock'
            .replace(/(BIOS)|(Taylor4224)|(Delta)|(TheSinkingSponge)|(sss)/i, '') // Remove the words 'BIOS', 'Taylor4224', 'Delta', and 'TheSinkingSponge'
            .replace(/(\w* and )*(\w* ?)*by [a-zA-Z0-9-_]*[;, ]*/gi, '') // Remove 

            .replace(/(\[\])|(\(\))/gi, '') // Remove '[]' and '()'
            .replace(/ {2,}/g, ' ') // Remove multiple spaces
            .replace(/^_*/gi, '') // Remove underscores at the start of the string
            .trim()
    }

    async loadEntries(parentFolderId: string, parentFolderName: string): Promise<void> {
        if (parentFolderId === this.rootFolderId) {
            this.loading = true // set semaphore
            this.entries = new Map<string, destinyEntry[]>(); // clear entries
        }

        let files = await drive.files.list({ // get files from google drive
            q: `'${parentFolderId}' in parents and (mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/rar' or mimeType = 'application/x-zip-compressed' or mimeType = 'application/x-7z-compressed')`,
            fields: 'files(name, id, mimeType, webViewLink, parents)'
        })

        files.data.files?.forEach(file => {
            if (file.mimeType === 'application/vnd.google-apps.folder') { // If the file is a folder
                if ((file.parents as string[])[0] === this.rootFolderId && !this.entries.has(file.name as string)) { // Add a key to the map if it doesn't already exist
                    this.entries.set(file.name as string, []);
                }

                this.loadEntries(`${file.id}`, (file.parents?.includes(this.rootFolderId) ? file.name as string : parentFolderName)) // Recurse into the folder. If the parent folder is the root folder, 
                    .then(() => { Promise.resolve() })                                                                               // the folder name is the new parent folder name. Otherwise, the previous parent folder name is retained.
            } else { // If the file is not a folder
                let entry: destinyEntry = { 
                    name: DestinyDriveResponder.reduceName(file.name as string),
                    link: file.webViewLink as string,
                    aliases: [],
                }  
                
                if (file.name?.match(/(fe)?male/i)) {
                    entry.gender = (file.name?.toLowerCase().match(/(fe)?male/i) as string[])[0] as typeof GenderUnion
                }

                if (file.name?.match(/(titan)|(hunter)|(warlock)/i)) {
                    entry.armorClass = (file.name?.toLowerCase().match(/(titan)|(hunter)|(warlock)/i) as string[])[0] as typeof DestinyClassUnion
                }
                
                (this.entries.get(parentFolderName) as destinyEntry[]).push(entry);
            }
        })

        if (parentFolderId === this.rootFolderId) {
            this.loading = false // release semaphore
        }

        return Promise.resolve()
    }

    static itemFilter(this: string, item: Entry): boolean {
        return levenshtien(this.toLowerCase(), item.name.toLowerCase()).similarity > 0.7
    }

    search(query: string, options?: { gender?: typeof GenderUnion, armorClass?: typeof DestinyClassUnion }): destinyEntry[] {
        if (this.loading) return []; // If the loading semaphore is set, return no results
        let results: destinyEntry[] = []

        destiny.forEach((overridePair) => {
            if (overridePair.replaces.includes(query)) {
                query = overridePair.replacement;
            }
        });

        this.entries.forEach((folder) => {
            results = results.concat(folder.filter(DestinyDriveResponder.itemFilter, query));
        });
    
        if (options?.gender) {
            results = results.filter((item) => { return !item.gender || item.gender === options.gender });
        }
    
        if (options?.armorClass) {
            results = results.filter((item) => { return !item.armorClass || item.armorClass === options.armorClass });
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