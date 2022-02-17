const { Permissions, MessageEmbed } = require('discord.js')
const { isEmpty, getRandom } = require('../utils/utils.js')
const { getAllChannelUsers } = require('../utils/discordutils.js')

async function getValidMessage (messageId, message) {
    let messageData = null
    try {
        messageData = await message.channel.messages.fetch(messageId)
    } catch (error) {
        console.error(error)
    }
    return messageData
}

async function getReactedUserIds (messageData) {
    let reactedUsersIds = []

    for (const reaction of messageData.reactions.cache.array()) {
        const users = await reaction.users.fetch()
        const usersIds = Array.from(users.keys())
        reactedUsersIds = reactedUsersIds.concat(usersIds)
    }

    const uniqueReactedUsersIds = [...(new Set(reactedUsersIds))].join(', ')
    return uniqueReactedUsersIds
}

function getMissingUserIds (allChannelUsers, reactedUsersIds) {
    const missingUsersIds = []

    for (const user of allChannelUsers) {
        if (!reactedUsersIds.includes(user.id)) {
            missingUsersIds.push(`<@${user.id}>`)
        }
    }
    return missingUsersIds
}

module.exports = {
    name: 'react',
    description: '!react sends a message for the users that did not read and react to a given message by its id',
    usage: '!react <message.id>',
    botPermissions: [Permissions.FLAGS.READ_MESSAGE_HISTORY],

    async execute (message, args) {
        const [messageId] = args

        if (isEmpty(messageId)) {
            message.channel.sendError('You must provide a valid message id!')
            return
        }
        const messageData = await getValidMessage(messageId, message)

        if (!messageData) {
            message.channel.sendError(`A message with ID='${messageId}' is not found in the channel!`)
            return
        }

        const allChannelUsers = getAllChannelUsers(message.channel, message.author.id)
        const reactedUsersIds = await getReactedUserIds(messageData)
        const missingUsersIds = getMissingUserIds(allChannelUsers, reactedUsersIds)

        if (missingUsersIds.length === 0) {
            const embeddedMessage = new MessageEmbed()
                .setTitle('Information :information_source:')
                .setDescription(`Everyone has reacted to the [message](${messageData.url})!`)
                .setColor('00ff00')
                .setURL(messageData.url)
            message.channel.sendEmbed(embeddedMessage)
        } else {
            const users = missingUsersIds
                .map(u => ':fire:' + u)
                .join('\n')
            const shameTenorGifs = [
                'https://c.tenor.com/kq44BCZP88cAAAAC/the-lion-king-pumbaa.gif',
                'https://c.tenor.com/S9BFrDY6FFcAAAAd/ashamed-shame.gif',
                'https://c.tenor.com/JOlpyUIRzUcAAAAC/for-shame.gif'
            ]
            const titleWallofShame = ':regional_indicator_w: :regional_indicator_a: :regional_indicator_l: :regional_indicator_l:  :regional_indicator_o: :regional_indicator_f:  :regional_indicator_s: :regional_indicator_h: :regional_indicator_a: :regional_indicator_m: :regional_indicator_e:'
            const embeddedMessage = new MessageEmbed()
                .setTitle('Read the message :loudspeaker:')
                .setDescription(`Read and react to the [message](${messageData.url}) with an emoji!`)
                .setImage(getRandom(shameTenorGifs))
                .setURL(messageData.url)
                .setColor('ff0000')
            message.channel.sendEmbed(embeddedMessage)
            // pings of mentioned roles and users do not work inside an embedded message!
            message.channel.send(`${titleWallofShame}\n${users}\n`)
        }
    }
}
