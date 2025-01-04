const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { getResolvableDate } = require('../../functions.js');

module.exports = {
    data: {
        name: 'slowmode',
        description: 'Change the slowmode for a channel',
        category: 'Moderation',
        options: [{type: 3, name: 'slowmode', description: 'The duration of the slowmode', required: true}, {type: 7, name: 'channel', description: 'The channel to lock (optional)', required: false}],
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
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.slowmode['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.slowmode['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        var channel = message.channel;

        const invalidTime = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.slowmode['error-messages']['invalid-time'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.slowmode['error-messages']['invalid-time'].message))
        .setTimestamp();

        if(args.length < 2) return sendMessage({embeds: [invalidTime]}).catch(err => {});

        let time;
        if(interaction === false){
            var channelMention = message.mentions.channels.first()
            if(channelMention){
                channel = channelMention;
                if(args.length < 3) return sendMessage({embeds: [invalidTime]}).catch(err => {});
                time = args.slice(1, args.length - 1).join(' ');
            } else {
                time = args.slice(1).join(' ');
            }
        } else {
            if(message.options.getChannel(`channel`)) channel = message.options.getChannel(`channel`);
            time = message.options.getString(`slowmode`);
        }

        let resolvableTime = getResolvableDate(time);
        if(resolvableTime < 0 || resolvableTime > 36e5) return sendMessage({embeds: [invalidTime]}).catch(err => {});
        resolvableTime = Math.round(resolvableTime / 1000);

        channel.setRateLimitPerUser(resolvableTime, `Changed by ${message.member.user.username}`).then(ch => {
            const successEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, undefined, ch, messages.moderation.slowmode.success.title))
            .setDescription(handleMessage(client, message.member.user, undefined, ch, messages.moderation.slowmode.success.message, [{TIME: time}]))
            .setTimestamp();

            sendMessage({embeds: [successEmbed]}).catch(err => {});
        }).catch(err => {
            console.log(`Error while trying to edit channel's slowmode: `, err);

            const errorEmbed = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.slowmode['error-messages'].error.title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.slowmode['error-messages'].error.message))
            .setTimestamp();

            sendMessage({embeds: [errorEmbed]}).catch(err => {});
        });
    }
}