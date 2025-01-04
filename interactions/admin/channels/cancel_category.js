const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-ticket-category',
        description: 'When the category has been cancelled as the category where the tickets should be placed in'
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

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Cancelled action`)
        .setDescription(`The action to set the category (${channel.name}>) to the category where the tickets should be placed in has been cancelled`)
        .setTimestamp();
        
        client.interactionActions.delete(`ticket-category-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}