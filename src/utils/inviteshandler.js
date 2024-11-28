const Discord = require('discord.js')
const { getRolePing, getUserPing } = require('./discordutils.js')

class InvitesHandler {
    constructor () {
        this.invites = new Map()
        this.settings = new Map()
    }

    getInvites () {
        return this.invites
    }

    loadSettings (settings) {
        this.settings = settings
    }

    async onLoadInvitesForGuild (guild) {
        if (guild.me.permissions.has('MANAGE_GUILD')) {
            try {
                const guildInvites = await guild.fetchInvites()
                this.invites.set(guild.id, new Map(guildInvites.map((invite) => [invite.code, invite.uses])))

                if (this.invites && this.invites.size) {
                    console.log(`Loaded invites for the guild name='${guild.name}' id='${guild.id}'!`)
                }
            } catch (error) {
                console.error(`Error occurred while fetching invites for the guild name='${guild.name}' id='${guild.id}' \n` + error)
            }
        } else {
            console.warn(`MANAGE_GUILD permission for the bot is required for loading current invites for the guild name='${guild.name}' id='${guild.id}'!`)
        }
    }

    onDeleteInvitesForGuild (guild) {
        this.invites.delete(guild.id)
    }

    async onWelcomeNewMember (member, settings) {
        try {
            if (this.settings && this.settings.size &&
                this.settings.has('channel') &&
                member.guild.me.permissions.has('MANAGE_ROLES')) {
                const logChannel = member.guild.channels.cache.find(channel => channel.name === this.settings.get('channel'))

                let mainMessage = `Здравей, ${getUserPing(member.user.id)}! `
                const reminderMessage = this.settings.has('message') ? this.settings.get('message') : ''

                const newInvites = await member.guild.fetchInvites()
                const oldInvites = this.invites.get(member.guild.id)
                const invite = newInvites.find(i => i.uses > oldInvites.get(i.code))

                if (invite) {
                    const roleName = this.settings.has(invite.code) ? this.settings.get(invite.code) : ''
                    const role = member.guild.roles.cache.find(role => role.name === roleName)

                    if (role) {
                        await member.roles.add(role)

                        mainMessage = `Здравей, ${getUserPing(member.user.id)}, \
                            нашият нов и ценен член на ${getRolePing(role.id)}! `

                        console.log(`INFO: Member (${member.user.id}:${member.user.tag}) has entered with '${invite.code}, added role ${role.id}:${role.name}'`)
                    }
                }

                const embeddedMessage = new Discord.MessageEmbed()
                    .setTitle('Welcome! :tada: :partying_face: :star2:')
                    .setDescription(mainMessage + reminderMessage)
                    .setColor('00ff00')

                logChannel.sendEmbed(embeddedMessage)
            }
        } catch (error) {
            console.error(`Unexpected error during welcoming a new member ${member.user.tag} \
                in the guild name='${member.guild.name}' id='${member.guild.id}'\n` + error)
        }
    }

    onDeleteInvite (invite) {
        this.invites.get(invite.guild.id).delete(invite.code)
    }

    onCreateInvite (invite) {
        this.invites.get(invite.guild.id).set(invite.code, invite.uses)
    }
}

module.exports = InvitesHandler
