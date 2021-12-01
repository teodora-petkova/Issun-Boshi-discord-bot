const mongoose = require('mongoose')

const ScheduledMessageSchema = require('./scheduled-message-schema.js')
const UserModel = require('./user-schema.js')

function getMessageId (message) {
    return `id:'${message._id}' date:'${message.date}'`
}

function getReminderId (reminder) {
    return `name:'${reminder.name}' date:'${reminder.date}'`
}

async function connect () {
    try {
        await mongoose.connect(process.env.MONGOURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // reconnectInterval: 1000,
            // reconnectTries: Number.MAX_VALUE,
            keepAlive: true,
            keepAliveInitialDelay: 300000
        })
        mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'))

        console.log('Connect to MongoDB!')
    } catch (err) {
        console.error(err, 'MongoDB connect() has failed.')
    }
}

async function disconnect () {
    try {
        await mongoose.connection.close()
        console.log('Disconnect MongoDB!')

        process.exit(0)
    } catch (err) {
        console.error(err, 'MongoDB diconnect() has failed.')
    }
}

function generateId () {
    return new mongoose.Types.ObjectId()
}

async function addScheduledMessage (scheduledMessage) {
    try {
        await new ScheduledMessageSchema(scheduledMessage)
            .save()
        console.log(`Message ${getMessageId(scheduledMessage)} is added in DB.`)
    } catch (err) {
        console.error(err, `Message ${getMessageId(scheduledMessage)} cannot be added in DB!`)
    }
}

async function getAllScheduledMessages () {
    let allMessages
    try {
        allMessages = await ScheduledMessageSchema.find({})
    } catch (err) {
        console.error(err, 'An error while retrieving all scheduled messages!')
    }
    return allMessages
}

/*
async function getMessage (scheduledMessage) {
    let message
    try {
        message = await ScheduledMessageSchema.findOne({ _id: scheduledMessage._id })
    } catch (err) {
        console.error(err, `An error while retrieving the message '${scheduledMessage.date}' from DB`)
    }

    if (message) {
        console.log(`Message '${scheduledMessage.date}' is found in DB.`)
    } else {
        console.log(`Message '${scheduledMessage.date}' cannot be found.`)
    }
    return message
}
*/

async function removeMessageWithoutReminders (scheduledMessage) {
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
            } else {
                console.log(`Message ${getMessageId(scheduledMessage)} has still reminders assigned to it, so it won't be removed.`)
            }
        } else {
            console.log(`Unsuccessful operation: deleteOne for message ${getMessageId(scheduledMessage)}`)
        }
    } catch (err) {
        console.error(err, `An error while removing a message ${getMessageId(scheduledMessage)} from DB!`)
    }
}

async function removeReminderFromScheduledMessage (scheduledMessage, reminder) {
    try {
        const updateOneResult = await ScheduledMessageSchema
            .updateOne(
                { _id: scheduledMessage._id },
                { $pull: { reminders: { _id: reminder._id } } })

        if (updateOneResult.ok === 1) {
            if (updateOneResult.n === 1 &&
                updateOneResult.nModified === 1) {
                console.log(`Reminder ${getReminderId(reminder)} of ${getMessageId(scheduledMessage)} is removed from DB.`)
            } else {
                console.log(`No reminder ${getReminderId(reminder)} of ${getMessageId(scheduledMessage)} is found and removed from DB.`)
            }
        } else {
            console.log(`Unsuccessful operation: updateOne for reminder ${getReminderId(reminder)} of ${getMessageId(scheduledMessage)} `)
        }
    } catch (err) {
        console.error(err, `An error while removing the reminder ${getReminderId(reminder)} of ${getMessageId(scheduledMessage)} from DB.`)
    }
}

function getUserId (userData) {
    return `name:'${userData.name}' guild:'${userData.guildName}' channel: '${userData.channelName}'` // \
// (id:'${userData.id}' guildId:'${userData.guildId}' channelId: '${userData.channelId}')`
}

//  max 3 calls for a day - added one with the call of the command + 2 more
const maxCallsCountPerDay = 2
function initUserCommand (commandName) {
    return {
        _id: generateId(),
        name: commandName,
        callsCount: maxCallsCountPerDay
    }
}

async function getUser (userData) {
    let user
    try {
        user = await UserModel
            .findOne({
                id: userData.id,
                guildId: userData.guildId,
                channelId: userData.channelId
            })
    } catch (err) {
        console.error(err, `An error while retrieving the user ${getUserId(userData)} from DB`)
    }
    if (user) {
        console.log(`User ${getUserId(userData)} is found in DB.`)
    } else {
        console.log(`User ${getUserId(userData)} cannot be found in DB.`)
    }
    return user
}

