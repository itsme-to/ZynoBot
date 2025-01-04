const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-remove-ticket-category',
        description: 'When the ticket category gets cancelled as ticket category'
    },
    run: function(client, interaction){
        const ticketCategory = client.interactionActions.get(`remove-ticket-category-${interaction.member.id}-${interaction.guild.id}`);

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!ticketCategory) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        client.interactionActions.delete(`remove-ticket-category-${interaction.member.id}-${interaction.guild.id}`);

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Action cancelled`)
        .setDescription(`The action to remove a ticket category has been cancelled`)
        .setTimestamp();

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}