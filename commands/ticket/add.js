const { EmbedBuilder, PermissionsBitField, PermissionFlagsBits } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'add',
        description: 'Add a user to a ticket',
        category: 'Tickets',
        options: [{type: 6, name: 'user', description: 'The user to add to the ticket', required: true}],
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
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-permissions-add'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-permissions-add'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();
        const noMention = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-mention-add'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-mention-add'].message))
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

        var bitfield = {};
        bitfield[PermissionFlagsBits.SendMessages] = true;
        bitfield[PermissionFlagsBits.ViewChannel] = true;
        bitfield[PermissionFlagsBits.ReadMessageHistory] = true;

        message.channel.permissionOverwrites.create(user, bitfield).then(() => {

            const success = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.tickets.commands['success-messages']['user-added'].title))
            .setDescription(handleMessage(client, message.member.user, user, message.channel, messages.tickets.commands['success-messages']['user-added'].message))
            .setTimestamp();

            sendMessage({content: `<@!${user.id}>`, embeds: [success]}).catch(err => {});

        }).catch(err => {

            const failed = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.tickets.commands['error-messages']['unknown-error-add'].title))
            .setDescription(handleMessage(client, message.member.user, user, message.channel, messages.tickets.commands['error-messages']['unknown-error-add'].message))
            .setTimestamp();

            sendMessage({embeds: [failed]}).catch(err => {});

            console.log(`Error while trying to add ${user.username} to ticket ${message.channel.name}: `, err);
        });
    }
}