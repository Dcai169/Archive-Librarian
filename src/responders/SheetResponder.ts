import { GoogleSpreadsheet } from "google-spreadsheet"
import { BaseResponder } from "./BaseResponder"

export abstract class SheetResponder extends BaseResponder {

    sheetId: string
    headerFontSize: number

    constructor(game: string, sheetId: string, headerFontSize: number = 12) {
        super(game)
        this.sheetId = sheetId
        this.headerFontSize = headerFontSize
    }

    getSheetObject(): GoogleSpreadsheet {
        let doc = new GoogleSpreadsheet(this.sheetId)
        if (process.env.GSPREAD_API_KEY) {
            doc.useApiKey(process.env.GSPREAD_API_KEY)
        } else {
            throw new Error("No Google API key found")
        }

        return doc
    }

    // load entries 
    abstract loadEntries(): void
}
