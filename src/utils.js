const Discord = require('discord.js')

Discord.Channel.prototype.sendEmbed = function (embeddedMessage) {

    this.send(embeddedMessage)
}

Discord.Channel.prototype.sendInfo = function (description) {
    const embeddedMessage = new Discord.MessageEmbed()
        .setTitle("Information :information_source:")
        .setDescription(description)
        .setColor("00ff00")

    this.sendEmbed(embeddedMessage)
}

Discord.Channel.prototype.sendError = function (description) {
    const embeddedMessage = new Discord.MessageEmbed()
        .setTitle("Error :x:")
        .setDescription(description)
        .setColor("ff0000")

    this.sendEmbed(embeddedMessage)
}