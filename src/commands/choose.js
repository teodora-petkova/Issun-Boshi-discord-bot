const { MessageEmbed } = require('discord.js')
const { getRandom } = require('../utils/utils.js')
const { getAllChannelUsers } = require('../utils/discordutils.js')

module.exports = {
    name: 'choose',
    description: '!choose pick ups a random person from the channel for a challenge',
    usage: '!choose',

    async execute (message) {
        const allChannelUsers = getAllChannelUsers(message.channel, message.author.id)
        const chosenUser = getRandom(allChannelUsers)

        if (chosenUser) {
            const embeddedMessage = new MessageEmbed()
                .setTitle('I choose you! :star: :sparkles:')
                .setDescription(`${chosenUser} has been chosen for the next challenge!`)
                .setImage('https://c.tenor.com/-blo2T-NtGcAAAAC/pokemon-poke-ball.gif')
                .setColor('00ff00')
            message.channel.sendEmbed(embeddedMessage)
            // pings of mentioned roles and users do not work inside an embedded message!
            message.channel.send(`${chosenUser}`)
        } else {
            message.channel.sendInfo('No other available users in the channel apart from the caller of the command and bots!')
        }
    }
}
