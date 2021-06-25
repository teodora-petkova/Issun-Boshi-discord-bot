const Discord = require('discord.js')
const momentTimezone = require('moment-timezone')
const schedule = require('node-schedule')
const mongo = require('../mongo.js')

// remarks:
// - schedule the last message before calling !schedule of the current user (calling the command)

const isValidDate = (date) => {
    const regex = /\d\d\d\d-\d{1,2}-\d{1,2}/
    const found = date.match(regex)
    return found != null
}

const isValidTime = (time) => {
    const regex = /\d{1,2}:\d\d/
    const found = time.match(regex)
    return found != null
}

const isFutureDate = (date) => {
    var currentTime = new Date()
    return (date > currentTime)
}

const getValidMention = (origMention, message) => {
    mention = origMention

    if (!mention)
        return null

    if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1)

        if (mention.startsWith('!') ||
            // an user mention <@!user nickname>
            mention.startsWith('&')) {
            // a role mention <@&role>
            mention = mention.slice(1)
        }

        const user = message.client.users.cache.get(mention)
        if (!user) {
            const concatArrays = (a, b) => { return a.concat(b) }
            const allRoles = message.client.guilds.cache.array().map(g => g.roles.cache.array()).reduce(concatArrays)
            const role = allRoles.find(r => r.id == mention);
            if (!role) {
                message.channel.sendError(`The "${mention}" is an invalid user or role!`)
                return null
            }
        }
        return origMention
    }
    else {
        message.channel.sendError(`The "${mention}" is an invalid user or role!`)
        return null
    }
}

const getLastMessage = async (message) => {
    const channelId = message.author.lastMessageChannelID
    const channel = message.guild.channels.cache.get(channelId)
    const messages = await channel.messages
        .fetch({ limit: 100 })
    const lastMessages = messages.filter(m =>
        m.author.id === message.author.id &&
        !m.content.includes('!schedule'))

    const lastMessage = lastMessages.array()[0]
    return lastMessage
}

const postMessage = async (scheduledMessage, client, dueRemainder) => {
    const { targetDate, content, url, authorTag, guildId, channelId, mention } = scheduledMessage

    const guild = await client.guilds.cache.get(guildId)

    if (!guild) {
        console.error(`Not found guild id for message for ${targetDate}!`)
        return
    }

    const messageChannel = await guild.channels.cache.get(channelId)
    if (!messageChannel) {
        console.error(`Not found channel id for message for ${targetDate}!`)
        return
    }

    // pings of mentioned roles and users do not work inside an embedded message!
    if (mention)
        messageChannel.send(mention)
    const embeddedMessage = new Discord.MessageEmbed()
        .setTitle(`Reminder :alarm_clock: ${dueRemainder}`)
        .setDescription(content.substring(0, 200))
        .setURL(url)
        .setColor("ff0000")
        .setFooter(`requested by @${authorTag}`)
    messageChannel.sendEmbed(embeddedMessage)
}

const getDateAccordingToCurrentTime = async (targetDate) => {
    // missed reminder (because of a server restart or sth else )

    date = targetDate

    var currentTime = new Date()
    if (targetDate < currentTime) {
        currentTime.setTime(currentTime.getTime() + 1000 * 60)
        date = currentTime
    }

    return date
}

const scheduleMessageJob = async (scheduledMessage, client) => {

    const eventDate = scheduledMessage.date

    const oneMinute = 1000 * 60
    const oneHour = oneMinute * 60
    const oneDay = oneHour * 24

    let dateOneHourBefore = await getDateAccordingToCurrentTime(eventDate - oneHour)
    let dateOneDayBefore = await getDateAccordingToCurrentTime(eventDate - oneDay)

    const jobOneDayBefore = schedule.scheduleJob(
        dateOneDayBefore, async () => {
            await postMessage(scheduledMessage, client, "Due in a day!")
        })

    const jobOneHourBefore = schedule.scheduleJob(
        dateOneHourBefore, async () => {
            await postMessage(scheduledMessage, client, "Due in an hour!")
            await mongo.deleteScheduledMessageById(scheduledMessage)
        })

    return { eventDate, dateOneHourBefore, dateOneDayBefore }
}

const scheduleMessageJobWithInfo = async (scheduledMessage, client, channel) => {
    const { eventDate, dateOneHourBefore, dateOneDayBefore } = await scheduleMessageJob(scheduledMessage, client)
    const convertedDate = momentTimezone(eventDate)
        .tz("Europe/Sofia")
        .format('YYYY-MM-DD HH:mm A')
    channel.sendInfo(`Reminders are scheduled for the [event](${scheduledMessage.url}) on ${convertedDate}!`)
}

const rescheduleAllMessages = async (client) => {
    const messages = await mongo.getAllScheduledMessages()

    for (const scheduledMessage of messages) {

        scheduleMessageJob(scheduledMessage, client)
    }
}

const addScheduledMessageToDB = async (lastMessage, targetDate, targetMention) => {

    const scheduledMessage = {
        date: targetDate,
        content: lastMessage.content,
        authorTag: lastMessage.author.tag,
        url: lastMessage.url,
        guildId: lastMessage.guild.id,
        channelId: lastMessage.channel.id,
        mention: targetMention
    }

    return await mongo.insertScheduledMessage(scheduledMessage)
}

const scheduleMessage = async (message, args) => {
    const [date, time, clockType, mention] = args

    if (!isValidDate(date)) {
        message.channel.sendError(`You must provide a correct date format (ex. 2021-06-06 or 2021-6-6), you provided "${date}."`)
        return
    }

    if (!isValidTime(time)) {
        message.channel.sendError(`You must provide a valid time format (ex. 1:23 or 01:23). you provided "${time}."`)
        return
    }

    if (clockType !== 'AM' && clockType !== 'PM') {
        message.channel.sendError(`You must provide either "AM" or "PM", you provided "${clockType}."`)
        return
    }

    const targetDate = momentTimezone.tz(
        `${date} ${time} ${clockType}`,
        'YYYY-MM-DD HH:mm A',
        "Europe/Sofia")

    const targetMention = getValidMention(mention, message)

    if (!isFutureDate(targetDate)) {
        message.channel.sendError(`You must provide a valid date in the future to be scheduled.`)
        return
    }

    const lastMessage = await getLastMessage(message)
    if (!lastMessage) {
        message.channel.sendError(`There are no available messages of "${message.author.tag}" to be scheduled.`)
        return
    }

    try {
        let scheduledMessage = await addScheduledMessageToDB(lastMessage, targetDate, targetMention)
        await scheduleMessageJobWithInfo(scheduledMessage, message.client, message.channel)
    } catch (err) {
        console.error(err)
    }
}

module.exports = {
    name: 'schedule',
    description: '!schedule saves an event for a particular date and reminds a day before.',
    usage: '!schedule <the event date in the format "YYYY-MM-DD HH:mm (AM or PM)"> <@mention>',
    async execute(message, args) {
        await scheduleMessage(message, args)
    },
    rescheduleAllMessages: rescheduleAllMessages
}