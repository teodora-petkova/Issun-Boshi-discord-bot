const Discord = require('discord.js')
const fetch = require('node-fetch')
const { parsed, error } = require('dotenv').config()
const { google } = require('googleapis');
const { isEmpty, getRandom } = require('../utils/utils.js');
const limits = require('../utils/limits.js')

async function getAllFileIdsByFolderName(resource) {

    const drive = google.drive({ version: "v3", auth: resource.auth })

    async function executeQuery(query, fields) {
        const params = {
            q: query,
            fields: fields,
            orderBy: "name",
            pageSize: 1000,
            pageToken: "",
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
        }

        const res = await drive.files.list(params)
        return res
    }

    async function getFiles(folderId) {
        const params = {
            q: "'" + folderId + "' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed=false",
            fields: "files(createdTime,description,id,mimeType,modifiedTime,name,owners,parents,permissions,shared,size,webContentLink,webViewLink),nextPageToken"
        }
        const res = await executeQuery(params.q, params.fields)
        return res.data.files.map(f => f.id)
    }

    async function getFilesInFolders(folderId) {
        let filesByFolderName = []

        const params = {
            q: "'" + folderId + "' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields: "files(id,mimeType,name,parents,size),nextPageToken"
        }

        const res = await executeQuery(params.q, params.fields)
        for (const folder of res.data.files) {
            let files = await getFiles(folder.id)
            filesByFolderName[folder.name] = files
        }
        return filesByFolderName
    }

    let filesByFolderName = await getFilesInFolders(resource.id)

    return filesByFolderName
}

function getImageIdsByPrompt(imageIdsByFolderName, prompt) {
    if (!isEmpty(prompt) && Object.keys(imageIdsByFolderName).includes(prompt)) {
        images = imageIdsByFolderName[prompt]
    }
    else {
        const merge = arr => arr.reduce((a, e) => a.concat(e), []);
        images = merge(Object.values(imageIdsByFolderName))
    }
    return images;
}

async function showPrompts(message, prompt, resource) {

    let imageIdsByFolderName = await getAllFileIdsByFolderName(resource)
    let images = getImageIdsByPrompt(imageIdsByFolderName, prompt)

    if (images != undefined && images.length == 0) {
        message.channel.sendError(`No available images found!`)
    }
    else {
        const imageId = getRandom(images)
        const imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`
        const embeddedMessage = new Discord.MessageEmbed()
            .setTitle("Challenge Prompt :art:")
            .setURL(imageUrl)
            .setColor("00ff00")
            .setImage(imageUrl)

        message.channel.sendEmbed(embeddedMessage)
    }
}

function getBreed(url) {
    const regex = /https:\/\/images.dog.ceo\/breeds\/(.*)\/(.*)/

    const found = url.match(regex)
    let breed = ''
    if (found != null) {
        breed = found[1]
    }
    return breed
}

async function showDog(message) {
    let url = 'https://dog.ceo/api/breeds/image/random'
    let response = await fetch(url)
    let json = await response.json()

    let breed = getBreed(json.message)
    let imageUrl = json.message

    const embeddedMessage = new Discord.MessageEmbed()
        .setTitle(breed)
        .setURL(imageUrl)
        .setColor("00ff00")
        .setImage(imageUrl)
    message.channel.sendEmbed(embeddedMessage)
}

const availablePrompts = ["hands", "clothing", "palette", "dog"]

module.exports = {
    name: 'artme',
    description: '!artme shows a random prompt for exercises',
    usage: `!artme with an optional prompt among [${availablePrompts.join(', ')}]`,

    async execute(message, args) {
        const commandName = this.name

        const isDailyLimitReached = await limits.isDailyLimitForCommandReached(message, commandName)
        if (!isDailyLimitReached) {
            const resource = {
                auth: process.env.GOOGLE_API_KEY,
                id: process.env.GOOGLE_API_FOLDER_ID
            };
            const [prompt] = args

            if (!isEmpty(prompt) && !availablePrompts.includes(prompt)) {
                message.channel.sendError(`You must provide no prompt or an available prompt: ${availablePrompts.join(', ')}!`)
                return
            }

            if (prompt == 'dog') {
                await showDog(message);
            }
            else {
                await showPrompts(message, prompt, resource)
            }
        }
    }
}