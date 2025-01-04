const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'remove',
        description: 'Remove a user from a ticket',
        category: 'Tickets',
        options: [{type: 6, name: 'user', description: 'The user to remove from the ticket', required: true}],
        defaultEnabled: false,
        permissions: 'ManageMessages',
        visible: true
    },
    run: function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const notTicket = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['not-ticket'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['not-ticket'].message))
        .setTimestamp();
        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-permissions-remove'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-permissions-remove'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();
        const noMention = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-mention-remove'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-mention-remove'].message))
        .setTimestamp();

        const ticketFilter = client.tickets.filter(t => {
            if(Array.isArray(t.value)){
                return t.value.filter(t => typeof t === 'string' ? t === message.channel.id : t.channel === message.channel.id && t.guild === message.guild.id).length > 0;
            } else if(typeof t.value === 'string'){
                return t.value === message.channel.id;
            } else {
                return false;
            }
        });

        if(ticketFilter.size === 0) return sendMessage({embeds: [notTicket]}).catch(err => {});

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions])) return sendMessage({embeds: [noPerms]}).catch(err => {});

        if(interaction === false) if(!message.mentions.members.first()) return sendMessage({embeds: [noMention]}).catch(err => {});
        if(interaction === false) if(message.mentions.members.first().id === client.user.id) return sendMessage({embeds: [noMention]}).catch(err => {});

        var user = interaction === false ? message.mentions.members.first().user : message.options.getUser('user');

        message.channel.permissionOverwrites.delete(user, `User deleted from ticket by ${message.member.user.username}`).then(() => {

            const success = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.tickets.commands['success-messages']['user-removed'].title))
            .setDescription(handleMessage(client, message.member.user, user, message.channel, messages.tickets.commands['success-messages']['user-removed'].message))
            .setTimestamp();

            sendMessage({embeds: [success]}).catch(err => {});

        }).catch(err => {

            const failed = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.tickets.commands['error-messages']['unknown-error-remove'].title))
            .setDescription(handleMessage(client, message.member.user, user, message.channel, messages.tickets.commands['error-messages']['unknown-error-remove'].message))
            .setTimestamp();

            sendMessage({embeds: [failed]}).catch(err => {});

            console.log(`Failed to remove ${user.username} from ticket ${message.channel.name}: `, err);
        });
    }
}