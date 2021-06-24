const mongoose = require('mongoose')

const requiredString = {
    type: String,
    required: true
}

const scheduledMessageSchema = mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    content: requiredString,
    url: requiredString,
    authorTag: requiredString,
    guildId: requiredString,
    channelId: requiredString
})

module.exports = mongoose.model('message', scheduledMessageSchema)
