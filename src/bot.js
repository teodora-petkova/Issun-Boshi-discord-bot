require('dotenv').config()
const Discord = require('discord.js')
const commandsjs = require('./commands.js')
const schedulejs = require('./commands/schedule.js')
const mongo = require('./db/mongo.js')
const InvitesHandler = require('./utils/inviteshandler.js')
const googledrive = require('./utils/googledrive.js')

const client = new Discord.Client()
const invitesHandler = new InvitesHandler()

function loginBot () {
    client.login(process.env.BOTTOKEN)

    //  EVENTS
    client.on('ready', async () => {
        console.log('💖')

        // 1. wait for mongo DB connection
        await mongo.connect()

        // 2. reschedule all messages on restart of the server
        await schedulejs.rescheduleAllMessages(client)
        console.log('Resheduled reminders on load!')

        // 3. load google drive settings for the welcoming messages and assigning roles based on the invitations
        const settings = await googledrive.getWelcomeSettings(process.env.GOOGLE_API_WELCOME_SETTINGS_FILE_ID)
        invitesHandler.loadSettings(settings)

        if (settings && settings.size) {
            console.log('Loaded google drive settings!')
        }

        // 4. load current invites for all servers
        for await (const guild of client.guilds.cache.array()) {
            await invitesHandler.onLoadInvitesForGuild(guild)
        }
    })

    client.on('inviteDelete', (invite) => invitesHandler.onDeleteInvite(invite))

    client.on('inviteCreate', (invite) => invitesHandler.onCreateInvite(invite))

    client.on('guildCreate', async (guild) => await invitesHandler.onLoadInvitesForGuild(guild))

    client.on('guildDelete', (guild) => invitesHandler.onDeleteInvitesForGuild(guild))

    client.on('guildMemberAdd', async (member) => await invitesHandler.onWelcomeNewMember(member))

    // COMMANDS
    client.commands = commandsjs.getCommands()
    client.on('message', async (message) => await commandsjs.commandHandler(client, message, invitesHandler))
}

// if the node process ends, close the Mongoose connection
function handle (signal) {
    mongo.disconnect()
    console.log(`Received ${signal}`)
}

function logoutBot () {
    process.on('SIGINT', handle)
    process.on('SIGTERM', handle)
}

module.exports = {
    client: client,
    loginBot: loginBot,
    logoutBot: logoutBot
}

loginBot()
logoutBot()
