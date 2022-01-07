import * as Discord from "discord.js"
import * as guildCommands from "./config/commands.json"
import { BaseResponder } from "./responders/BaseResponder"
import { DestinyDriveResponder } from "./responders/DestinyDriveResponder"
import { DestinySheetResponder } from "./responders/DestinySheetResponder"
import { HaloSheetResponder } from "./responders/HaloSheetResponder"
import { WarframeSheetResponder } from "./responders/WarframeSheetResponder"
import { DestinyClassUnion, GenderUnion } from "./types"

let warframeResponders = {
    'sheet': new WarframeSheetResponder(),
}

let destinyReponders = {
    'sheet': new DestinySheetResponder(),
    'drive': new DestinyDriveResponder(),
}

let haloResponders = {
    'sheet': new HaloSheetResponder(),
}

function guildIdToName(guildId: string): string {
    switch (guildId) {
        case '705230123745542184':
            return 'the Library';

        case '819709630540021810':
            return 'the Halo Archive';

        case '724365082787708949':
            return 'WMR';

        case '671183775454986240':
            return 'HMR';

        case '514059860489404417':
            return 'DMR';

        default:
            return '';
    }
}

function getPriviligedGuildRoleId(guildId: string): string {
    switch (guildId) {
        case '705230123745542184':
            return '787155673913491456';

        case '819709630540021810':
            return '819719515830616117';

        case '724365082787708949':
            return '724372990825070672';

        case '671183775454986240':
            return '671428754081316865';

        case '514059860489404417':
            return '514548453121064965';

        default:
            return '';
    }
}

// Create a new Discord client object
const bot = new Discord.Client(
    {
        presence: {
            status: "online",
            afk: false,
            activities: [{
                type: "PLAYING",
                name: "with code",
            }]
        },
        intents: ['GUILDS']
    }
)

// Login with the Discord Token
bot.login(process.env.DISCORD_TOKEN).then(() => { console.log(`Logged in as ${bot?.user?.tag}.`) })

// Run once on the 'ready' event
bot.once('ready', async () => {
    console.log('Connected to Discord.')

    // Set global commands
    const globalCommandDefinitions = [
        {
            name: 'about',
            description: 'About this bot',
        },
        {
            name: 'source',
            description: 'Source code for this bot',
        },
    ]

    // Set global commands
    await bot.application?.commands.set(globalCommandDefinitions)
    console.log('Global commands set.')

    // Set guild commands
    Object.entries(guildCommands).forEach(async ([guildId, guildCommands]) => {
        let commandMap = await bot.guilds.cache.get(guildId)?.commands.set((guildCommands as Discord.ApplicationCommandDataResolvable[]))
        console.log(`Guild commands set for ${guildIdToName(guildId)}.`)
        if (commandMap) {
            let privilegedUsers = ['191624702614175744', commandMap.get('918761548837703691')?.guild?.ownerId as string] // Allow Alcidine#5154, the server owner, and admins to use the /reload command
                // .concat((getPriviligedGuildRoleId(guildId) ? commandMap.first()?.guild?.roles.cache.get(getPriviligedGuildRoleId(guildId))?.members.map(member => member.id) ?? [] : []));
            
            await commandMap.get('918761548837703691')?.permissions.add({ 
                permissions: privilegedUsers.map(userId => {
                    return {
                        id: userId,
                        type: 'USER',
                        permission: true
                    }
                })
            });

            console.log(`/reload permission set on ${guildIdToName(guildId)}.`)
        } else {
            console.log(`Error setting /reload permissions on ${guildIdToName(guildId)}.`)
        }
    });

    console.log('Commands ready!')
})

