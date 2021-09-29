const { prefix } = require('../config.json')
const utils = require('./utils/messages.js')
const fs = require('fs')
const { Collection, Permissions } = require('discord.js')

function checkForMissingPermissions(message, messageUser, user, requiredPermissions) {

    let actualPermissions = message.channel.permissionsFor(messageUser);
    if (!actualPermissions.has(requiredPermissions)) {
        let missingPermissionsAsBits = requiredPermissions.filter(perm => actualPermissions.has(perm) === false)
        let missingPermissions = missingPermissionsAsBits
            .map(perm => new Permissions(perm).toArray())
            .reduce((a, b) => a.concat(b))
            .join(', ')
        message.channel.sendError(`The command cannot be executed because of missing permissions for *${user}*: ${missingPermissions}!`)
        return false
    }
    return true
}

function getCommands() {
    const commands = new Collection()

    const commandFiles = fs.readdirSync('./src/commands/').filter(file => file.endsWith('.js'))

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`)

        commands.set(command.name, command)
    }

    return commands
}

async function commandHandler(client, message) {
    if (!message.content.startsWith(prefix) || message.author.bot) return

    const args = message.content.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()

    if (!client.commands.has(command)) {
        message.channel.sendError(`that\'s not a valid command name **${command}**!`)
        return
    }

    try {
        const cmd = client.commands.get(command)

        //defaultBotPermissions = [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS]
        //defaultUserPermissions = [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
        //botPermissions = defaultBotPermissions.concat(cmd.botPermissions)
        //userPermissions = defaultUserPermissions.concat(cmd.userPermissions)

        let validPermissions = true;
        if (cmd.botPermissions && cmd.botPermissions.length > 0) {
            validPermissions &= checkForMissingPermissions(message,
                message.guild.me, message.guild.me.user.username, cmd.botPermissions)
        }
        if (cmd.userPermissions && cmd.userPermissions.length > 0) {
            validPermissions &= checkForMissingPermissions(message,
                message.member, message.member.user.username, cmd.userPermissions)
        }
        if (validPermissions) {
            await cmd.execute(message, args)
        }

    } catch (error) {
        console.error(error)
        message.channel.sendError(`There was an unexpected error trying to execute the command ${command}!`)
    }
}

module.exports = {
    getCommands: getCommands,
    commandHandler: commandHandler
}
