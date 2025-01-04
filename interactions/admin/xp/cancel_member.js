const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-xp-member',
        description: 'When the action gets cancelled'
    },
    run: function(client, interaction){
        const xpMember = client.interactionActions.get(`xp-member-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!xpMember) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Action cancelled`)
        .setDescription(`The action to change <@!${xpMember.id}>'s xp has been cancelled`)
        .setTimestamp();

        client.interactionActions.delete(`xp-member-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}