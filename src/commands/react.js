const { Permissions, MessageEmbed } = require('discord.js')
const { isEmpty } = require('../utils/utils.js')

async function getValidMessage(messageId, message) {

    let messageData = null
    try {
        messageData = await message.channel.messages.fetch(messageId)
    } catch (error) {
        console.error(error)
    }
    return messageData
}

function getAllChannelUsers(messageChannel) {
    return messageChannel.members.filter(m => m.id && m.user.bot == false).array()
}

async function getReactedUserIds(messageData) {
    let reactedUsersIds = []

    for (const reaction of messageData.reactions.cache.array()) {
        const users = await reaction.users.fetch()
        const usersIds = Array.from(users.keys())
        reactedUsersIds = reactedUsersIds.concat(usersIds)
    }

    const uniqueReactedUsersIds = [...(new Set(reactedUsersIds))].join(', ')
    return uniqueReactedUsersIds
}

function getMissingUserIds(allChannelUsers, reactedUsersIds) {
    let missingUsersIds = []

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

    async execute(message, args) {

        const [messageId] = args

        if (isEmpty(messageId)) {
            message.channel.sendError(`You must provide a valid message id!`)
            return
        }
        const messageData = await getValidMessage(messageId, message)

        if (!messageData) {
            message.channel.sendError(`A message with '${messageId}' is not found in the channel!`)
            return
        }

        const allChannelUsers = getAllChannelUsers(message.channel)
        const reactedUsersIds = await getReactedUserIds(messageData)
        const missingUsersIds = getMissingUserIds(allChannelUsers, reactedUsersIds)

        if (missingUsersIds.length == 0) {
            const embeddedMessage = new MessageEmbed()
                .setTitle("Information :information_source:")
                .setDescription(`Everyone has reacted to the [message](${messageData.url})!`)
                .setColor("00ff00")
                .setURL(messageData.url)
            message.channel.sendEmbed(embeddedMessage)
        }
        else {
            const embeddedMessage = new MessageEmbed()
                .setTitle(`Read and react with an emoji :loudspeaker:`)
                .setDescription(`Pay attention to the [message](${messageData.url})! ${missingUsersIds.join(", ")}`)
                .setURL(messageData.url)
                .setColor("ff0000")
            message.channel.sendEmbed(embeddedMessage)
        }
    }
}