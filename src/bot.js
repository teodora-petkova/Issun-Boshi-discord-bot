require('dotenv').config()
const Discord = require('discord.js')
const commandsjs = require('./commands.js')
const schedulejs = require('./commands/schedule.js')
const mongo = require('./db/mongo.js')

const client = new Discord.Client()

function loginBot () {
    client.login(process.env.BOTTOKEN)

    mongo.connect()

    // reschedule all messages on restart of the server
    schedulejs.rescheduleAllMessages(client)

    client.on('ready', () => {
        console.log('💖')
    })

    client.commands = commandsjs.getCommands()
    client.on('message', async (message) => await commandsjs.commandHandler(client, message))
}

// if the node process ends, close the Mongoose connection
function handle (signal) {
    mongo.disconnect()
    console.log(`Received ${signal}`)
}

function logoutBot () {
    process.on('SIGINT', handle)
    process.on('SIGTERM', handle)
}

module.exports = {
    client: client,
    loginBot: loginBot,
    logoutBot: logoutBot
}

loginBot()
logoutBot()
