const Discord = require('discord.js')
const fetch = require('node-fetch')
require('dotenv').config()
const googledrive = require('../utils/googledrive.js')
const { isEmpty, getRandom } = require('../utils/utils.js')
const limits = require('../utils/limits.js')

/*
The root picture prompts folder with subfolders for the different prompts (the folder structure):
    - picture prompts
        - clothing
        - hands
        - palette
 */
async function getAllFileIdsByFolderName (rootPromptsFolderId) {
    const filesByFolderName = []

    const foldersByPrompt = await googledrive.getFolders(rootPromptsFolderId)
    for (const folder of foldersByPrompt) {
        const files = await googledrive.getFiles(folder.id)
        filesByFolderName[folder.name] = files.map(file => file.id)
    }

    return filesByFolderName
}

function getImageIdsByPrompt (imageIdsByFolderName, prompt) {
    let images = []
    if (!isEmpty(prompt) && Object.keys(imageIdsByFolderName).includes(prompt)) {
        images = imageIdsByFolderName[prompt]
    } else {
        const merge = arr => arr.reduce((a, e) => a.concat(e), [])
        images = merge(Object.values(imageIdsByFolderName))
    }
    return images
}

async function showPrompts (message, prompt, imageIdsByFolderName) {
    const images = getImageIdsByPrompt(imageIdsByFolderName, prompt)

    if (images !== undefined && images.length === 0) {
        message.channel.sendError('No available images found!')
    } else {
        const imageId = getRandom(images)
        const imageUrl = googledrive.getFileUrl(imageId)
        const embeddedMessage = new Discord.MessageEmbed()
            .setTitle('Challenge Prompt :art:')
            .setURL(imageUrl)
            .setColor('00ff00')
            .setImage(imageUrl)

        message.channel.sendEmbed(embeddedMessage)
    }
}

function getBreed (url) {
    const regex = /https:\/\/images.dog.ceo\/breeds\/(.*)\/(.*)/

    const found = url.match(regex)
    let breed = ''
    if (found != null) {
        breed = found[1]
    }
    return breed
}

async function showDog (message) {
    const url = 'https://dog.ceo/api/breeds/image/random'
    const response = await fetch(url)
    const json = await response.json()

    const breed = getBreed(json.message)
    const imageUrl = json.message

    const embeddedMessage = new Discord.MessageEmbed()
        .setTitle(breed)
        .setURL(imageUrl)
        .setColor('00ff00')
        .setImage(imageUrl)
    message.channel.sendEmbed(embeddedMessage)
}

let availablePrompts = ['hands', 'clothing', 'palette', 'dog']

module.exports = {
    name: 'artme',
    description: '!artme shows a random prompt for exercises',
    usage: `!artme with an optional prompt among [${availablePrompts.join(', ')} etc.]`,

    async execute (message, args) {
        const commandName = this.name

        const [prompt] = args

        // take all folder names as possible prompts (if new folders are added that are not present in the current version of predefined prompts)
        const imageIdsByFolderName = await getAllFileIdsByFolderName(process.env.GOOGLE_API_PICTURE_PROMPTS_FOLDER_ID)
        availablePrompts = [...new Set([...availablePrompts, ...Object.keys(imageIdsByFolderName)])]

        if (!isEmpty(prompt) && !availablePrompts.includes(prompt)) {
            message.channel.sendError(`You must provide no prompt or an available prompt: ${availablePrompts.join(', ')}!`)
            return
        }

        const isDailyLimitReached = await limits.isDailyLimitForCommandReached(message, commandName)
        if (!isDailyLimitReached) {
            if (prompt === 'dog') {
                await showDog(message)
            } else {
                await showPrompts(message, prompt, imageIdsByFolderName)
            }
        }
    }
}
