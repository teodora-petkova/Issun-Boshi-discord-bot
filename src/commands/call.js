const Discord = require('discord.js')
const { isEmpty } = require('../utils/utils.js')

function getValidVoiceChannel (origVoiceChannelName, message) {
    let voiceChannelId = origVoiceChannelName

    // voice channels are search inside discord with #! but the default parsing is the same as with any other channel: <#channel_name>
    if (voiceChannelId.startsWith('<#') && voiceChannelId.endsWith('>')) {
        voiceChannelId = voiceChannelId.slice(2, -1)

        let voiceChannel = null
        voiceChannel = message.guild.channels.cache.array().find(c =>
            c.type === 'voice' &&
            c.id === voiceChannelId)

        return voiceChannel
    } else {
        return null
    }
}

module.exports = {
    name: 'call',
    description: '!call sends a message for the users that are not in the input voice chat channel.',
    usage: '!call #!<voice chat channel>',
    async execute (message, args) {
        const [voiceChannelName] = args

        if (isEmpty(voiceChannelName)) {
            message.channel.sendError('You must provide a valid voice channel!')
            return
        }

        const voiceChannel = getValidVoiceChannel(voiceChannelName, message)
        if (!voiceChannel) {
            message.channel.sendError(`The "<#${voiceChannelName}>" is an invalid voice channel!`)
            return
        }

        const missingMemberIds = []
        let presentMemberIds = []

        if (voiceChannel.members) {
            presentMemberIds = voiceChannel.members.map(m => m.id)
        }

        const members = message.channel.members.filter(m => m.id && m.user.bot === false).array()
        for (const member of members) {
            if (!presentMemberIds.includes(member.id)) {
                missingMemberIds.push(`<@${member.id}>`)
            }
        }

        if (missingMemberIds.length === 0) {
            message.channel.sendInfo(`Everyone is available in the voice channel "<#${voiceChannel.id}>"!`)
        } else {
            const members = missingMemberIds
                .map(m => ':fire:' + m)
                .join('\n')
            const embeddedMessage = new Discord.MessageEmbed()
                .setTitle('Call :loudspeaker:')
                .setDescription(`Come in the voice chat "<#${voiceChannel.id}>"!\n${members}`)
                .setColor('ff0000')
            message.channel.sendEmbed(embeddedMessage)
        }
    }
}
