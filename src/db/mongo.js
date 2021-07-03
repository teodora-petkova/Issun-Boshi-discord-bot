const mongoose = require('mongoose')
const MessageSchema = require('./message-schema.js')
const timestamps = require('../utils/moment.js')

function getMessageId(message) {
    return `id:"${message._id}" date:"${message.date}"`
}

function getReminderId(reminder) {
    return `name:"${reminder.name}" date:"${reminder.date}"`
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

        console.log("Connect to MongoDB!")
    } catch (err) {
        console.error(err, 'MongoDB connection failed.');
    }
}

async function disconnect() {
    await mongoose.connection.close()
    console.log("Disconnect MongoDB!")
    process.exit(0);
}

function generateId() {
    return new mongoose.Types.ObjectId()
}

async function insertScheduledMessage(scheduledMessage) {
    await new MessageSchema(scheduledMessage).save()
        .then(saveResult => {
            console.log(`Message ${getMessageId(scheduledMessage)} is added in DB.`)
        })
        .catch(err => {
            console.error(err, `Message ${getMessageId(scheduledMessage)} cannot be added in DB!`)
        })
}

async function getAllScheduledMessages() {
    return await MessageSchema.find({})
}

async function getMessage(scheduledMessage) {
    let message = undefined
    try {
        message = await MessageSchema.findOne({ _id: scheduledMessage._id })
    }
    catch (err) {
        console.error(err, `Error while retrieving the message "${scheduledMessage.date}" from DB`);
    }
    if (message) {
        console.log(`Message "${scheduledMessage.date}" is found in DB.`)
    }
    else {
        console.log(`Message "${scheduledMessage.date}" cannot be found.`)
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

    await MessageSchema.deleteOne(queryNoReminders,
        (err, deleteOneResult) => {
            if (err) {
                console.error(err, `Message  cannot be removed from DB.`)
            }
            else {
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
            }
        })
}

async function removeReminderFromScheduledMessage(scheduledMessage, reminder) {
    await MessageSchema
        .updateOne(
            { _id: scheduledMessage._id },
            { $pull: { reminders: { _id: reminder._id } } },
            (err, updateOneResult) => {
                if (err) {
                    console.error(err, `Reminder ${getReminderId(reminder)} of ${getMessageId(scheduledMessage)} cannot be removed from DB.`)
                }
                else {
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
                        console.log(`Unsuccessful operation: updateOne for reminder ${getReminderId(reminder)} of ${getMessageId(scheduledMessage)}`)
                    }
                }
            })
}

module.exports =
{
    connect,
    disconnect,
    generateId,
    insertScheduledMessage,
    getAllScheduledMessages,
    removeMessageWithoutReminders,
    removeReminderFromScheduledMessage
}