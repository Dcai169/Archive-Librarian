import * as Discord from "discord.js"

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
bot.login(process.env.DISCORD_TOKEN).then((data) => { console.log(`Logged in as ${bot?.user?.tag}.`) })

// Run once on the 'ready' event
bot.once('ready', () => {
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

    bot.application?.commands.set(globalCommandDefinitions)
    // bot.guilds.cache.get('705230123745542184')?.commands.set(globalCommandDefinitions) // FOR TESTING ONLY

    console.log('Global commands set.')

    // Set guild commands
    console.log('Guild commands set.')

    console.log('Commands ready!')
})

// Handle interactions with Discord
bot.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        try {
            // Defer the reply until command execution is complete
            await interaction.deferReply() 

            switch (interaction.commandName) { // Switch based on the command name
                case 'about':
                    interaction.editReply('I am the Archive Librarian. Use the \`search\` command to search my archives. I was created by <@191624702614175744>.')
                    break

                case 'source':
                    interaction.editReply('Source code for this bot can be found at https://github.com/Dcai169/Archive-Librarian.')
                    break

                case 'search':
                    switch (interaction.guildId) { // Switch based on the server the command was sent from
                        case '514059860489404417': // Destiny Model Rips
                            break

                        case '671183775454986240': // Halo Model Resource
                            break

                        case '724365082787708949': // Warframe Model Rips
                        case '705230123745542184': // The Library, FOR TESTING ONLY
                            break

                        case '819709630540021810': // Halo Archive
                            break

                        default:
                            interaction.editReply(`Command not implemented.`)
                            break
                    }
                    break

                case 'reload':
                    switch (interaction.guildId) { // Switch based on the server the command was sent from
                        case '514059860489404417': // Destiny Model Rips
                            break

                        case '671183775454986240': // Halo Model Resource
                            break

                        case '724365082787708949': // Warframe Model Rips
                        case '705230123745542184': // The Library, FOR TESTING ONLY
                            break

                        case '819709630540021810': // Halo Archive
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