const moment = require('../utils/moment.js')
const mongo = require('../db/mongo.js')

async function isDailyLimitForCommandReached (message, commandName) {
    const userId = message.author.id
    const guildId = message.guild.id
    const channelId = message.channel.id
    const date = moment.now()

    let isDailyLimitReached = false

    const user = await mongo.getUser(userId, guildId, channelId)
    if (user === undefined) {
        await mongo.addUserWithCommand(userId, guildId, channelId,
            commandName, date)
    } else {
        const command = mongo.getUserCommand(user, commandName)
        if (command != null) {
            if (command.count > 0) {
                await mongo.decrementCommandUsesCount(userId, guildId, channelId, commandName)
            } else {
                if (moment.getDiffWithTodayInDays(command.date) >= 1) {
                    await mongo.resetCommandForUser(userId, guildId, channelId, commandName, date)
                } else {
                    isDailyLimitReached = true
                }
            }
        } else {
            await mongo.addCommandForUser(userId, guildId, channelId, commandName, date)
        }
    }

    if (isDailyLimitReached) {
        message.channel.sendError(`@${message.author.username}, you have reached the limit of calls to '${commandName}' for the day!`)
        console.log(`User "${message.author.id}" has reached the limit of calls to '${commandName}' for the day.`)
    }

    return isDailyLimitReached
}

module.exports =
{
    isDailyLimitForCommandReached
}
