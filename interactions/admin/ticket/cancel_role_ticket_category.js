const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-ticket-category-role',
        description: 'When the role has been cancelled'
    },
    run: function(client, interaction){
        client.interactionActions.delete(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`);

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Cancelled role access`)
        .setDescription(`The action to give the role access to the ticket category has been cancelled`)
        .setTimestamp();

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}