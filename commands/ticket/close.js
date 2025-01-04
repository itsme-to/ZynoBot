const { EmbedBuilder } = require("discord.js");
const closeInteraction = require('../../interactions/ticket/close_ticket.js');
const messageHandler = require('../../handlers/handleMessages.js');
const messages = require('../../messages.json');
const { wait } = require("../../functions.js");

module.exports = {
    data: {
        name: 'close',
        description: 'Close this ticket',
        options: [],
        category: 'Tickets',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

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

        closeInteraction.run(client, message, !interaction);
    }
}