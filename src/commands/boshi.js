const Discord = require('discord.js')
const { getRandom } = require('../utils/utils.js')
const limits = require('../utils/limits.js')

module.exports = {
    name: 'boshi',
    description: '!boshi greets with a random emoji',
    usage: '!boshi',

    async execute (message, args) {
        const commandName = this.name

        const isDailyLimitReached = await limits.isDailyLimitForCommandReached(message, commandName)
        if (!isDailyLimitReached) {
            const replies = ['💖', ':blossom:', ':star:']

            const embeddedMessage = new Discord.MessageEmbed()
                .setTitle('Greetings!')
                .setDescription(getRandom(replies))
                .setColor('00ff00')
            message.channel.sendEmbed(embeddedMessage)
        }
    }
}
