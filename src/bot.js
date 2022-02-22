require('dotenv').config()
const Discord = require('discord.js')
const commandsjs = require('./commands.js')
const schedulejs = require('./commands/schedule.js')
const mongo = require('./db/mongo.js')

const client = new Discord.Client()

/// TO REFACTOR!!! - for welcoming messages!
const googledrive = require('./utils/googledrive.js')
const utils = require('./utils/utils.js')
const { getRolePing, getUserPing } = require('./utils/discordutils.js')

const invites = new Map()
let settings = new Map()
///

function loginBot () {
    client.login(process.env.BOTTOKEN)

    //  EVENTS
    client.on('ready', async () => await onLoad())

    client.on('inviteDelete', (invite) => onDeleteInvite(invite))

    client.on('inviteCreate', (invite) => onCreateInvite(invite))

    client.on('guildCreate', async (guild) => await onLoadInvitesForGuild(guild))

    client.on('guildDelete', (guild) => onDeleteInvitesForGuild(guild))

    client.on('guildMemberAdd', async (member) => await onWelcomeNewMember(member))

    // COMMANDS
    client.commands = commandsjs.getCommands()
    client.on('message', async (message) => await commandsjs.commandHandler(client, message))
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

async function onLoad () {
    console.log('💖')

    // 1. wait for mongo DB connection
    await mongo.connect()

    // 2. reschedule all messages on restart of the server
    await schedulejs.rescheduleAllMessages(client)
    console.log('Resheduled reminders on load!')

    // 3. load settings for the welcoming messages and assigning roles based on the invitations
    settings = await getWelcomeSettings(process.env.GOOGLE_API_WELCOME_SETTINGS_FILE_ID)
    if (settings && settings.size) {
        console.log('Loaded settings for the welcoming messages based on invitations!')
    }

    // 4. load current invites for all servers
    for await (const guild of client.guilds.cache.array()) {
        await onLoadInvitesForGuild(guild)
    }
    if (invites && invites.size) {
        console.log('Loaded invites for all guilds!')
    }
}

async function getWelcomeSettings (settingsFileId) {
    const settings = new Map()
    if (settingsFileId) {
        const lines = await googledrive.exportLinesFromFile(settingsFileId)
        for (const line of lines) {
            const keyValue = utils.getKeyValuePair(line, ':')
            if (keyValue) {
                settings.set(keyValue[0], keyValue[1])
            }
        }
    } else {
        console.warn('No file is provided for the welcoming settings.')
    }
    return settings
}

async function onLoadInvitesForGuild (guild) {
    if (guild.me.permissions.has('MANAGE_GUILD')) {
        try {
            const guildInvites = await guild.fetchInvites()
            invites.set(guild.id, new Map(guildInvites.map((invite) => [invite.code, invite.uses])))
        } catch (error) {
            console.error(`Error occurred while fetching invites for the guild name='${guild.name}' id='${guild.id}' \n` + error)
        }
    } else {
        console.warn(`MANAGE_GUILD permission for the bot is required for loading current invites for the guild name='${guild.name}' id='${guild.id}'!`)
    }
}

async function onWelcomeNewMember (member) {
    try {
        if (settings && settings.size && settings.has('channel') &&
            member.guild.me.permissions.has('MANAGE_ROLES')) {
            const logChannel = member.guild.channels.cache.find(channel => channel.name === settings.get('channel'))

            let mainMessage = `Здравей, ${getUserPing(member.user.id)}! `
            const reminderMessage = settings.has('message') ? settings.get('message') : ''

            const newInvites = await member.guild.fetchInvites()
            const oldInvites = invites.get(member.guild.id)
            const invite = newInvites.find(i => i.uses > oldInvites.get(i.code))

            if (invite) {
                const roleName = settings.has(invite.code) ? settings.get(invite.code) : ''
                const role = member.guild.roles.cache.find(role => role.name === roleName)

                if (role) {
                    await member.roles.add(role)

                    mainMessage = `Здравей, ${getUserPing(member.user.id)}, \
                    нашият нов и ценен член на ${getRolePing(role.id)}! `
                }
            }

            const embeddedMessage = new Discord.MessageEmbed()
                .setTitle('Welcome! :tada: :partying_face: :star2:')
                .setDescription(mainMessage + reminderMessage)
                .setColor('00ff00')

            logChannel.sendEmbed(embeddedMessage)
        }
    } catch (error) {
        console.error(`Unexpected error during welcoming a new member ${member.user.tag} \
            in the guild name='${member.guild.name}' id='${member.guild.id}'\n` + error)
    }
}

function onDeleteInvite (invite) {
    invites.get(invite.guild.id).delete(invite.code)
}

function onCreateInvite (invite) {
    invites.get(invite.guild.id).set(invite.code, invite.uses)
}

function onDeleteInvitesForGuild (guild) {
    invites.delete(guild.id)
}

module.exports = {
    client: client,
    loginBot: loginBot,
    logoutBot: logoutBot
}

loginBot()
logoutBot()
