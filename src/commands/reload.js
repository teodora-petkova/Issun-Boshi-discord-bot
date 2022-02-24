require('dotenv').config()
const { Permissions } = require('discord.js')
const googledrive = require('../utils/googledrive.js')

module.exports = {
    name: 'reload',
    description: '!reload command reloads the discord bot settings from google drive',
    usage: '!reload',
    userPermissions: [Permissions.FLAGS.ADMINISTRATOR],

    async execute (message, args, invitesHandler) {
        const settings = await googledrive.getWelcomeSettings(process.env.GOOGLE_API_WELCOME_SETTINGS_FILE_ID)
        invitesHandler.loadSettings(settings)

        if (settings && settings.size) {
            message.channel.sendInfo('The google drive settings are reloaded!')
            console.log('Reloaded google drive settings!')
        }
    }
}
