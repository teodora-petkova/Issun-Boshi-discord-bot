const mongoose = require('mongoose')
const { requiredString, number } = require('./dbtypes.js')

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,

    id: requiredString,
    channelId: requiredString,
    guildId: requiredString,

    name: requiredString,
    channelName: requiredString,
    guildName: requiredString,

    commands: [{
        _id: mongoose.Schema.Types.ObjectId,
        name: requiredString,
        createdAt: { type: Date, default: Date.now },
        callsCount: number
    }],

    modifiedAt: { type: Date, expires: '1d', default: Date.now } // expired in 2 minutes
})

userSchema.virtual('fullId')
    .get(function () {
        return `name:'${this.name}' guild:'${this.guildName}' channel: '${this.channelName}'` // \
        // (id:'${this.id}' guildId:'${this.guildId}' channelId: '${this.channelId}')`
    })

module.exports = mongoose.model('user', userSchema)
