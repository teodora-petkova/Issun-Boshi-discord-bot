const Discord = require('discord.js')
require('dotenv').config()
const googledrive = require('../utils/googledrive.js')
const { isEmpty, getRandom } = require('../utils/utils.js')
const limits = require('../utils/limits.js')

async function getPromptsByCategory (rootTextPromptsFolderId) {
    const promptsByFileName = []

    const files = await googledrive.getFiles(rootTextPromptsFolderId)
    for (const file of files) {
        const lines = await googledrive.exportLinesFromFile(file.id)
        promptsByFileName[`${file.name}`] = lines
    }

    return promptsByFileName
}

async function showTextPrompts (message, rootFolderId) {
    const promptsByCategory = await getPromptsByCategory(rootFolderId)

    let prompt = ''
    for (const [category, prompts] of Object.entries(promptsByCategory)) {
        prompt += `:star: ${category} : ${getRandom(prompts)}\n`
    }
    if (isEmpty(prompt)) {
        message.channel.sendError('No available text prompts found!')
    } else {
        const embeddedMessage = new Discord.MessageEmbed()
            .setTitle('Challenge Prompt :art: :pencil:')
            .setDescription(prompt)
            .setColor('00ff00')

        message.channel.sendEmbed(embeddedMessage)
    }
}

module.exports = {
    name: 'promptme',
    description: '!promptme shows a random text prompt for exercises from different categories',
    usage: '!promptme',

    async execute (message) {
        const commandName = this.name

        const isDailyLimitReached = await limits.isDailyLimitForCommandReached(message, commandName)
        if (!isDailyLimitReached) {
            await showTextPrompts(message, process.env.GOOGLE_API_TEXT_PROMPTS_FOLDER_ID)
        }
    }
}
