const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-channel',
        description: 'When the channel has been cancelled'
    },
    run: function(client, interaction){
        const channelType = interaction.customId.split('__')[1];
        const channel = client.interactionActions.get(`${channelType}-channel-${interaction.member.id}-${interaction.guild.id}`);
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();
        if(!channel) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        let channelTypeName = channelType.split('-').join(' ');

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Cancelled action`)
        .setDescription(`The action to set the channel (<#${channel.id}>) as the ${channelTypeName} channel has been cancelled`)
        .setTimestamp();
        
        client.interactionActions.delete(`${channelType}-channel-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}