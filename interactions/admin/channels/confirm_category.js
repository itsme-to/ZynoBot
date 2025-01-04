const { EmbedBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'confirm-ticket-category',
        description: 'When the category has been confirmed where the tickets should be placed in'
    },
    run: function(client, interaction){
        const channel = client.interactionActions.get(`ticket-category-${interaction.member.id}-${interaction.guild.id}`);
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();
        if(!channel) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        client.config.tickets.parent[interaction.guild.id] = channel.id;
        configHandler(client, client.config);

        const confirmed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Ticket category saved`)
        .setDescription(`The new ticket category (${channel.name}) has been saved`)
        .setTimestamp();

        client.interactionActions.delete(`ticket-category-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [confirmed], components: []}).catch(err => {});
    }
}