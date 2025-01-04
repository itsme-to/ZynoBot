const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-add-category-action',
        description: 'When the ticket category gets cancelled as ticket category'
    },
    run: function(client, interaction){
        const ticketCategory = client.interactionActions.get(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`);

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!ticketCategory) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        client.interactionActions.delete(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`);

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Action cancelled`)
        .setDescription(`The action to change a ticket category has been cancelled`)
        .setTimestamp();

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}