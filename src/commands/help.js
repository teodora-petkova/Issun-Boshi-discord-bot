const { prefix } = require('../../config.json')

module.exports = {

    name: 'help',
    description: 'List all of my commands or info about a specific command.',
    usage: '!help or !help <the command name without a prefix>',

    execute (message, args) {
        const data = []
        const { commands } = message.client

        if (!args.length) {
            data.push('Here\'s a list of all my commands:')

            data.push(commands.map(command => `:small_orange_diamond: ${command.name}`).join('\n'))
            data.push(`\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`)

            return message.channel.sendInfo(data)
        } else {
            const name = args[0].toLowerCase()
            const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name))

            if (!command) {
                return message.channel.sendError(`that's not a valid command name **${name}**!`)
            } else {
                data.push(`**Name:** ${command.name}`)

                if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`)
                if (command.description) data.push(`**Description:** ${command.description}`)
                if (command.usage) data.push(`**Usage:** ${command.usage}`)

                return message.channel.sendInfo(data)
            }
        }
    }
}
