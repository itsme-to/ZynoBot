const { EmbedBuilder } = require("discord.js");
const messages = require('../messages.json');
const handleMessage = require('../handlers/handleMessages.js');

module.exports = {
    data: {
        id: 'unwarn-select',
        description: 'Unwarn a user'
    },
    run: async function(client, interaction, cmd){
        const interactionInfo = client.interactionInfo.get(`unwarn`);

        const interactionUnknown = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.unwarn['error-messages']['unknown-interaction'].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.unwarn['error-messages']['unknown-interaction'].message))
        .setTimestamp();

        const info = interactionInfo.get(interaction.message.id);
        if(!info) return interaction.message.edit({embeds: [interactionUnknown], components: []}).catch(err => {});

        const noPermissions = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.unwarn['error-messages']['no-permissions-2'].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.unwarn['error-messages']['no-permissions-2'].message))
        .setTimestamp();

        if(interaction.member.id !== info.userId) return interaction.message.edit({embeds: [noPermissions], components: []}).catch(err => {});

        var unwarnUser = await client.cache.getUser(info.unwarnUser);
        if(!unwarnUser) return interaction.message.edit({embeds: [interactionUnknown], components: []}).catch(err => {});

        const noWarns = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, unwarnUser, interaction.channel, messages.moderation.unwarn['error-messages']['no-warnings'].title))
        .setDescription(handleMessage(client, interaction.member.user, unwarnUser, interaction.channel, messages.moderation.unwarn['error-messages']['no-warnings'].message))
        .setTimestamp();

        const warns = client.deepCopy(client.warns.get(info.unwarnUser) || []);
        const guildWarns = warns.filter(w => typeof w.guild === 'string' ? w.guild === interaction.guild.id : true);

        if(warns.length === 0) return interaction.message.edit({embeds: [noWarns], components: []}).catch(err => {});

        var index = Number((interaction.values[0] || 0));

        if(!guildWarns[index]) index = 0;

        var warning = warns[index];

        try{
            await client.dbHandler.deleteValue(`warns`, warning, {memberId: info.unwarnUser, guildId: interaction.guild.id});
        } catch {}

        const saved = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, unwarnUser, interaction.channel, messages.moderation.unwarn['success'].title))
        .setDescription(handleMessage(client, interaction.member.user, unwarnUser, interaction.channel, messages.moderation.unwarn['success'].message, [{REASON: warning.reason, WARNER: `<@!${warning.warnedBy}>`}]))
        .setTimestamp();

        interactionInfo.delete(interaction.message.id);

        interaction.message.edit({embeds: [saved], components: []}).catch(err => {});
    }
}