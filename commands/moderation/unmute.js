const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'unmute',
        description: 'Unmute a muted user from the server',
        category: 'Moderation',
        options: [{type: 6, name: 'user', description: 'The user to unmute from the server', required: true}, {type: 3, name: 'reason', description: 'The reason to unmute the user', required: false}],
        defaultEnabled: false,
        permissions: 'ModerateMembers',
        visible: true
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unmute['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unmute['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const noMember = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unmute['error-messages']['no-mention'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unmute['error-messages']['no-mention'].message))
        .setTimestamp();

        if(interaction === false){
            if(!message.mentions.members.first()) return sendMessage({embeds: [noMember]}).catch(err => {});
        }

        var member = interaction === false ? message.mentions.members.first() : await client.cache.getMember(message.options.getUser('user').id, message.guild);
        if(!member) return sendMessage({embeds: [noMember]}).catch(err => {});

        const unmuteable = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unmute['error-messages']['unmuteable'].title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unmute['error-messages']['unmuteable'].message))
        .setTimestamp();

        if(member.moderatable === false) return sendMessage({embeds: [unmuteable]}).catch(err => {});

        var reason = handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unmute['no-reason']);
        if(args[2]){
            reason = args.slice(2).join(" ");
        }

        const muted = member.isCommunicationDisabled();

        const userNotMuted = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unmute['error-messages']['not-muted'].title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unmute['error-messages']['not-muted'].message))
        .setTimestamp();

        if(!muted) return sendMessage({embeds: [userNotMuted]}).catch(err => {});

        const success = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unmute['success'].title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unmute['success'].message, [{REASON: reason}]))
        .setTimestamp();

        const failed = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unmute['error-messages']['error'].title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unmute['error-messages']['error'].message))
        .setTimestamp();

        member.disableCommunicationUntil(null, reason).then(() => {
            sendMessage({embeds: [success]}).catch(err => {});
        }).catch(err => {
            sendMessage({embeds: [failed]}).catch(err => {});
        });
    }
}