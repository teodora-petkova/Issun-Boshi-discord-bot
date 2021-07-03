const mongoose = require('mongoose')

const requiredString = {
    type: String,
    required: true
}

const requiredDate = {
    type: Date,
    required: true
}

const scheduledMessageSchema = mongoose.Schema({
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

module.exports = mongoose.model('message', scheduledMessageSchema)
