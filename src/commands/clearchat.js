module.exports = {
    name: 'clearchat',
    description: '!clearchat clears all messages (if permission is available)',
    usage: '!clearchat',

    async execute(message, args) {
        if (message.member.guild.me.hasPermission('ADMINISTRATOR') ||
            message.member.guild.me.hasPermission('MANAGE_MESSAGES')) {
            message.delete()
            let fetched
            do {
                fetched = await message.channel.messages.fetch({ limit: 99 })
                message.channel.bulkDelete(fetched)
            }
            while (fetched.size >= 1)
        }
        else {
            message.channel.sendError("Issun Boshi does not have permissions to manage messages!")
        }
    }
}