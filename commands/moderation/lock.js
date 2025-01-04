const { EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'lock',
        description: 'Lock a channel so no one is able to speak in it',
        category: 'Moderation',
        options: [{type: 7, name: 'channel', description: 'The channel to lock (optional)', required: false}],
        defaultEnabled: false,
        permissions: 'ManageChannels',
        visible: true
    },
    run: function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);
        
        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.lock['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.lock['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        var channel = message.channel;

        if(interaction === false){
            var channelMention = message.mentions.channels.first()
            if(channelMention) channel = channelMention;
        } else {
            if(message.options.getChannel(`channel`)) channel = message.options.getChannel(`channel`);
        }

        const wrongType = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.lock['error-messages']['wrong-channel-type'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.lock['error-messages']['wrong-channel-type'].message))
        .setTimestamp();

        if(channel.type !== ChannelType.GuildText) return sendMessage({embeds: [wrongType]}).catch(err => {});

        var bitfield = {};
        bitfield[PermissionFlagsBits.SendMessages] = false;

        channel.permissionOverwrites.edit(message.guild.roles.everyone.id, bitfield).then(() => {
            const lockEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.lock.success.title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.lock.success.message, [{LOCK_CHANNEL: `<#${channel.id}>`}]))
            .setTimestamp();

            sendMessage({embeds: [lockEmbed]}).catch(err => {});
        }).catch(err => {
            console.log(`Error while locking channel: `, err);
            const errorEmbed = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.lock['error-messages'].error.title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.lock['error-messages'].error.message, [{LOCK_CHANNEL: `<#${channel.id}>`}]))
            .setTimestamp();

            sendMessage({embeds: [errorEmbed]}).catch(err => {});
        });
    }
}