const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-color-code',
        description: 'Once the new embed color gets cancelled'
    },
    run: function(client, interaction){
        const colorCode = client.interactionActions.get(`change-color-code-${interaction.member.id}`);
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();
        if(!colorCode) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Cancelled action`)
        .setDescription(`The action to change the embed color has been cancelled`)
        .setTimestamp();
        
        client.interactionActions.delete(`change-color-code-${interaction.member.id}`);

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}