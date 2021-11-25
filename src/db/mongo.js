const mongoose = require('mongoose')
const timestamps = require('../utils/moment.js')
const ScheduledMessageSchema = require('./scheduled-message-schema.js')

function getMessageId(message) {
    return `id:'${message._id}' date:'${message.date}'`
}

function getReminderId(reminder) {
    return `name:'${reminder.name}' date:'${reminder.date}'`
}

async function connect() {
    try {
        await mongoose.connect(process.env.MONGOURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            //reconnectInterval: 1000,
            //reconnectTries: Number.MAX_VALUE,
            keepAlive: true,
            keepAliveInitialDelay: 300000
        })
        mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'))

        console.log('Connect to MongoDB!')
    } catch (err) {
        console.error(err, 'MongoDB connect() has failed.');
    }
}

async function disconnect() {
    try {
        await mongoose.connection.close()
        console.log('Disconnect MongoDB!')

        process.exit(0);
    } catch (err) {
        console.error(err, 'MongoDB diconnect() has failed.');
    }
}

function generateId() {
    return new mongoose.Types.ObjectId()
}

async function addScheduledMessage(scheduledMessage) {
    try {
        await new ScheduledMessageSchema(scheduledMessage)
            .save()
        console.log(`Message ${getMessageId(scheduledMessage)} is added in DB.`)
    } catch (err) {
        console.error(err, `Message ${getMessageId(scheduledMessage)} cannot be added in DB!`)
    }
}

async function getAllScheduledMessages() {
    let allMessages = undefined
    try {
        allMessages = await ScheduledMessageSchema.find({})
    }
    catch (err) {
        console.error(err, `An error while retrieving all scheduled messages!`)
    }
    return allMessages
}

async function getMessage(scheduledMessage) {
    let message = undefined
    try {
        message = await ScheduledMessageSchema.findOne({ _id: scheduledMessage._id })
    } catch (err) {
        console.error(err, `An error while retrieving the message '${scheduledMessage.date}' from DB`);
    }

    if (message) {
        console.log(`Message '${scheduledMessage.date}' is found in DB.`)
    }
    else {
        console.log(`Message '${scheduledMessage.date}' cannot be found.`)
    }
    return message
}

async function removeMessageWithoutReminders(scheduledMessage) {

    const queryNoReminders = {
        $and: [{ _id: scheduledMessage._id },
        {
            $or: [
                { reminders: { $exists: false } },
                { reminders: null },
                { reminders: { $size: 0 } }]
        }
        ]
    }

    try {
        const deleteOneResult = await ScheduledMessageSchema.deleteOne(queryNoReminders)

        if (deleteOneResult.ok === 1) {
            if (deleteOneResult.n === 1 &&
                deleteOneResult.deletedCount === 1) {
                console.log(`Message ${getMessageId(scheduledMessage)} is removed from DB.`)
            }
            else {
                console.log(`Message ${getMessageId(scheduledMessage)} has still reminders assigned to it, so it won't be removed.`)
            }
        }
        else {
            console.log(`Unsuccessful operation: deleteOne for message ${getMessageId(scheduledMessage)}`)
        }
    } catch (err) {
        console.error(err, `An error while removing a message ${getMessageId(scheduledMessage)} from DB!`)
    }
}

async function removeReminderFromScheduledMessage(scheduledMessage, reminder) {
    try {
        const updateOneResult = await ScheduledMessageSchema
            .updateOne(
                { _id: scheduledMessage._id },
                { $pull: { reminders: { _id: reminder._id } } })

        if (updateOneResult.ok === 1) {
            if (updateOneResult.n === 1 &&
                updateOneResult.nModified === 1) {
                console.log(`Reminder ${getReminderId(reminder)} of ${getMessageId(scheduledMessage)} is removed from DB.`)
            }
            else {
                console.log(`No reminder ${getReminderId(reminder)} of ${getMessageId(scheduledMessage)} is found and removed from DB.`)
            }
        }
        else {
            console.log(`Unsuccessful operation: updateOne for reminder ${getReminderId(reminder)} of ${getMessageId(scheduledMessage)} `)
        }
    }
    catch (err) {
        console.error(err, `An error while removing the reminder ${getReminderId(reminder)} of ${getMessageId(scheduledMessage)} from DB.`)
    }
}

module.exports =
{
    // basic DB functions
    connect,
    disconnect,
    generateId,

    // scheduling reminders
    addScheduledMessage,
    getAllScheduledMessages,
    removeMessageWithoutReminders,
    removeReminderFromScheduledMessage,
}