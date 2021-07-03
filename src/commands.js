const { prefix } = require('../config.json')
const utils = require('./utils/messages.js')

function getCommands() {
    const fs = require('fs')
    const Discord = require('discord.js')

    const commands = new Discord.Collection()

    const commandFiles = fs.readdirSync('./src/commands/').filter(file => file.endsWith('.js'))

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`)

        commands.set(command.name, command)
    }

    return commands
}

function commandHandler(client, message) {
    if (!message.content.startsWith(prefix) || message.author.bot) return

    const args = message.content.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()

    if (!client.commands.has(command)) {
        message.channel.sendError(`that\'s not a valid command name **${command}**!`)
        return
    }

    try {

        const cmd = client.commands.get(command)
        cmd.execute(message, args)

    } catch (error) {
        console.error(error)
        message.channel.sendError(`There was an error trying to execute the command ${command}!`)
    }
}

module.exports = {
    getCommands: getCommands,
    commandHandler: commandHandler
}
