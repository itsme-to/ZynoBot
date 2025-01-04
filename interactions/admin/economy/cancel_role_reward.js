const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-role-item-reward',
        description: 'When a member cancels the role to be given as a reward for the new shop item'
    },
    run: function(client, interaction){
        const interactionInfo = client.interactionActions.get(`new-shop-item-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!interactionInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        client.interactionActions.delete(`new-shop-item-${interaction.member.id}-${interaction.guild.id}`);

        const itemCancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Action cancelled`)
        .setDescription(`The action to add a new shop item with a role as a reward has been cancelled.`)
        .setTimestamp();

        interaction.update({embeds: [itemCancelled], components: []}).catch(err => {});
    }
}