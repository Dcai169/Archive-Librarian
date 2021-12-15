import * as levenshtien from 'damerau-levenshtein';
import { haloEntry } from "src/types";
import { DriveResponder, drive } from "./DriveResponder";
import { halo } from "./../config/query_overrides.json"
import { drive_v3 } from 'googleapis';

export class HaloDriveResponder extends DriveResponder {
    entries: Map<string, haloEntry[]>
    totalItems: number;

    constructor() {
        super('Halo', '13yzFdyxeBHBOql4GOXmaFfQMDD1ehgTZ');

        this.entries = new Map<string, haloEntry[]>();
        this.loadEntries(this.rootFolderId, '');
        this.totalItems = 0;
    }

    static reduceName(name: string): string {
        return name.replace(/\.\w*$/gi, '')
           .replace(/_/gi, ' ') // Replace underscores with spaces
            .replace(/\[.*\]/gi, '')
            .replace(/ {2,}/g, ' ') // Remove multiple spaces
            .trim()
    }

    async loadEntries(parentFolderId: string, parentFolderName: string): Promise<void> {
        if (parentFolderId === this.rootFolderId) {
            this.loading = true;
            this.entries = new Map<string, haloEntry[]>();
        }

        let files = await drive.files.list({ // get files from google drive
            q: `'${parentFolderId}' in parents and (mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/octet-stream' or mimeType = 'application/x-zip-compressed')`,
            fields: 'files(name, id, mimeType, webViewLink, parents)'
        })

        let folders: drive_v3.Schema$File[] = []; // Some models have additional subfolders for textures, so all folder contents must be analyzed before recursing
        let _3dFile: drive_v3.Schema$File | undefined = undefined;

        files.data.files?.forEach(file => {
            if (file.mimeType === 'application/vnd.google-apps.folder') {
                if (!file.name?.toLowerCase().includes('sound') && !file.name?.toLowerCase().includes('custom edition')) { // do not include sound folders
                    folders.push(file);
                }

                if (file.parents?.includes(this.rootFolderId)) {
                    this.entries.set(HaloDriveResponder.reduceName(file.name as string), []);
                }
            } else if (file.mimeType === 'application/octet-stream') {
                if ((file.name as string).toLowerCase().match(/\.(obj)|(fbx)|(blend)$/)) {
                    _3dFile = file;
                }
            }
        });

        if (_3dFile) {
            let entry: haloEntry = {
                name: HaloDriveResponder.reduceName((_3dFile as drive_v3.Schema$File).name as string),
                link: (_3dFile as drive_v3.Schema$File).webViewLink as string,
                game: HaloDriveResponder.reduceName(parentFolderName as string),
            };

            this.totalItems++;
            console.log(entry);
            console.log(this.totalItems);

            (this.entries.get(HaloDriveResponder.reduceName(parentFolderName as string)) as haloEntry[]).push(entry);
        } else {
            folders.forEach((folder) => {
                setTimeout(() => { // Wait a bit before recursing to prevent rate limiting
                    this.loadEntries(folder.id as string, (folder.parents?.includes(this.rootFolderId) ? folder.name as string : parentFolderName));
                }, this.quotaTimeoutms);
            })
        }

        if (parentFolderId === this.rootFolderId) {
            this.loading = false;
        }
        return Promise.resolve();
    }

    static itemFilter(this: string, item: haloEntry): boolean {
        return levenshtien(this.toLowerCase(), item.name.toLowerCase()).similarity > 0.7
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
            results = (this.entries.get(options.game) as haloEntry[]).filter(HaloDriveResponder.itemFilter, query);
        } else {
            this.entries.forEach((game) => {
                results = results.concat(game.filter(HaloDriveResponder.itemFilter, query));
            });
        }

        return results;
    }

    generateFullyQualifiedName(entry: haloEntry): string {
        return `${entry.game} ${entry.name}`;
    }
}