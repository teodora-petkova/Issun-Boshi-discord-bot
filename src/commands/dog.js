const Discord = require('discord.js')
const fetch = require('node-fetch')

function getBreed(url) {
    const regex = /https:\/\/images.dog.ceo\/breeds\/(.*)\/(.*)/

    const found = url.match(regex)
    let breed = ''
    if (found != null) {
        breed = found[1]
    }
    return breed
}

module.exports = {
    name: 'dog',
    description: '!dog shows a random dog with its breed',
    usage: '!dog',

    async execute(message, args) {
        data = []

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
    },
}