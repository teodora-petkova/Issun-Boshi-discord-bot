const mongoose = require('mongoose')
const { requiredString, requiredDate, number } = require('./dbtypes.js')

const userCommandsUsageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: requiredString,
    channelId: requiredString,
    guildId: requiredString,
    commands:
        [{
            _id: mongoose.Schema.Types.ObjectId,
            name: requiredString,
            count: number,
            date: requiredDate,
        }]
})

module.exports = mongoose.model('userCommandsUsage', userCommandsUsageSchema)