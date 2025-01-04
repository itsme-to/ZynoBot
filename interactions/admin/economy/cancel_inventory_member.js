const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-economy-inventory-member',
        description: 'When the member cancells the action to change someone\'s inventory'
    },
    run: function(client, interaction){
        const inventoryMember = client.interactionActions.get(`change-inventory-member-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!inventoryMember) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Action cancelled`)
        .setDescription(`The action to change <@!${inventoryMember.id}>'s inventory has been cancelled`)
        .setTimestamp();

        client.interactionActions.delete(`change-inventory-member-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}