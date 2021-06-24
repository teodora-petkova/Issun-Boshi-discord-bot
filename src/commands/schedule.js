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

const postMessage = async (scheduledMessage, client) => {
    const { targetDate, content, url, authorTag, guildId, channelId } = scheduledMessage

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

    const embeddedMessage = new Discord.MessageEmbed()
        .setTitle("Reminder")
        .setDescription(content.substring(0, 200))
        .setURL(url)
        .setColor("ff0000")
        .setFooter(`Requested by @${authorTag}`)
    messageChannel.sendEmbed(embeddedMessage)

    await mongo.deleteScheduledMessageById(scheduledMessage)
}

const rescheduleAllMessages = async (client) => {
    const messages = await mongo.getAllScheduledMessages()

    for (const scheduledMessage of messages) {

        let date = scheduledMessage.date

        var currentTime = new Date()
        if (date < currentTime) {
            currentTime.setTime(currentTime.getTime() + 1000 * 60)
            date = currentTime
        }

        const job = schedule.scheduleJob(
            date, async () => {
                await postMessage(scheduledMessage, client)
            })
    }
}

const scheduleMessageJob = async (scheduledMessage, client, channel) => {

    let date = scheduledMessage.date

    var currentTime = new Date()
    if (date < currentTime) {
        currentTime.setTime(currentTime.getTime() + 1000 * 60)
        date = currentTime
    }

    const job = schedule.scheduleJob(
        date, async () => {
            await postMessage(scheduledMessage, client, channel)
        })

    channel.sendInfo(`Your last message is scheduled for ${date}!`)
}

const addScheduledMessageToDB = async (message, targetDate) => {
    const channelId = message.author.lastMessageChannelID
    const channel = message.guild.channels.cache.get(channelId)
    const messages = await channel.messages
        .fetch({ limit: 100 })
    const lastMessages = messages.filter(m =>
        m.author.id === message.author.id &&
        !m.content.includes('!schedule'))

    const lastMessage = lastMessages.array()[0]

    const scheduledMessage = {
        date: targetDate,
        content: lastMessage.content,
        authorTag: lastMessage.author.tag,
        url: lastMessage.url,
        guildId: lastMessage.guild.id,
        channelId: lastMessage.channel.id
    }

    return await mongo.insertScheduledMessage(scheduledMessage)
}

const scheduleMessage = async (message, args) => {
    const [date, time, clockType] = args

    if (!isValidDate(date)) {
        message.channel.sendError(`You must provide a correct date format (ex. 2021-06-06 or 2021-6-6), you provided "${date}"`)
        return
    }

    if (!isValidTime(time)) {
        message.channel.sendError(`You must provide a valid time format (ex. 1:23 or 01:23). you provided "${time}"`)
        return
    }

    if (clockType !== 'AM' && clockType !== 'PM') {
        message.channel.sendError(`You must provide either "AM" or "PM", you provided "${clockType}"`)
        return
    }

    const targetDate = momentTimezone.tz(
        `${date} ${time} ${clockType}`,
        'YYYY-MM-DD HH:mm A',
        "Europe/Sofia")

    if (!isFutureDate(targetDate)) {
        message.channel.sendError(`You must provide a valid date in the future to schedule`)
        return
    }

    try {
        let scheduledMessage = await addScheduledMessageToDB(message, targetDate)
        await scheduleMessageJob(scheduledMessage, message.client, message.channel)
    } catch (err) {
        console.error(err)
    }
}

module.exports = {
    name: 'schedule',
    description: '!schedule saves an event for a particular date and reminds a day before.',
    usage: '!schedule <the event date in the format "YYYY-MM-DD HH:mm (AM or PM)">',
    async execute(message, args) {
        scheduleMessage(message, args)
    },
    rescheduleAllMessages: rescheduleAllMessages
}