// Handle interactions with Discord
bot.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        await interaction.deferReply()

        try {
            // Defer the reply until command execution is complete
            switch (interaction.commandName) { // Switch based on the command name
                case 'about':
                    interaction.editReply('I am the Archive Librarian. Use the \`\/search\` command to search my archives. I was created by <@191624702614175744>.')
                    break

                case 'source':
                    interaction.editReply('Source code for this bot can be found at https://github.com/Dcai169/Archive-Librarian.')
                    break

                case 'search':
                    let options = {}
                    switch (interaction.guildId) { // Switch based on the server the command was sent from
                        case '705230123745542184': // The Library, FOR TESTING ONLY
                        case '514059860489404417': // Destiny Model Rips
                            switch (interaction.options.getSubcommand()) {
                                case 'sheet':
                                    options = {
                                        armorClass: (interaction.options.get('class')?.value as typeof DestinyClassUnion | undefined),
                                        gender: (interaction.options.get('gender')?.value as typeof GenderUnion | undefined)
                                    }

                                    interaction.editReply(destinyReponders.sheet.generateResponse(destinyReponders.sheet.search(interaction.options.get('query')?.value as string, options), BaseResponder.generateResponseLine))
                                    break;

                                case 'community':
                                    options = {
                                        armorClass: (interaction.options.get('class')?.value as typeof DestinyClassUnion | undefined),
                                        gender: (interaction.options.get('gender')?.value as typeof GenderUnion | undefined)
                                    }

                                    interaction.editReply(destinyReponders.drive.generateResponse(destinyReponders.drive.search(interaction.options.get('query')?.value as string, options), BaseResponder.generateResponseLine))
                                    break;

                                default:
                                    interaction.editReply('Invalid subcommand. Use `/search sheet` or `/search community`.')
                                    break;
                            }
                            break

                        case '819709630540021810': // Halo Archive
                        case '671183775454986240': // Halo Model Resource
                            interaction.editReply(haloResponders.sheet.generateResponse(haloResponders.sheet.search(interaction.options.get('query')?.value as string, { game: interaction.options.get('game')?.value as string }), BaseResponder.generateResponseLine))
                            break

                        case '724365082787708949': // Warframe Model Rips
                            interaction.editReply(warframeResponders.sheet.generateResponse(warframeResponders.sheet.search(interaction.options.get('query')?.value as string), BaseResponder.generateResponseLine));
                            break

                        default:
                            interaction.editReply(`Command not implemented.`)
                            break
                    }
                    break

                case 'reload':
                    switch (interaction.guildId) { // Switch based on the server the command was sent from
                        case '705230123745542184': // The Library, FOR TESTING ONLY
                        case '514059860489404417': // Destiny Model Rips
                            switch (interaction.options.get('index')?.value as string) {
                                case 'sheet':
                                    interaction.editReply('Reloading Destiny sheet index...')
                                    await destinyReponders.sheet.loadEntries()
                                    interaction.editReply('Destiny sheet index reloaded.')
                                    break;

                                case 'community':
                                    interaction.editReply('Reloading Destiny community index...')
                                    await destinyReponders.drive.loadEntries('14Ry-piQtH3j6MlfoVLfFfu98c4pcTJUb', '')
                                    interaction.editReply('Destiny community index reloaded.')
                                    break;

                                default:
                                    interaction.editReply('Reloading all Destiny indexes...')
                                    await destinyReponders.sheet.loadEntries()
                                    await destinyReponders.drive.loadEntries('14Ry-piQtH3j6MlfoVLfFfu98c4pcTJUb', '')
                                    interaction.editReply('Destiny indexes reloaded.')
                                    break;
                            }
                            break

                        case '671183775454986240': // Halo Model Resource
                        case '819709630540021810': // Halo Archive
                            interaction.editReply('Reloading Halo sheet index...')
                            await haloResponders.sheet.loadEntries()
                            interaction.editReply('Halo sheet index reloaded.')
                            break

                        case '724365082787708949': // Warframe Model Rips
                            interaction.editReply('Reloading...')
                            await warframeResponders.sheet.loadEntries()
                            interaction.editReply('Reload complete.')
                            break

                        default:
                            interaction.editReply(`Command not implemented.`)
                            break
                    }
                    break

                default:
                    interaction.editReply(`Command not implemented.`)
                    break
            }
        } catch (error) {
            // Handle error
            interaction.editReply(`An error occured: ${(error as Error).message}`)
            console.error(error)
        }
    }
})