const { EmbedBuilder } = require("discord.js");
const messages = require('../messages.json');
const handleMessage = require('../handlers/handleMessages.js');

module.exports = {
    data: {
        id: 'mute',
        description: 'Mute a user'
    },
    run: async function(client, interaction){
        const interactionInfo = client.interactionInfo.get(`mute`);

        const interactionUnknown = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.mute['error-messages']['unknown-interaction'].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.mute['error-messages']['unknown-interaction'].message))
        .setTimestamp();

        const info = interactionInfo.get(interaction.message.id);
        if(!info) return interaction.message.edit({embeds: [interactionUnknown], components: []}).catch(err => {});

        const noPermissions = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.mute['error-messages']["no-permissions-2"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.mute['error-messages']["no-permissions-2"].message))
        .setTimestamp();

        if(interaction.member.id !== info.moderator) return interaction.message.edit({embeds: [noPermissions], components: []}).catch(err => {});

        var length = Number((interaction.values[0] || 0));

        if(length === 0) return interaction.message.delete().catch(err => {});

        const guildMember = await client.cache.getMember(info.member, interaction.guild);
        if(!guildMember) return interaction.message.edit({embeds: [interactionUnknown], components: []}).catch(err => {});

        const timestamp = new Date().getTime() + Number(length);

        const timeOpt = info.time.filter(t => t.value === Number(length))[0];

        const success = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, guildMember.user, interaction.channel, messages.moderation.mute['success'].title))
        .setDescription(handleMessage(client, interaction.member.user, guildMember.user, interaction.channel, messages.moderation.mute["success"].message, [{TIME: timeOpt.string, REASON: info.reason}]))
        .setTimestamp();

        const failed = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, guildMember.user, interaction.channel, messages.moderation.mute['error-messages'].error.title))
        .setDescription(handleMessage(client, interaction.member.user, guildMember.user, interaction.channel, messages.moderation.mute['error-messages'].error.message))
        .setTimestamp();

        interactionInfo.delete(interaction.message.id);

        guildMember.disableCommunicationUntil(timestamp, info.reason).then(() => {
            interaction.message.edit({embeds: [success], components: []}).catch(err => {});
        }).catch(err => {
            console.log(`Error while trying to mute ${guildMember.user.username}: `, err);

            interaction.message.edit({embeds: [failed], components: []}).catch(err => {});
        });
    }
}