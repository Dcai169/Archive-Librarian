import { destinyEntry } from "src/types";
import { DriveResponder } from "./DriveResponder";

export class DestinyDriveResponder extends DriveResponder {
    constructor() {
        super('Destiny', '14Ry-piQtH3j6MlfoVLfFfu98c4pcTJUb');
    }

    loadEntries(): void {
        throw new Error("Method not implemented.");
    }
    search(query: string, options?: { [key: string]: string; }): destinyEntry[] {
        throw new Error("Method not implemented.");
    }
    generateFullyQualifiedName(entry: destinyEntry): string {
        throw new Error("Method not implemented.");
    }
}