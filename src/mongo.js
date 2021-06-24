const mongoose = require('mongoose')
const MessageSchema = require('./schemas/message-schema')

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

async function insertScheduledMessage(scheduledMessage) {
    try {
        return await new MessageSchema(scheduledMessage).save()
    } catch (err) {
        console.error(err, 'Message cannot be added in MongoDB');
    }
}

async function getAllScheduledMessages() {
    return await MessageSchema.find({})
}

async function deleteScheduledMessageById(scheduledMessage) {
    await MessageSchema.deleteOne({ _id: scheduledMessage.id }, function (err) {
        if (!err) {
            console.log('Message is removed from DB.')
        }
        else {
            console.error(err, "Message cannot be removed from MongoDB")
        }
    })
}

module.exports =
{
    connect: connect,
    disconnect: disconnect,
    insertScheduledMessage: insertScheduledMessage,
    getAllScheduledMessages: getAllScheduledMessages,
    deleteScheduledMessageById: deleteScheduledMessageById
}