const moment = require('../utils/moment.js')
const mongo = require('../db/mongo.js')

async function isDailyLimitForCommandReached (message, commandName) {
    const userData = {
        id: message.author.id,
        name: message.author.username,
        guildId: message.guild.id,
        guildName: message.guild.name,
        channelId: message.channel.id,
        channelName: message.channel.name
    }

    let isDailyLimitReached = false

    const user = await mongo.getUser(userData)
    if (user === null) {
        await mongo.addUserWithCommand(userData, commandName)
    } else {
        const command = mongo.getUserCommand(user, commandName)
        if (command != null) {
            if (command.callsCount > 0) {
                await mongo.decrementCommandUsesCount(userData, commandName)
            } else {
                if (moment.getDiffWithTodayInDays(command.createdAt) >= 1) {
                    await mongo.resetCommandForUser(userData, commandName)
                } else {
                    isDailyLimitReached = true
                }
            }
        } else {
            await mongo.addCommandForUser(userData, commandName)
        }
    }

    if (isDailyLimitReached) {
        message.channel.sendError(`@${userData.name}, you have reached the limit of calls to '${commandName}' for the day!`)
        console.log(`User @${userData.name} (id:${userData.id}) has reached the limit of calls to '${commandName}' for the day.`)
    }

    return isDailyLimitReached
}

module.exports =
{
    isDailyLimitForCommandReached
}
