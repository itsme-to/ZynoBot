const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-level-role-amount',
        description: 'When the level amount of the level role gets cancelled'
    },
    run: function(client, interaction){
        client.interactionActions.delete(`level-role-${interaction.member.id}-${interaction.guild.id}`);

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle('Cancelled')
        .setDescription('The action to create a new level role has been cancelled.')
        .setTimestamp();

        return interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}