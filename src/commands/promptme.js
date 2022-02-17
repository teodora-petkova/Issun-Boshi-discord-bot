const Discord = require('discord.js')
require('dotenv').config()
const googledrive = require('../utils/googledrive.js')
const { isEmpty, getRandom } = require('../utils/utils.js')
const limits = require('../utils/limits.js')
const { getRole, getAllChannelUsers } = require('../utils/discordutils.js')

async function getPromptsByCategory (rootTextPromptsFolderId) {
    const promptsByFileName = []

    const files = await googledrive.getFiles(rootTextPromptsFolderId)
    for (const file of files) {
        const lines = await googledrive.exportLinesFromFile(file.id)
        promptsByFileName[`${file.name}`] = lines
    }

    return promptsByFileName
}

async function showPrompt (channel, prompt) {
    if (isEmpty(prompt)) {
        channel.sendError('No available text prompts found!')
    } else {
        const embeddedMessage = new Discord.MessageEmbed()
            .setTitle('Challenge Prompt :art: :pencil:')
            .setDescription(prompt)
            .setColor('00ff00')

        channel.sendEmbed(embeddedMessage)
    }
}

function getRandomTextPromptForEachCategory (promptsByCategory) {
    let prompt = ''
    for (const [category, prompts] of Object.entries(promptsByCategory)) {
        prompt += `:star: ${category} : ${getRandom(prompts)}\n`
    }
    return prompt
}

async function showTextPrompts (channel, rootFolderId) {
    const promptsByCategory = await getPromptsByCategory(rootFolderId)

    const prompt = getRandomTextPromptForEachCategory(promptsByCategory)

    showPrompt(channel, prompt)
}

async function showTextPromptsForEachUser (message, role, rootFolderId) {
    const users = getUsersForRole(role, message.channel, message.author.id)
    if (!users || users.length === 0) {
        message.channel.sendError(`No available users found for <@&${role.id}>!`)
    } else {
        const promptsByCategory = await getPromptsByCategory(rootFolderId)
        let usersprompt = ''
        for (const user of users) {
            usersprompt += `<@!${user.id}>\n`
            usersprompt += getRandomTextPromptForEachCategory(promptsByCategory)
        }

        showPrompt(message.channel, usersprompt)
    }
}

function getUsersForRole (role, channel, exceptUserId) {
    const channelUsers = getAllChannelUsers(channel, exceptUserId)
        .map(m => m.user.id)
    return role.members
        .filter(m => channelUsers.includes(m.user.id))
        .map(m => m.user)
}

module.exports = {
    name: 'promptme',
    description: '!promptme shows a random text prompt for exercises from different categories; if <@mention> is used, show prompts for each user for the channel role',
    usage: '!promptme <@mention>',

    async execute (message, args) {
        const commandName = this.name

        const [mention] = args

        const rootTextPromptsFolderId = process.env.GOOGLE_API_TEXT_PROMPTS_FOLDER_ID

        const isDailyLimitReached = await limits.isDailyLimitForCommandReached(message, commandName)
        if (!isDailyLimitReached) {
            if (!isEmpty(mention)) {
                const role = getRole(mention, message.channel)
                if (!role) {
                    message.channel.sendError(`The "${mention}" is an invalid role!`)
                    await showTextPrompts(message.channel, rootTextPromptsFolderId)
                } else {
                    await showTextPromptsForEachUser(message, role, rootTextPromptsFolderId)
                }
            } else {
                await showTextPrompts(message.channel, rootTextPromptsFolderId)
            }
        }
    }
}
