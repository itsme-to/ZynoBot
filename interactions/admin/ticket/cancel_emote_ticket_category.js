const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'ticket-category-cancel-emote',
        description: 'When the emote gets cancelled as the ticket category emote'
    },
    run: function(client, interaction){
        client.interactionActions.delete(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`);

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Cancelled emote`)
        .setDescription(`The action to add the emote to the ticket category has been cancelled`)
        .setTimestamp();

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}