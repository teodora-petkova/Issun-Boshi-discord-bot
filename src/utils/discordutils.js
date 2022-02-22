function getAllChannelUsers (channel, exceptUserId = '') {
    return channel.members.filter(m => m.id !== exceptUserId && m.user.bot === false).array()
}

function getRole (mention, channel) {
    if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1)

        if (mention.startsWith('!') ||
            // an user mention <@!userid>
            mention.startsWith('&')) {
            // a role mention <@&roleid>
            mention = mention.slice(1)
        }
        const allRolesForGuild = channel.guild.roles.cache.array()
        return allRolesForGuild.find(r => r.id === mention)
    } else if (mention === '@everyone' || mention === '@here') {
        const allRolesForGuild = channel.guild.roles.cache.array()
        return allRolesForGuild.find(r => r.name === mention)
    } else {
        return null
    }
}

function getUserPing (userId) {
    // an user mention <@!userid>
    return `<@!${userId}>`
}

function getRolePing (roleId) {
    // a role mention <@&roleid>
    return `<@&${roleId}>`
}

module.exports = {
    getAllChannelUsers,
    getRole,
    getRolePing,
    getUserPing
}
