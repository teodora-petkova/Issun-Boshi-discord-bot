const Discord = require('discord.js')
const schedule = require('node-schedule')
const mongo = require('../db/mongo.js')
const moment = require('../utils/moment.js')
const { isEmpty } = require('../utils/utils.js')

function isValidDateFormat(date) {
    const regex = /\d\d\d\d-\d{1,2}-\d{1,2}/
    const found = date.match(regex)
    return found != null
}

function isValidTimeFormat(time) {
    const regex = /\d{1,2}:\d\d/
    const found = time.match(regex)
    return found != null
}

function getValidMention(origMention, message) {
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
    else if (mention === "@everyone" ||
        mention === "@here") {
        return mention
    }
    else {
        message.channel.sendError(`The "${mention}" is an invalid user or role!`)
        return null
    }
}

async function getLastMessage(message) {
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

async function postMessage(scheduledMessage, client, reminderName) {
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
        .setTitle(`Reminder :alarm_clock: ${reminderName}`)
        .setDescription(content.substring(0, 200) + "...")
        .setURL(url)
        .setColor("ff0000")
        .setFooter(`requested by @${authorTag}`)
    messageChannel.sendEmbed(embeddedMessage)
}

async function scheduleMessageJob(scheduledMessage, client) {

    for (const reminder of scheduledMessage.reminders) {

        const reminderDate = moment.getDateAccordingToCurrentTime(reminder.date)

        console.log(`A reminder "${reminder.name}" is scheduled for "${reminderDate}" for the event on "${scheduledMessage.date}".`)

        const job = schedule.scheduleJob(
            reminderDate, async () => {
                await postMessage(scheduledMessage, client, reminder.name)
                await mongo.removeReminderFromScheduledMessage(scheduledMessage, reminder)
                await mongo.removeMessageWithoutReminders(scheduledMessage)
            })
    }
}

async function scheduleMessageJobWithInfo(scheduledMessage, client, channel) {
    await scheduleMessageJob(scheduledMessage, client)

    const formattedDate = moment.getDateInTimeZone(scheduledMessage.date)
    channel.sendInfo(`Reminders are scheduled for the [event](${scheduledMessage.url}) on ${formattedDate}!`)
}

async function rescheduleAllMessages(client) {
    const messages = await mongo.getAllScheduledMessages()

    for (const scheduledMessage of messages) {

        await scheduleMessageJob(scheduledMessage, client)
    }
}

async function addScheduledMessageToDB(lastMessage, targetDate, targetMention) {

    const dateOneHourBefore = moment.getDatePlusOneHour(targetDate)
    const dateOneDayBefore = moment.getDatePlusOneDay(targetDate)

    const reminders = [
        {
            _id: mongo.generateId(),
            name: "Due in a day",
            date: dateOneDayBefore
        },
        {
            _id: mongo.generateId(),
            name: "Due in an hour",
            date: dateOneHourBefore
        }]

    const scheduledMessage = {
        _id: mongo.generateId(),
        date: targetDate,
        content: lastMessage.content,
        authorTag: lastMessage.author.tag,
        url: lastMessage.url,
        guildId: lastMessage.guild.id,
        channelId: lastMessage.channel.id,
        mention: targetMention,
        reminders: reminders
    }

    await mongo.insertScheduledMessage(scheduledMessage)

    return scheduledMessage
}

async function scheduleMessage(message, args) {
    const [date, time, clockType, mention] = args

    if (isEmpty(date) || !isValidDateFormat(date)) {
        message.channel.sendError(`You must provide a correct date format (ex. 2021-12-31, 2021-06-06/2021-6-6 etc.), you provided "${date}."`)
        return
    }

    if (isEmpty(time) || !isValidTimeFormat(time)) {
        message.channel.sendError(`You must provide a valid time format (ex. 1:23 or 01:23). you provided "${time}."`)
        return
    }

    if (isEmpty(clockType) || (clockType !== 'AM' && clockType !== 'PM')) {
        message.channel.sendError(`You must provide either "AM" or "PM", you provided "${clockType}."`)
        return
    }

    const targetDate = moment.parseDate(date, time, clockType)
    if (!moment.isValidDate(targetDate)) {
        message.channel.sendError(`You must provide a valid date, required format: "YYYY-MM-DD HH:mm (AM or PM)"!`)
        return
    }

    if (!moment.isFutureDate(targetDate)) {
        message.channel.sendError(`You must provide a valid date in the future to schedule a reminder.`)
        return
    }

    const targetMention = getValidMention(mention, message)

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
    description: '!schedule saves an event based on the last message of the user executing the command for a particular date and reminds two times - a day and an hour before the event.',
    usage: '!schedule <the event date in the format "YYYY-MM-DD HH:mm (AM or PM)"> <@mention>',
    async execute(message, args) {
        await scheduleMessage(message, args)
    },
    rescheduleAllMessages: rescheduleAllMessages
}