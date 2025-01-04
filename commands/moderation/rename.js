const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'rename',
        description: 'Rename a channel',
        category: 'Moderation',
        options: [{type: 3, name: 'name', description: 'The new channel name', required: true}, {type: 7, name: 'channel', description: 'The channel to lock (optional)', required: false}],
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
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.rename['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.rename['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        var channel = message.channel;

        if(interaction === false){
            var channelMention = message.mentions.channels.first()
            if(channelMention) channel = channelMention;
        } else {
            if(message.options.getChannel(`channel`)) channel = message.options.getChannel(`channel`);
        }

        const wrongName = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.rename['error-messages']['no-name'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.rename['error-messages']['no-name'].message))
        .setTimestamp();

        if(args.length < 2) return sendMessage({embeds: [wrongName]}).catch(err => {});

        var newName = args.slice(1).join(' ');
        if(newName.indexOf(channel.toString()) >= 0) newName = newName.split(channel.toString()).join('');

        channel.setName(newName, `Changed by ${message.member.user.username}`).then(ch => {
            const successEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, undefined, ch, messages.moderation.rename.success.title))
            .setDescription(handleMessage(client, message.member.user, undefined, ch, messages.moderation.rename.success.message))
            .setTimestamp();

            sendMessage({embeds: [successEmbed]}).catch(err => {});
        }).catch(err => {
            console.log(`Error while trying to edit channel name: `, err);

            const errorEmbed = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.rename['error-messages'].error.title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.rename['error-messages'].error.message))
            .setTimestamp();

            sendMessage({embeds: [errorEmbed]}).catch(err => {});
        });
    }
}