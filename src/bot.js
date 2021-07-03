console.log('Beep beep! 🤖')
const { parsed, error } = require('dotenv').config()
const Discord = require('discord.js')
const commandsjs = require('./commands.js')
const schedulejs = require('./commands/schedule.js')
const mongo = require('./db/mongo.js')

const client = new Discord.Client()
client.login(process.env.BOTTOKEN)

mongo.connect()

// reschedule all messages on restart of the server
schedulejs.rescheduleAllMessages(client)

client.on('ready', () => console.log('💖'))
client.commands = commandsjs.getCommands()
client.on('message', message => commandsjs.commandHandler(client, message))

// if the node process ends, close the Mongoose connection
function handle(signal) {
    mongo.disconnect()
    console.log(`Received ${signal}`);
}

process.on('SIGINT', handle)
process.on('SIGTERM', handle)