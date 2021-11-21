const mongoose = require('mongoose')
const { requiredString, requiredDate } = require('./dbtypes.js')

const ScheduledMessageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    date: requiredDate,
    content: requiredString,
    url: requiredString,
    authorTag: requiredString,
    guildId: requiredString,
    channelId: requiredString,
    mention: { type: String },
    reminders:
        [{
            _id: mongoose.Schema.Types.ObjectId,
            name: requiredString,
            date: requiredDate
        }]
})

module.exports = mongoose.model('scheduledMessage', ScheduledMessageSchema)
