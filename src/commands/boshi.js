const Discord = require('discord.js')

module.exports = {
    name: 'boshi',
    description: '!boshi greets with a random emoji',
    usage: '!boshi',

    execute(message, args) {
        const replies = ['💖', ':blossom:', ':star:']
        const index = Math.floor(Math.random() * replies.length)

        const embeddedMessage = new Discord.MessageEmbed()
            .setTitle("Greetings!")
            .setDescription(replies[index])
            .setColor("00ff00")
        message.channel.sendEmbed(embeddedMessage)
    }
}