const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-remove-anti-filter-channel',
        description: 'When the channel has been cancelled as a new anti-filter channel'
    },
    run: function(client, interaction){
        const channel = client.interactionActions.get(`remove-anti-filter-channel-${interaction.member.id}-${interaction.guild.id}`);
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
        .setDescription(`The action to remove the channel (<#${channel}>) from the anti-filter channels has been cancelled`)
        .setTimestamp();
        
        client.interactionActions.delete(`remove-anti-filter-channel-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}