function getUserCommand (user, commandName) {
    let command
    try {
        command = user.commands.find(c => c.name === commandName)
    } catch (err) {
        console.error(err, `An error while retrieving the command '${commandName}' for the user '${user.fullId}' from DB.`)
    }
    if (command) {
        console.log(`The command '${commandName}' for the user '${user.fullId}' is found in DB.`)
    } else {
        console.log(`The command '${commandName}' for the user '${user.fullId}' cannot be found.`)
    }
    return command
}

async function addUserWithCommand (userData, commandName) {
    const newUser = {
        _id: generateId(),
        id: userData.id,
        name: userData.name,
        guildId: userData.guildId,
        guildName: userData.guildName,
        channelId: userData.channelId,
        channelName: userData.channelName,
        commands: [initUserCommand(commandName)]
    }

    try {
        const saveResult = await new UserModel(newUser).save()

        if (saveResult) {
            console.log(`User ${getUserId(userData)} with command:'${commandName}' is added in DB.`)
        }
    } catch (err) {
        console.error(err, `An error while adding an user ${getUserId(userData)} with a command '${commandName}'.`)
    }
}

async function addCommandForUser (userData, commandName) {
    let updateOneResult
    try {
        updateOneResult = await UserModel
            .updateOne(
                {
                    id: userData.id,
                    guildId: userData.guildId,
                    channelId: userData.channelId
                },
                {
                    $set: { modifiedAt: Date.now() },
                    $push: { commands: [initUserCommand(commandName)] }
                })
    } catch (err) {
        console.error(err, `An error while adding the command '${commandName}' for the user ${getUserId(userData)}.`)
    }
    if (updateOneResult.ok === 1) {
        if (updateOneResult.n === 1 &&
            updateOneResult.nModified === 1) {
            console.log(`The command '${commandName}' for the user ${getUserId(userData)} is added in DB.`)
        } else {
            console.log(`No command '${commandName}' for the ${getUserId(userData)} is added in DB.`)
        }
    } else {
        console.log(`Unsuccessful operation: updateOne with adding a new command '${commandName}' for the user ${getUserId(userData)}.`)
    }
}

async function decrementCommandUsesCount (userData, commandName) {
    let updateOneResult
    try {
        updateOneResult = await UserModel
            .updateOne(
                {
                    id: userData.id,
                    guildId: userData.guildId,
                    channelId: userData.channelId,
                    'commands.name': commandName
                },
                { $inc: { 'commands.$.callsCount': -1 } })
    } catch (err) {
        console.error(err, `An error while decrementing the count of uses of the command '${commandName}' for the user ${getUserId(userData)} in DB.`)
    }

    if (updateOneResult.ok === 1) {
        if (updateOneResult.n === 1 &&
            updateOneResult.nModified === 1) {
            console.log(`The count of command '${commandName}' for the user ${getUserId(userData)} is decremented in DB.`)
        } else {
            console.log(`No command '${commandName}' for the user ${getUserId(userData)} is updated in DB.`)
        }
    } else {
        console.log(`Unsuccessful operation: updateOne for the command '${commandName}' for the user ${getUserId(userData)}'.`)
    }
}

async function resetCommandForUser (userData, commandName, date) {
    let updateOneResult
    try {
        updateOneResult = await UserModel
            .updateOne(
                {
                    id: userData.id,
                    guildId: userData.guildId,
                    channelId: userData.channelId,
                    'commands.name': commandName
                },
                {
                    $set:
                    {
                        modifiedAt: Date.now,
                        'commands.$.createdAt': Date.now,
                        'commands.$.callsCount': maxCallsCountPerDay
                    }
                })
    } catch (err) {
        console.error(err, `An error while reseting the count of uses of the command:'${commandName}' for the user ${getUserId(userData)} in DB.`)
    } if (updateOneResult.ok === 1) {
        if (updateOneResult.n === 1 &&
            updateOneResult.nModified === 1) {
            console.log(`The command '${commandName}' for the user ${getUserId(userData)} is reset with the max count and the current date in DB.`)
        } else {
            console.log(`No user ${getUserId(userData)} is found and no command is updated in DB.`)
        }
    } else {
        console.log(`Unsuccessful operation: updateOne for reseting the command '${commandName}' for the user ${getUserId(userData)}.`)
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

    // keeping track of the used commands for an user (because of limits per day)
    getUser,
    getUserCommand,
    addUserWithCommand,
    addCommandForUser,
    resetCommandForUser,
    decrementCommandUsesCount
}
