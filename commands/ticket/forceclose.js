const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const closeInteraction = require('../../interactions/ticket/delete_ticket.js');
const messageHandler = require('../../handlers/handleMessages.js');
const messages = require('../../messages.json');

module.exports = {
    data: {
        name: 'forceclose',
        description: 'Forceclose this ticket',
        options: [{type: 3, name: 'reason', description: 'The reason why you want to close this ticket'}],
        category: 'Tickets',
        permissions: 'ManageMessages',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-permissions-forceclose'].title))
        .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-permissions-forceclose'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions])) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const noTicket = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets["close-ticket"]["error-messages"]["not-ticket"].title))
        .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets["close-ticket"]["error-messages"]["not-ticket"].message))
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
        
        if(ticketFilter.size === 0) return sendMessage({embeds: [noTicket]}).catch(err => {});

        closeInteraction.run(client, message, interaction);
    }
}