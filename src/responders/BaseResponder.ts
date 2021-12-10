import { Entry } from "src/types"

export abstract class BaseResponder {
    loading: boolean = false
    // creates instance fields implicitly
    constructor(readonly game: string, loading = false) { }

    // load entries 
    abstract loadEntries(): void

    // search indexes for provided query
    abstract search(query: string, options?: { [key: string]: string }): Entry[]

    // Capitalize first letter of a string
    static capitalizeWord(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1)
    }

    // return a string with all qualifiers and the item name i.e. 'male warlock great hunt suit'
    abstract generateFullyQualifiedName(entry: Entry): string

    static generateResponseLine(entry: Entry, name: string): string {
        return `${name}: ${(entry.link ? `✅ <${entry.link}>` : '❌')}`
    }

    // return the response body
    generateResponse(matchingEntries: Entry[], generateResponseLine: (entry: Entry, name: string) => string): string {
        let response = ''

        switch (matchingEntries.length) {
            case 0:
                response = 'No results found.'
                break

            case 1:
                response = generateResponseLine(matchingEntries[0], this.generateFullyQualifiedName(matchingEntries[0]))
                break

            default:
                matchingEntries.forEach(entry => {
                    response += `${generateResponseLine(entry, this.generateFullyQualifiedName(entry))}\n`
                })
                break
        }

        return response
    }
}