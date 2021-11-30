const Discord = require('discord.js')
const { getRandom } = require('../utils/utils.js')

module.exports = {
    name: 'boshi',
    description: '!boshi greets with a random emoji',
    usage: '!boshi',

    execute (message, args) {
        const replies = ['💖', ':blossom:', ':star:']

        const embeddedMessage = new Discord.MessageEmbed()
            .setTitle('Greetings!')
            .setDescription(getRandom(replies))
            .setColor('00ff00')
        message.channel.sendEmbed(embeddedMessage)
    }
}
