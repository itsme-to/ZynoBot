const { EmbedBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'tickets',
        description: 'See how many tickets are open or have been closed',
        category: 'General',
        options: [],
        defaultEnabled: true,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);
        const ticketInfo = client.deepCopy(((client.globals.get(`ticket_count`) || {})[message.guild.id] || {closed: 0, open: 0}));

        const ticketEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general['tickets-amount'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general['tickets-amount'].message, [{CLOSED_TICKETS: ticketInfo.closed, OPEN_TICKETS: ticketInfo.open}]))
        .setTimestamp();

        sendMessage({embeds: [ticketEmbed]}).catch(err => {});
    }
}