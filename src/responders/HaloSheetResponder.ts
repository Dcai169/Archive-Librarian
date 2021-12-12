import { haloEntry } from "src/types";
import { SheetResponder } from "./SheetResponder";

export class HaloSheetResponder extends SheetResponder {
    constructor() {
        super('Halo', '11FSNqnAicEaHAXNmzJE7iA9zPPZILwOvK9iBDGuCNHo');
    }

    loadEntries(): void {
        throw new Error("Method not implemented.");
    }
    search(query: string, options?: { game?: string; }): haloEntry[] {
        throw new Error("Method not implemented.");
    }
    generateFullyQualifiedName(entry: haloEntry): string {
        throw new Error("Method not implemented.");
    }
}